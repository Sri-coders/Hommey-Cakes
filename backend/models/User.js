const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db');
// const sequelize = require("../config/db").sequelize;
const db = require('../config/db');
const sequelize = db.sequelize;

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('Admin', 'User'),
    defaultValue: 'User'
  },
  status: {
    type: DataTypes.ENUM('Active', 'Blocked'),
    defaultValue: 'Active'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profile_image: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = User;
