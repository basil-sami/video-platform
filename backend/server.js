const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const winston = require('winston'); // For logging
const authMiddleware = require('./middleware/authMiddleware'); // Custom authentication middleware

// Import routes
const videoRoutes = require('./routes/videos');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./uploadRoutes');
const recommendation = require('./recommendation');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your client's origin
  credentials: true, // Enable credentials (cookies, authorization headers, etc.)
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Logging middleware setup using winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ],
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.url}`);
  next();
});

// Serve static files (e.g., uploaded videos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use the routes
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', uploadRoutes);

// Recommendations route
app.get('/api/recommendations/:userId', async (req, res) => {
  try {
    const recommendations = await recommendation(req.params.userId);
    res.json(recommendations);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/videoplatform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Add error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    message: err.message,
    error: err
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
