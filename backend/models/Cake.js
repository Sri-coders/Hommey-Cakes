const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Cake = sequelize.define('Cake', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discountPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  flavor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  weight: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 1.00 // standard 1kg cake
  },
  eggless: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  shape: {
    type: DataTypes.STRING,
    defaultValue: 'Round'
  },
  ratings: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.00
  },
  prepTime: {
    type: DataTypes.INTEGER,
    defaultValue: 4 // default 4 hours prep
  },
  deliveryTime: {
    type: DataTypes.STRING,
    defaultValue: 'Next Day Delivery'
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isBestSeller: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('Available', 'Out of Stock'),
    defaultValue: 'Available'
  }
}, {
  timestamps: true
});

module.exports = Cake;
