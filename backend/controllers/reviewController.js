const { Review, Order, OrderItem, Cake, User } = require('../models');

// @desc    Submit a verified customer review for a cake
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { cakeId, rating, comment } = req.body;

    if (!cakeId || !rating || !comment) {
      res.status(400);
      throw new Error('Please fill in rating, comment, and specify cake ID.');
    }

    const numericRating = parseInt(rating);
    if (numericRating < 1 || numericRating > 5) {
      res.status(400);
      throw new Error('Rating must be an integer between 1 and 5 stars.');
    }

    // 1. Premium Check: Has the user actually purchased and received this cake?
    const pastPurchase = await Order.findOne({
      where: {
        userId: req.user.id,
        orderStatus: 'Delivered'
      },
      include: [{
        model: OrderItem,
        as: 'items',
        where: { cakeId: parseInt(cakeId) }
      }]
    });

    if (!pastPurchase) {
      res.status(400);
      throw new Error('Review restricted: You can only review products that you have purchased and received.');
    }

    // 2. Check if user already reviewed this cake
    const alreadyReviewed = await Review.findOne({
      where: { userId: req.user.id, cakeId: parseInt(cakeId) }
    });

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('You have already submitted a review for this cake.');
    }

    // 3. Multi file upload for reviews
    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        uploadedImages.push(file.cloudinaryUrl || `/uploads/${file.filename}`);
      });
    }

    // 4. Create Review
    const review = await Review.create({
      userId: req.user.id,
      cakeId: parseInt(cakeId),
      rating: numericRating,
      comment,
      images: uploadedImages
    });

    // 5. Recalculate Cake average ratings
    const average = await Review.mean('rating', { where: { cakeId: parseInt(cakeId) } });
    const cake = await Cake.findByPk(cakeId);
    if (cake) {
      cake.ratings = parseFloat(average || rating).toFixed(2);
      await cake.save();
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your verified customer review has been posted.',
      review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews of a single cake
// @route   GET /api/reviews/cake/:cakeId
// @access  Public
const getCakeReviews = async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { cakeId: req.params.cakeId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getCakeReviews
};
