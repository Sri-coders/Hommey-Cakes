const { Sequelize } = require('sequelize');
require('mysql2'); // Statically force Vercel to bundle mysql2 dialect driver
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'defaultdb',
  process.env.DB_USER || 'avnadmin',
  process.env.DB_PASSWORD || process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'mysql-5d249c7-hommeycakes.l.aivencloud.com',
    port: process.env.DB_PORT || 11830,
    dialect: 'mysql',
    logging: false, // Set to console.log in development if query inspection is required
    dialectOptions: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && !process.env.DB_HOST.includes('127.0.0.1') ? {
      ssl: {
        rejectUnauthorized: false
      }
    } : {},
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
