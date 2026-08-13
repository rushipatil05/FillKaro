const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    fieldMap:    { type: Object, default: {} },   // { "First Name": "Rushikesh", ... }
    tags:        { type: [String], default: [] },
  },
  { timestamps: true }   // adds createdAt + updatedAt automatically
);

// Keep results ordered by most-recently updated
profileSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Profile', profileSchema);
