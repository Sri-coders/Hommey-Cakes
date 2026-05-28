-- Hommey Cakes Shop Database Schema & Initial Seed Data
-- Database: MySQL

CREATE DATABASE IF NOT EXISTS `hommey_cakes` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hommey_cakes`;

-- --------------------------------------------------------
-- Table `Users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `role` ENUM('Admin', 'User') NOT NULL DEFAULT 'User',
  `status` ENUM('Active', 'Blocked') NOT NULL DEFAULT 'Active',
  `address` TEXT NULL,
  `profile_image` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table `Cakes`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Cakes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `discountPrice` DECIMAL(10, 2) NULL,
  `stockQuantity` INT NOT NULL DEFAULT 0,
  `flavor` VARCHAR(100) NOT NULL,
  `weight` DECIMAL(4, 2) NOT NULL DEFAULT 1.00, -- in kgs (e.g. 0.50, 1.00, 2.00)
  `eggless` BOOLEAN NOT NULL DEFAULT TRUE,
  `shape` VARCHAR(50) NOT NULL DEFAULT 'Round',
  `ratings` DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
  `prepTime` INT NOT NULL DEFAULT 4, -- in hours
  `deliveryTime` VARCHAR(100) NOT NULL DEFAULT 'Next Day Delivery',
  `isFeatured` BOOLEAN NOT NULL DEFAULT FALSE,
  `isBestSeller` BOOLEAN NOT NULL DEFAULT FALSE,
  `status` ENUM('Available', 'Out of Stock') NOT NULL DEFAULT 'Available',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cakes_category` (`category`),
  INDEX `idx_cakes_name` (`name`)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table `CakeImages`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `CakeImages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cakeId` INT NOT NULL,
  `imageUrl` VARCHAR(255) NOT NULL,
  `isVideo` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`cakeId`) REFERENCES `Cakes` (`id`) ON DELETE CASCADE,
  INDEX `idx_cake_images_cakeId` (`cakeId`)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table `Coupons`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Coupons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `discountType` ENUM('Percentage', 'Flat') NOT NULL DEFAULT 'Percentage',
  `discountValue` DECIMAL(10, 2) NOT NULL,
  `minOrderAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `expiryDate` DATE NOT NULL,
  `maxUses` INT NOT NULL DEFAULT 100,
  `usesCount` INT NOT NULL DEFAULT 0,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_coupons_code` (`code`)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table `Orders`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `orderNumber` VARCHAR(100) UNIQUE NOT NULL,
  `totalAmount` DECIMAL(10, 2) NOT NULL,
  `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `couponApplied` VARCHAR(50) NULL,
  `finalAmount` DECIMAL(10, 2) NOT NULL,
  `paymentMethod` ENUM('COD', 'Razorpay') NOT NULL DEFAULT 'COD',
  `paymentStatus` ENUM('Pending', 'Success', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
  `orderStatus` ENUM('Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded') NOT NULL DEFAULT 'Pending',
  `shippingAddress` TEXT NOT NULL,
  `contactPhone` VARCHAR(20) NOT NULL,
  `deliverySlot` VARCHAR(100) NOT NULL DEFAULT 'Standard Delivery',
  `cancelReason` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE,
  INDEX `idx_orders_userId` (`userId`),
  INDEX `idx_orders_number` (`orderNumber`)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table `OrderItems`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `OrderItems` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orderId` INT NOT NULL,
  `cakeId` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10, 2) NOT NULL,
  `weight` DECIMAL(4, 2) NOT NULL,
  `eggless` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`orderId`) REFERENCES `Orders` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`cakeId`) REFERENCES `Cakes` (`id`) ON DELETE CASCADE,
  INDEX `idx_order_items_order` (`orderId`)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table `Reviews`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `cakeId` INT NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT NOT NULL,
  `images` TEXT NULL, -- JSON array of file paths / URLs
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`cakeId`) REFERENCES `Cakes` (`id`) ON DELETE CASCADE,
  INDEX `idx_reviews_cake` (`cakeId`)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table `Gallery`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Gallery` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `mediaUrl` VARCHAR(255) NOT NULL,
  `mediaType` ENUM('Image', 'Video') NOT NULL DEFAULT 'Image',
  `description` VARCHAR(255) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- SEED DATA
-- --------------------------------------------------------

-- 1. Default Admin & Users
-- Default Admin Password is 'Admin@HommeyCakes2026', hashed using bcrypt


INSERT INTO Users 
(id, name, email, password, phone, role, status, address, createdAt, updatedAt)
VALUES 
(
1, 
'Sri Annamalai (Admin)', 
'sriannamalai2003@gmail.com',
'$2a$10$Gu3x0erfGHLk0cef4yQbguYQPVA587S.tZhEasPoyhzkkFE1jihEi',
'9345628924',
'Admin',
'Active',
'Hommey Cakes Shop Headquarters, Admin Suite 1, Chennai, TN',
NOW(),
NOW()
),
(
2,
'Demo Customer',
'customer@gmail.com',
'$2a$10$wKzNn8sR3R8p6pGf3Q7VDe92Pszb3s2H9o0B1E/bK2l5OQ47w8l6G',
'9876543210',
'User',
'Active',
'123 Sweet Street, Flour District, Bangalore, KA',
NOW(),
NOW()
);



-- 2. Cakes Products from Original Template Base
INSERT INTO `Cakes` (`id`, `name`, `category`, `description`, `price`, `discountPrice`, `stockQuantity`, `flavor`, `weight`, `eggless`, `shape`, `ratings`, `prepTime`, `deliveryTime`, `isFeatured`, `isBestSeller`, `status`) VALUES
(1, 'Dozen Cupcakes', 'Cupcake', 'A delicious selection of twelve freshly baked cupcakes, decorated with rich frosting and fine sugar sprinkles. Ideal for birthdays and family celebrations.', 32.00, 28.00, 15, 'Vanilla & Chocolate', 1.00, TRUE, 'Round', 4.8, 2, 'Same Day Delivery', TRUE, TRUE, 'Available'),
(2, 'Cookies and Cream Cake', 'Cake', 'Decadent chocolate layers sandwiched with whipped cream and crushed oreo cookies. Frosted with oreo butter-cream and topped with whole oreos.', 30.00, NULL, 10, 'Chocolate Oreo', 1.50, TRUE, 'Round', 4.9, 4, 'Next Day Delivery', TRUE, TRUE, 'Available'),
(3, 'Gluten Free Mini Dozen', 'Cupcake', 'Deliciously crafted miniature cupcakes for our gluten-sensitive sweet lovers. Flavors include vanilla cream, velvet, and cocoa bliss.', 31.00, 27.50, 8, 'Assorted Fruit & Cocoa', 0.50, TRUE, 'Round', 4.6, 6, 'Next Day Delivery', FALSE, FALSE, 'Available'),
(4, 'Cookie Dough Cake', 'Cake', 'Thick layers of chocolate chip cake loaded with real edible cookie dough, rich cream frosting, and drizzled with milk chocolate ganache.', 25.00, NULL, 5, 'Chocolate Chip Cookie', 1.00, FALSE, 'Square', 4.7, 4, 'Same Day Delivery', TRUE, FALSE, 'Available'),
(5, 'Vanilla Salted Caramel Cake', 'Cake', 'Classic spongy vanilla bean layers drizzled with home-styled buttered salted caramel, layered with Swiss meringue buttercream.', 35.00, 32.00, 12, 'Salted Caramel', 1.00, TRUE, 'Heart', 4.5, 3, 'Same Day Delivery', FALSE, TRUE, 'Available'),
(6, 'German Chocolate Cake', 'Cake', 'Traditional sweet chocolate layer cake filled and topped with a coconut-pecan frosting. Decadent, rich, and loaded with pecans.', 38.00, NULL, 7, 'German Cocoa Pecan', 1.20, FALSE, 'Round', 4.8, 5, 'Next Day Delivery', FALSE, TRUE, 'Available'),
(7, 'Dulce De Leche Cake', 'Cake', 'Fluffy golden vanilla cake filled with rich milk-caramel cream and fresh whipped topping. Coated in caramelized crumbs.', 32.00, 29.00, 10, 'Dulce De Leche', 1.00, TRUE, 'Round', 4.7, 4, 'Same Day Delivery', FALSE, FALSE, 'Available'),
(8, 'Mississippi Mud Cake', 'Cake', 'A dense, gooey chocolate cake topped with melted marshmallows and rich warm chocolate frosting. Absolute bliss for chocolate connoisseurs.', 28.00, NULL, 14, 'Double Dark Chocolate', 1.50, TRUE, 'Round', 4.9, 3, 'Same Day Delivery', TRUE, TRUE, 'Available');

-- 3. Cake Images Links (utilizing template image paths)
INSERT INTO `CakeImages` (`id`, `cakeId`, `imageUrl`, `isVideo`) VALUES
(1, 1, '/uploads/product-1.jpg', FALSE),
(2, 2, '/uploads/product-2.jpg', FALSE),
(3, 3, '/uploads/product-3.jpg', FALSE),
(4, 4, '/uploads/product-4.jpg', FALSE),
(5, 5, '/uploads/product-5.jpg', FALSE),
(6, 6, '/uploads/product-6.jpg', FALSE),
(7, 7, '/uploads/product-7.jpg', FALSE),
(8, 8, '/uploads/product-8.jpg', FALSE);

-- 4. Coupons
INSERT INTO `Coupons` (`id`, `code`, `discountType`, `discountValue`, `minOrderAmount`, `expiryDate`, `maxUses`, `usesCount`, `status`) VALUES
(1, 'WELCOME10', 'Percentage', 10.00, 20.00, '2027-12-31', 1000, 12, 'Active'),
(2, 'HOMMEY50', 'Flat', 50.00, 150.00, '2027-12-31', 500, 3, 'Active'),
(3, 'CAKEFEVER', 'Percentage', 20.00, 50.00, '2027-12-31', 200, 0, 'Active');

-- 5. Gallery Items
INSERT INTO `Gallery` (`id`, `mediaUrl`, `mediaType`, `description`, `isActive`) VALUES
(1, '/uploads/product-1.jpg', 'Image', 'Our freshly baked strawberry muffins', TRUE),
(2, '/uploads/product-2.jpg', 'Image', 'Elegant wedding tiered cake', TRUE),
(3, '/uploads/product-3.jpg', 'Image', 'Signature mini red velvets', TRUE),
(4, '/uploads/product-4.jpg', 'Image', 'Double fudge cookies standard pack', TRUE),
(5, '/uploads/media-1779798539972-951055709.mp4', 'Video', 'Exquisite Decorating and Cake Frosting Showcase Reel', TRUE);

-- 6. Sample Reviews
INSERT INTO `Reviews` (`id`, `userId`, `cakeId`, `rating`, `comment`) VALUES
(1, 2, 2, 5, 'Absolutely spectacular! The crushed Oreo frosting was incredibly delicious. Highly recommend this cake for cookie lovers.'),
(2, 2, 8, 5, 'Extremely gooey and rich. Tastes exactly like a standard Mississippi mud cake should. Will order again next weekend!');
