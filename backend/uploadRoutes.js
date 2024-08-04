const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Video = require('./models/Video'); // Adjust the path as needed

// Helper function to sanitize file names
const sanitizeFileName = (fileName) => {
  return fileName.replace(/[^a-zA-Z0-9.]/g, '_');
};

// Configure multer with disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const sanitizedFileName = sanitizeFileName(file.originalname);
    const uniqueName = `${Date.now()}-${sanitizedFileName}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// Define the upload route
router.post('/upload', upload.fields([{ name: 'video' }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description, category,userId } = req.body;
    const videoFile = req.files['video'][0];
    const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

    // Handle video and thumbnail files
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Category:', category);
    console.log('Video File:', videoFile);
    console.log('Thumbnail File:', thumbnailFile);

    // Save metadata to the database
    const video = new Video({
      title,
      description,
      category,
      videoPath: videoFile.filename,
      thumbnailPath: thumbnailFile ? thumbnailFile.filename : null,
      uploadDate: new Date(),
      user: userId 
    });

    await video.save();

    // Respond with success
    res.status(200).json({ message: 'Video uploaded successfully!', video });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to upload video.' });
  }
});

module.exports = router;
