const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cakeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  weight: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false
  },
  eggless: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  shape: {
    type: DataTypes.STRING,
    defaultValue: 'Round'
  },
  flavor: {
    type: DataTypes.STRING,
    defaultValue: 'Standard'
  }
}, {
  timestamps: true
});

module.exports = OrderItem;
