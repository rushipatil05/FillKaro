const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    domain:      { type: String, default: '' },
    url:         { type: String, default: '' },
    title:       { type: String, default: '' },
    fieldCount:  { type: Number, default: 0 },
    filledCount: { type: Number, default: 0 },
    profileUsed: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },
    profileName: { type: String, default: '' },
    status:      { type: String, enum: ['complete', 'partial', 'failed'], default: 'partial' },
  },
  { timestamps: true }
);

historySchema.index({ createdAt: -1 });

module.exports = mongoose.model('History', historySchema);
