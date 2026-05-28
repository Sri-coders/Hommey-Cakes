const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'hommey_cakes',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false, // Set to console.log in development if query inspection is required
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+05:30' // Match localized Indian Standard Time or standard timezone
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Database connected successfully through Sequelize.');
  } catch (error) {
    console.error('Sequelize Database authentication error:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
