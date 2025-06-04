const db = require('../config/db');

exports.createUser = async (name, email, passwordHash) => {
  const [rows] = await db.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, passwordHash]);
  return rows;
};

exports.findUserByEmail = async (email) => {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};


exports.updateUserPassword = async (id,passwordHash) => {
  const [rows] = await db.execute('UPDATE users SET password = ? WHERE id = ?',[passwordHash, id])
  return rows;
}

