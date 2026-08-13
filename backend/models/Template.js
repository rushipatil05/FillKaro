const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema(
  {
    label:       { type: String, default: '' },
    name:        { type: String, default: '' },
    id:          { type: String, default: '' },
    type:        { type: String, default: '' },
    placeholder: { type: String, default: '' },
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    domain:        { type: String, default: '' },
    url:           { type: String, default: '' },
    fields:        { type: [fieldSchema], default: [] },
    mappedProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },
  },
  { timestamps: true }
);

templateSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Template', templateSchema);
