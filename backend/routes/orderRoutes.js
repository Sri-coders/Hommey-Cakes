const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderById,
  cancelOrder,
  generateInvoicePDF,
  getAllOrdersAdmin,
  updateOrderStatusAdmin
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middlewares/auth');

// All order endpoints require dynamic JWT authorization
router.use(protect);

// User endpoints
router.post('/', createOrder);
router.post('/verify-payment', verifyPayment);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);
router.get('/:id/invoice', generateInvoicePDF);

// Admin-restricted endpoints
router.get('/admin/all', adminOnly, getAllOrdersAdmin);
router.put('/admin/:id/status', adminOnly, updateOrderStatusAdmin);

module.exports = router;
