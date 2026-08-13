const express  = require('express');
const Template = require('../models/Template');

const router = express.Router();

/* GET /api/templates */
router.get('/', async (_req, res) => {
  try {
    const templates = await Template.find()
      .populate('mappedProfile', 'name')
      .sort({ updatedAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/templates/:id */
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id).populate('mappedProfile');
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/templates */
router.post('/', async (req, res) => {
  try {
    const template = await Template.create(req.body);
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* PUT /api/templates/:id */
router.put('/:id', async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* DELETE /api/templates/:id */
router.delete('/:id', async (req, res) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
