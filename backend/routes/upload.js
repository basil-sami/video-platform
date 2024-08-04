const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Video = require('../models/Video'); // Import the Video model

// Setup Multer for file handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Videos Only!');
    }
  }
});

// Route to handle video and thumbnail uploads
router.post('/upload', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
  // Log incoming request data
  console.log('Request body:', req.body);
  console.log('Files:', req.files);

  const { title, description, category, userId } = req.body;
  console.log('userId:', userId);
  
  // Retrieve file paths
  const videoFile = req.files.video ? req.files.video[0].filename : null;
  const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0].filename : null;
  console.log('Video file:', videoFile);
  console.log('Thumbnail file:', thumbnailFile);

  // Check required fields and files
  if (!title || !videoFile || !userId) {
    console.log('Error: Title, video file, and user ID are required');
    return res.status(400).json({ error: 'Title, video file, and user ID are required' });
  }

  if (!thumbnailFile) {
    console.log('Error: Thumbnail file is required');
    return res.status(400).json({ error: 'Thumbnail file is required' });
  }

  // Create and save video
  const video = new Video({
    title,
    description,
    category,
    videoPath: videoFile,
    thumbnailPath: thumbnailFile,
    uploadDate: new Date(),
    user: userId // Save the user ID
  });

  console.log('Saving video:', video);

  try {
    await video.save();
    console.log('Video saved successfully');
    res.status(200).json({ message: 'Files uploaded and metadata saved successfully', video });
  } catch (err) {
    console.error('Error saving video:', err);
    res.status(500).json({ error: 'Failed to upload files', details: err.message });
  }
});

module.exports = router;
