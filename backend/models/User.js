// path: backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String }, // URL or filename for the avatar image
  bio: { type: String },
  personalDetails: {
    name: { type: String },
    dateOfBirth: { type: Date }
  },
  privacySettings: {
    showEmail: { type: Boolean, default: true },
    showBio: { type: Boolean, default: true },
    showPersonalDetails: { type: Boolean, default: true }
  },
  watchedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  role: { type: String, default: 'user' }, 
});

// Hash the password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare provided password with stored hash
UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
