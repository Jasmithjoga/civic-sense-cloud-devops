const express = require('express');
const router = express.Router();
const { getAllComplaints, updateStatus, assignDepartment } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require JWT + admin role
router.use(protect, adminOnly);

router.get('/complaints', getAllComplaints);
router.patch('/complaints/:id/status', updateStatus);
router.patch('/complaints/:id/assign', assignDepartment);

module.exports = router;
