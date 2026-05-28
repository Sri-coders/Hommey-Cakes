const Coupon = require('../models/Coupon');

// @desc    Validate coupon against a basket total
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = async (req, res, next) => {
  try {
    const { code, totalAmount } = req.body;

    if (!code || !totalAmount) {
      res.status(400);
      throw new Error('Please enter both coupon code and checkout amount.');
    }

    const coupon = await Coupon.findOne({ where: { code, status: 'Active' } });
    if (!coupon) {
      res.status(400);
      throw new Error('Coupon is invalid or inactive.');
    }

    // Expiry Check
    if (new Date(coupon.expiryDate) < new Date()) {
      res.status(400);
      throw new Error('Coupon code has expired.');
    }

    // Minimum check
    if (parseFloat(totalAmount) < parseFloat(coupon.minOrderAmount)) {
      res.status(400);
      throw new Error(`Minimum purchase of $${coupon.minOrderAmount} required for this discount.`);
    }

    // Max uses check
    if (coupon.usesCount >= coupon.maxUses) {
      res.status(400);
      throw new Error('Coupon maximum usage threshold reached.');
    }

    res.status(200).json({
      success: true,
      message: `Coupon "${code}" applied successfully!`,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons (Admin only)
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json({
      success: true,
      coupons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new discount coupon (Admin only)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, expiryDate, maxUses } = req.body;

    if (!code || !discountType || !discountValue || !expiryDate) {
      res.status(400);
      throw new Error('Please fill in code, discount type, value, and expiration date.');
    }

    const exists = await Coupon.findOne({ where: { code } });
    if (exists) {
      res.status(400);
      throw new Error('Coupon code already exists in directory.');
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue: parseFloat(discountValue),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0.00,
      expiryDate,
      maxUses: maxUses ? parseInt(maxUses) : 100
    });

    res.status(201).json({
      success: true,
      message: 'New coupon created successfully.',
      coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon code (Admin only)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      res.status(404);
      throw new Error('Coupon not found.');
    }

    await coupon.destroy();

    res.status(200).json({
      success: true,
      message: 'Coupon code successfully deleted.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCoupon,
  getCoupons,
  createCoupon,
  deleteCoupon
};
