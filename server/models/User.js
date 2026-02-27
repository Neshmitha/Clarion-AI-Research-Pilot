const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // Profile Fields
  fullName: { type: String, default: '' },
  role: { type: String, enum: ['Student', 'Researcher', 'Professor', 'Industry', ''], default: '' },
  bio: { type: String, default: '' },
  researchInterests: { type: String, default: '' }, // COMMA SEPARATED string

  // Rating and Stats
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 }
}, { timestamps: true, collection: 'auth' });

module.exports = mongoose.model('User', UserSchema);
