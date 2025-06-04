const express = require('express');
const app = express();
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes')
const cors = require('cors');
const authMiddleware = require('./middlewares/auth.middleware');
const path = require('path');
require('dotenv').config();

app.use(cors());
app.use(express.json({ limit: '1mb' })); // or higher if needed


// Serve static files from the React app build
app.use(express.static(path.join(__dirname, 'build'))); // or 'dist' if that's your folder

// Handle React routing, return index.html for unknown routes

app.use('/api/auth', authRoutes);
app.use('/api',courseRoutes);




app.get('/{*any}', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});



module.exports = app;
