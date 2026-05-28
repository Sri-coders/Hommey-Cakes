const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  couponApplied: {
    type: DataTypes.STRING,
    allowNull: true
  },
  finalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('COD', 'Razorpay'),
    defaultValue: 'COD'
  },
  paymentStatus: {
    type: DataTypes.ENUM('Pending', 'Success', 'Failed', 'Refunded'),
    defaultValue: 'Pending'
  },
  orderStatus: {
    type: DataTypes.ENUM('Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'),
    defaultValue: 'Pending'
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deliverySlot: {
    type: DataTypes.STRING,
    defaultValue: 'Standard Delivery'
  },
  cancelReason: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Order;
