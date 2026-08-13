const express = require('express');
const History = require('../models/History');

const router = express.Router();

/* GET /api/history?page=1&limit=20 */
router.get('/', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      History.find()
        .populate('profileUsed', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      History.countDocuments(),
    ]);

    res.json({ docs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/history/stats */
router.get('/stats', async (_req, res) => {
  try {
    const [total, complete, partial, agg] = await Promise.all([
      History.countDocuments(),
      History.countDocuments({ status: 'complete' }),
      History.countDocuments({ status: 'partial' }),
      History.aggregate([
        {
          $group: {
            _id: null,
            totalFilled: { $sum: '$filledCount' },
            totalFields: { $sum: '$fieldCount' },
          },
        },
      ]),
    ]);

    const failed      = total - complete - partial;
    const totalFilled = agg[0]?.totalFilled ?? 0;
    const totalFields = agg[0]?.totalFields ?? 0;

    res.json({ total, complete, partial, failed, totalFilled, totalFields });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/history */
router.post('/', async (req, res) => {
  try {
    const history = await History.create(req.body);
    res.status(201).json(history);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* DELETE /api/history/:id */
router.delete('/:id', async (req, res) => {
  try {
    const history = await History.findByIdAndDelete(req.params.id);
    if (!history) return res.status(404).json({ error: 'History not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
