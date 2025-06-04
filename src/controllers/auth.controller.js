const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');
const nodemailer = require('nodemailer');
const helper = require("../utils/helper")
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();


const otpStore = new Map(); // temporary OTP storage
const passwordResetMap = new Map();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});


exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const otp = helper.generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // expires in 5 minutes
    otpStore.set(email, { otp, name, password, expiresAt });

    await transporter.sendMail({
      from: '"Pahamin" pahamin.system@gmail.com',
      to: email,
      subject: 'Pahamin Registration OTP Code',
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`
    });

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);

  if (!record) return res.status(400).json({ message: 'OTP not requested or expired' });
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ message: 'OTP expired' });
  }

  if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

  // OTP benar, simpan user ke database
  try {
    const hashedPassword = await bcrypt.hash(record.password, 10);
    await userModel.createUser(record.name, email, hashedPassword);
    otpStore.delete(email);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findUserByEmail(email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id,email:user.email, username: user.name, profile_pciture:user.profile_picture, created_at:user.created_at }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userModel.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'Email not registered' });

    const token = uuidv4();

    // Simpan email + UUID dengan TTL 5 menit
    passwordResetMap.set(token, email);
    setTimeout(() => passwordResetMap.delete(token), 5 * 60 * 1000); // TTL 5 menit

    const resetLink = `${process.env.DOMAIN}/auth/reset-password/${token}`;

    await transporter.sendMail({
      from: '"Pahamin" pahamin.system@gmail.com',
      to: email,
      subject: 'Reset Password Link',
      html: `<p>Click the link below to reset your password. Link valid for 5 minutes:</p>
             <a href="${resetLink}">${resetLink}</a>`
    });

    res.status(200).json({ message: 'Reset link sent to email' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Validasi UUID (opsional, jika frontend ingin cek link valid)
exports.validateResetToken = (req, res) => {
  const { token } = req.params;

  if (passwordResetMap.has(token)) {
    res.status(200).json({ valid: true });
  } else {
    res.status(400).json({ valid: false, message: 'Invalid or expired token' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const email = passwordResetMap.get(token);
  if (!email) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await userModel.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hash = await bcrypt.hash(newPassword, 10);
    await userModel.updateUserPassword(user.id, hash);

    // Hapus token dari map
    passwordResetMap.delete(token);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

