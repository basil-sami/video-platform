// models/Video.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
});

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  videoPath: { type: String, required: true },
  thumbnailPath: { type: String },
  uploadDate: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  tags: [String],
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  comments: [CommentSchema],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Reference to User model
});

module.exports = mongoose.model('Video', VideoSchema);
