const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video'); // Ensure you have the Video model
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
//const authenticateToken = require('../middleware/authMiddleware');


// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for file uploads (e.g., avatar images)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image file'));
    }
    cb(null, true);
  },
});

// Middleware to check authentication and set req.user
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token is invalid' });
    req.user = decoded; // Set req.user to the decoded token
    next();
  });
};

// Logging middleware to track access to profile-related routes
const logProfileAccess = (req, res, next) => {
  console.log(`Access attempt to profile page: ${req.method} ${req.originalUrl}`);
  next();
};

// Get user profile
router.get('/profile', async (req, res) => {
  const userId = req.query.userId;
      let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (username) {
      user = await User.findOne({ username });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const videos = await Video.find({ userId: user._id });

    res.json({ user, videos });

});

// Register new user with default role as 'user'
router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const { username, email, password, bio } = req.body;

    let personalDetails = req.body.personalDetails;
    let privacySettings = req.body.privacySettings;

    // Parse JSON strings only if they are strings
    if (typeof personalDetails === 'string') {
      personalDetails = JSON.parse(personalDetails);
    }

    if (typeof privacySettings === 'string') {
      privacySettings = JSON.parse(privacySettings);
    }

    // Check if the request includes a file
    let avatarPath = null;
    if (req.file) {
      avatarPath = req.file.path;
    }

    const user = new User({
      username,
      email,
      password,
      bio,
      personalDetails,
      privacySettings,
      avatar: avatarPath,
      role: 'user', // Set default role to 'user'
    });

    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Add a watched video
router.post('/watch/:userId/:videoId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.watchedVideos.push(req.params.videoId);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Update user profile
router.put('/profile/:userId', logProfileAccess, authenticate, async (req, res) => {
  try {
    console.log(`Update profile attempt for user ID: ${req.params.userId}`);
    const { bio, personalDetails, privacySettings, role } = req.body;
    if (!req.user || req.user.id !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (bio) user.bio = bio;
    if (personalDetails) {
      user.personalDetails = {
        ...user.personalDetails,
        ...personalDetails,
      };
    }
    if (privacySettings) {
      user.privacySettings = {
        ...user.privacySettings,
        ...privacySettings,
      };
    }
    if (role) user.role = role; // Update role if provided

    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Upload avatar
router.post('/avatar/:userId', upload.single('avatar'), authenticate, async (req, res) => {
  try {
    console.log('Avatar upload attempt:', req.file); // Log the uploaded file to check if it's received
    if (!req.user || req.user.id !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarPath = req.file.path;
    user.avatar = avatarPath;
    await user.save();
    res.json({ avatar: avatarPath });
  } catch (err) {
    console.error('Error uploading avatar:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Serve avatar images
router.get('/avatars/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads/avatars/', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).send('Access denied. No token provided.');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send('Invalid token.');
  }
};

// Get current user from token
router.get('/current-user', authenticateToken, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Extract token from header
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar // Include avatar if it exists
      }
    });
  } catch (err) {
    console.error('Failed to retrieve w current user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Example of a Node.js/Express endpoint

// Middleware to authenticate JWT token

router.get('/api/users/current', authenticateToken, async (req, res) => {
    console.log('buh0',req.user._id)
    const user = await User.findById(req.user._id).select('-password'); // Adjust based on your user model
    if (!user) return res.status(404).send('User not found.');
    res.send(user);
  
    res.status(500).send('Server error');

});


module.exports = router;
