const { sequelize } = require('../config/db');
const User = require('./User');
const Cake = require('./Cake');
const CakeImage = require('./CakeImage');
const Coupon = require('./Coupon');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');
const Gallery = require('./Gallery');

// Define Relationships

// 1. User & Order
User.hasMany(Order, { foreignKey: 'userId', as: 'orders', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 2. Order & OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// 3. Cake & OrderItem
Cake.hasMany(OrderItem, { foreignKey: 'cakeId', as: 'orderItems', onDelete: 'CASCADE' });
OrderItem.belongsTo(Cake, { foreignKey: 'cakeId', as: 'cake' });

// 4. Cake & CakeImage
Cake.hasMany(CakeImage, { foreignKey: 'cakeId', as: 'images', onDelete: 'CASCADE' });
CakeImage.belongsTo(Cake, { foreignKey: 'cakeId', as: 'cake' });

// 5. User & Review
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 6. Cake & Review
Cake.hasMany(Review, { foreignKey: 'cakeId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Cake, { foreignKey: 'cakeId', as: 'cake' });

module.exports = {
  sequelize,
  User,
  Cake,
  CakeImage,
  Coupon,
  Order,
  OrderItem,
  Review,
  Gallery
};
