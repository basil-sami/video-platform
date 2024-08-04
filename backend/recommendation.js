// path: backend/recommendation.js
const User = require('./models/User');
const Video = require('./models/Video');

const recommendVideos = async (userId) => {
  try {
    const user = await User.findById(userId).populate('watchedVideos');
    if (!user) throw new Error('User not found');

    const watchedTags = new Set();
    user.watchedVideos.forEach(video => video.tags.forEach(tag => watchedTags.add(tag)));

    const recommendations = await Video.find({
      tags: { $in: Array.from(watchedTags) },
      _id: { $nin: user.watchedVideos.map(video => video._id) }
    }).limit(10);

    return recommendations;
  } catch (err) {
    throw new Error('Error recommending videos');
  }
};

module.exports = recommendVideos;
