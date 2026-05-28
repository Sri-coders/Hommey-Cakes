const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  toggleBlockUser,
  generateSalesReportPDF
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/auth');

// All admin dashboard endpoints require strict validation
router.use(protect);
router.use(adminOnly);

router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/sales-report', generateSalesReportPDF);
router.get('/users', getUsers);
router.put('/users/:id/block', toggleBlockUser);

module.exports = router;
