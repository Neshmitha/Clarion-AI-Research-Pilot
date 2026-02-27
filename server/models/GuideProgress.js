const mongoose = require('mongoose');

const GuideProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    phases: { type: Object, default: {} },
    xp: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('GuideProgress', GuideProgressSchema);
