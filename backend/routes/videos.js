const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const mongoose = require('mongoose');
const getAllCommentsWithUsers = async (videoId) => {
  try {
    const video = await Video.findById(videoId).populate({
      path: 'comments.userId',
      select: 'username avatar',
      populate: {
        path: 'userId',
        model: 'User',
        select: 'username avatar',
      },
    }).exec();

    if (!video) {
      throw new Error('Video not found');
    }

    const commentsWithUsers = video.comments.map(comment => {
      return {
        _id: comment._id,
        text: comment.text,
        date: comment.date,
        user: {
          username: comment.userId.username,
          avatar: comment.userId.avatar,
        }
      };
    });

    return commentsWithUsers;
  } catch (error) {
    console.error('Error retrieving comments:', error);
    throw error;
  }
};

// Get all videos
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch videos', error: err });
  }
});

// Get video by ID
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch video', error: err });
  }
});

// Add a new video
router.post('/', async (req, res) => {
  try {
    const { title, description, category, videoPath, thumbnailPath } = req.body;
    if (!title || !videoPath) {
      return res.status(400).json({ message: 'Title and video path are required' });
    }
    const newVideo = new Video({
      title,
      description,
      category,
      videoPath,
      thumbnailPath,
      uploadDate: new Date(),
    });
    const savedVideo = await newVideo.save();
    res.json(savedVideo);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add video', error: err });
  }
});

// Add a comment to a video
router.post('/:id/comments', async (req, res) => {
  console.log('Received POST request to add comment');

  // Step 1: Find the video by ID
  console.log('Finding video with ID:', req.params.id);
  const video = await Video.findById(req.params.id);
  if (!video) {
    console.log('Video not found');
    return res.status(404).json({ message: 'Video not found' });
  }
  console.log('Video found:', video);
  const userId = mongoose.Types.ObjectId(req.body.userId);
  // Step 2: Create a new comment
  const comment = {
    text: req.body.text,
    userId: req.body.userId, // Assuming userId is provided in the request body
  };
  console.log('Creating comment:', comment);

  // Step 3: Add comment to the video and save
  video.comments.push(comment);
  console.log('Adding comment to video');
  await video.save();
  console.log('Comment added and video saved');

  // Step 4: Respond with the new comment
  console.log('Sending response with comment:', comment);
  res.json(comment);
});
// Like a video
router.post('/:id/like', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    video.likes += 1;
    await video.save();
    res.json({ likes: video.likes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to like video', error: err });
  }
});

// Dislike a video
router.post('/:id/dislike', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    video.dislikes += 1;
    await video.save();
    res.json({ dislikes: video.dislikes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to dislike video', error: err });
  }
});

router.get('/:id/comments', async (req, res) => {
  console.log('Fetching video by ID...');
  
  Video.findById(req.params.id)
    .populate({
      path: 'comments.userId',
      select: 'username avatar',
    })
    .exec()
    .then(video => {
      if (!video) {
        console.log('Video not found');
        return res.status(404).json({ message: 'Video not found' });
      }

      console.log('Video found, sorting comments by date...');
      // Sort comments by date in descending order
      const sortedComments = video.comments.sort((a, b) => b.date - a.date);

      console.log('Preparing comments with user details...');
      // Ensure to pass the text and date of each comment
      const commentsWithUserDetails = sortedComments.map(comment => ({
        _id: comment._id,
        text: comment.text,
        date: comment.date,
        user: comment.userId // Includes the populated user details
      }));

      res.json(commentsWithUserDetails);
      
    })
    .catch(err => {
      console.error('Error fetching video and comments:', err);
      res.status(500).json({ message: 'Failed to fetch video and comments', error: err });
    });
});


module.exports = router;
