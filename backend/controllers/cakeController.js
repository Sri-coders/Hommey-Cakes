const { Op } = require('sequelize');
const { Cake, CakeImage, Review, User } = require('../models');
const { sendNewCakeAlert } = require('../utils/mailer');
const fs = require('fs');
const path = require('path');

// @desc    Get all cakes with filtering, sorting, and pagination
// @route   GET /api/cakes
// @access  Public
const getCakes = async (req, res, next) => {
  try {
    const {
      search,
      category,
      priceMin,
      priceMax,
      flavor,
      eggless,
      weight,
      sort,
      page = 1,
      limit = 8
    } = req.query;

    const queryOptions = {
      where: {},
      include: [{ model: CakeImage, as: 'images' }],
      distinct: true
    };

    // Filters
    if (search) {
      queryOptions.where.name = { [Op.like]: `%${search}%` };
    }

    if (category) {
      queryOptions.where.category = category;
    }

    if (priceMin || priceMax) {
      queryOptions.where.price = {};
      if (priceMin) queryOptions.where.price[Op.gte] = parseFloat(priceMin);
      if (priceMax) queryOptions.where.price[Op.lte] = parseFloat(priceMax);
    }

    if (flavor) {
      queryOptions.where.flavor = { [Op.like]: `%${flavor}%` };
    }

    if (eggless !== undefined && eggless !== '') {
      queryOptions.where.eggless = eggless === 'true' || eggless === '1';
    }

    if (weight) {
      queryOptions.where.weight = parseFloat(weight);
    }

    // Sorting
    let orderBy = [['createdAt', 'DESC']]; // default latest
    if (sort) {
      switch (sort) {
        case 'PriceLowToHigh':
          orderBy = [['price', 'ASC']];
          break;
        case 'PriceHighToLow':
          orderBy = [['price', 'DESC']];
          break;
        case 'Popular':
        case 'RatingsHighToLow':
          orderBy = [['ratings', 'DESC']];
          break;
        case 'Latest':
          orderBy = [['createdAt', 'DESC']];
          break;
      }
    }
    queryOptions.order = orderBy;

    // Pagination
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    queryOptions.limit = parsedLimit;
    queryOptions.offset = offset;

    const { count, rows } = await Cake.findAndCountAll(queryOptions);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      cakes: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single cake details
// @route   GET /api/cakes/:id
// @access  Public
const getCakeById = async (req, res, next) => {
  try {
    const cake = await Cake.findByPk(req.params.id, {
      include: [
        { model: CakeImage, as: 'images' },
        {
          model: Review,
          as: 'reviews',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
        }
      ]
    });

    if (!cake) {
      res.status(404);
      throw new Error('Cake not found.');
    }

    res.status(200).json({
      success: true,
      cake
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Featured and Best Seller Cakes
// @route   GET /api/cakes/featured
// @access  Public
const getFeaturedCakes = async (req, res, next) => {
  try {
    const featured = await Cake.findAll({
      where: {
        [Op.or]: [{ isFeatured: true }, { isBestSeller: true }]
      },
      include: [{ model: CakeImage, as: 'images' }],
      limit: 8
    });

    res.status(200).json({
      success: true,
      cakes: featured
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Cake item (Admin only)
// @route   POST /api/cakes
// @access  Private/Admin
const createCake = async (req, res, next) => {
  try {
    const {
      name,
      category,
      description,
      price,
      discountPrice,
      stockQuantity,
      flavor,
      weight,
      eggless,
      shape,
      prepTime,
      deliveryTime,
      isFeatured,
      isBestSeller
    } = req.body;

    if (!name || !category || !description || !price || !flavor) {
      res.status(400);
      throw new Error('Please fill in name, category, description, price, and flavor.');
    }

    const cake = await Cake.create({
      name,
      category,
      description,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
      flavor,
      weight: weight ? parseFloat(weight) : 1.00,
      eggless: eggless === 'true' || eggless === '1' || eggless === true,
      shape: shape || 'Round',
      prepTime: prepTime ? parseInt(prepTime) : 4,
      deliveryTime: deliveryTime || 'Next Day Delivery',
      isFeatured: isFeatured === 'true' || isFeatured === '1' || isFeatured === true,
      isBestSeller: isBestSeller === 'true' || isBestSeller === '1' || isBestSeller === true,
      status: stockQuantity && parseInt(stockQuantity) > 0 ? 'Available' : 'Out of Stock'
    });

    // Save multi images if files uploaded
    let finalImages = [];
    if (req.files && req.files.length > 0) {
      const imgRecords = req.files.map(file => ({
        cakeId: cake.id,
        imageUrl: `/uploads/${file.filename}`,
        isVideo: file.mimetype.startsWith('video/')
      }));
      const createdImages = await CakeImage.bulkCreate(imgRecords);
      finalImages = createdImages;
    } else {
      // Create a fallback mock image if none provided
      const defaultImg = await CakeImage.create({
        cakeId: cake.id,
        imageUrl: '/uploads/product-1.jpg',
        isVideo: false
      });
      finalImages = [defaultImg];
    }

    // Trigger SMTP notification alerts to all users in system!
    User.findAll({ where: { role: 'User', status: 'Active' } })
      .then(users => {
        users.forEach(u => {
          sendNewCakeAlert(u, cake).catch(err => console.error('Cake announcement email error:', err.message));
        });
      })
      .catch(err => console.error('Failed to retrieve email list:', err.message));

    res.status(201).json({
      success: true,
      message: 'New Cake successfully added and email notifications sent to users.',
      cake,
      images: finalImages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a Cake item (Admin only)
// @route   PUT /api/cakes/:id
// @access  Private/Admin
const updateCake = async (req, res, next) => {
  try {
    const {
      name,
      category,
      description,
      price,
      discountPrice,
      stockQuantity,
      flavor,
      weight,
      eggless,
      shape,
      prepTime,
      deliveryTime,
      isFeatured,
      isBestSeller,
      status
    } = req.body;

    const cake = await Cake.findByPk(req.params.id);
    if (!cake) {
      res.status(404);
      throw new Error('Cake not found.');
    }

    // Update fields
    if (name) cake.name = name;
    if (category) cake.category = category;
    if (description) cake.description = description;
    if (price) cake.price = parseFloat(price);
    if (discountPrice !== undefined) cake.discountPrice = discountPrice ? parseFloat(discountPrice) : null;
    if (stockQuantity !== undefined) {
      cake.stockQuantity = parseInt(stockQuantity);
      cake.status = parseInt(stockQuantity) > 0 ? 'Available' : 'Out of Stock';
    }
    if (status) cake.status = status;
    if (flavor) cake.flavor = flavor;
    if (weight) cake.weight = parseFloat(weight);
    if (eggless !== undefined) cake.eggless = eggless === 'true' || eggless === '1' || eggless === true;
    if (shape) cake.shape = shape;
    if (prepTime) cake.prepTime = parseInt(prepTime);
    if (deliveryTime) cake.deliveryTime = deliveryTime;
    if (isFeatured !== undefined) cake.isFeatured = isFeatured === 'true' || isFeatured === '1' || isFeatured === true;
    if (isBestSeller !== undefined) cake.isBestSeller = isBestSeller === 'true' || isBestSeller === '1' || isBestSeller === true;

    await cake.save();

    // If new files uploaded, replace or add images
    if (req.files && req.files.length > 0) {
      // Remove previous images from disk & table
      const previousImages = await CakeImage.findAll({ where: { cakeId: cake.id } });
      for (const img of previousImages) {
        const filePath = path.join(__dirname, '..', img.imageUrl);
        if (fs.existsSync(filePath) && !img.imageUrl.includes('product-')) {
          fs.unlinkSync(filePath);
        }
      }
      await CakeImage.destroy({ where: { cakeId: cake.id } });

      // Add new uploads
      const imgRecords = req.files.map(file => ({
        cakeId: cake.id,
        imageUrl: `/uploads/${file.filename}`,
        isVideo: file.mimetype.startsWith('video/')
      }));
      await CakeImage.bulkCreate(imgRecords);
    }

    const updatedCake = await Cake.findByPk(cake.id, {
      include: [{ model: CakeImage, as: 'images' }]
    });

    res.status(200).json({
      success: true,
      message: 'Cake details successfully updated.',
      cake: updatedCake
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a Cake item (Admin only)
// @route   DELETE /api/cakes/:id
// @access  Private/Admin
const deleteCake = async (req, res, next) => {
  try {
    const cake = await Cake.findByPk(req.params.id);
    if (!cake) {
      res.status(404);
      throw new Error('Cake not found.');
    }

    // Delete static files from uploads folder
    const images = await CakeImage.findAll({ where: { cakeId: cake.id } });
    for (const img of images) {
      const filePath = path.join(__dirname, '..', img.imageUrl);
      if (fs.existsSync(filePath) && !img.imageUrl.includes('product-')) {
        fs.unlinkSync(filePath);
      }
    }

    // Relational deletion (Cascade DB takes care, but just in case)
    await Cake.destroy({ where: { id: cake.id } });

    res.status(200).json({
      success: true,
      message: 'Cake item and associated media deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCakes,
  getCakeById,
  getFeaturedCakes,
  createCake,
  updateCake,
  deleteCake
};
