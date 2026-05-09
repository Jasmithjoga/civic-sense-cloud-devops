const express = require('express');
const router = express.Router();
const { issuesByType, statusBreakdown, hotspots, monthly, summary } = require('../controllers/analyticsController');

// Analytics routes — public (admins access from frontend with role guard)
router.get('/issues-by-type', issuesByType);
router.get('/status-breakdown', statusBreakdown);
router.get('/hotspots', hotspots);
router.get('/monthly', monthly);
router.get('/summary', summary);

module.exports = router;
