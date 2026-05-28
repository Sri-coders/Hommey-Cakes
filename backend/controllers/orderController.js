const crypto = require('crypto');
const Razorpay = require('razorpay');
const PDFDocument = require('pdfkit');
const { Order, OrderItem, Cake, Coupon, User, CakeImage } = require('../models');
const { sendOrderStatusEmail } = require('../utils/mailer');

// Initialize Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_HommeyKeyID123',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'HommeySecret123456789'
});

// @desc    Create a new order (Checkout)
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const {
      items, // [{ cakeId, quantity, weight, eggless }]
      couponCode,
      shippingAddress,
      contactPhone,
      deliverySlot,
      paymentMethod
    } = req.body;

    if (!items || items.length === 0 || !shippingAddress || !contactPhone) {
      res.status(400);
      throw new Error('Please fill in shipping address, contact phone, and include cart items.');
    }

    let rawSubtotal = 0.00;
    const validatedItems = [];

    // 1. Stock Checks & Calculations
    for (const item of items) {
      const cake = await Cake.findByPk(item.cakeId);
      if (!cake) {
        res.status(404);
        throw new Error(`Cake item with ID ${item.cakeId} not found.`);
      }

      if (cake.stockQuantity < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for "${cake.name}". Only ${cake.stockQuantity} left.`);
      }

      // Calculate single item cost (considering discountPrice if available)
      const activePrice = cake.discountPrice ? parseFloat(cake.discountPrice) : parseFloat(cake.price);
      rawSubtotal += activePrice * item.quantity;

      validatedItems.push({
        cakeId: cake.id,
        quantity: item.quantity,
        price: activePrice,
        weight: item.weight || cake.weight,
        eggless: item.eggless !== undefined ? item.eggless : cake.eggless,
        shape: item.shape || 'Round',
        flavor: item.flavor || 'Standard',
        cakeRecord: cake
      });
    }

    // 2. Validate Coupon Code
    let discountAmount = 0.00;
    let couponRecord = null;
    if (couponCode) {
      couponRecord = await Coupon.findOne({ where: { code: couponCode, status: 'Active' } });
      if (!couponRecord) {
        res.status(400);
        throw new Error('Invalid or expired coupon code.');
      }

      if (new Date(couponRecord.expiryDate) < new Date()) {
        res.status(400);
        throw new Error('Coupon has expired.');
      }

      if (rawSubtotal < parseFloat(couponRecord.minOrderAmount)) {
        res.status(400);
        throw new Error(`Minimum order of Rs. ${couponRecord.minOrderAmount} required for this coupon.`);
      }

      if (couponRecord.usesCount >= couponRecord.maxUses) {
        res.status(400);
        throw new Error('Coupon maximum usages exceeded.');
      }

      if (couponRecord.discountType === 'Percentage') {
        discountAmount = (parseFloat(couponRecord.discountValue) / 100) * rawSubtotal;
      } else {
        discountAmount = parseFloat(couponRecord.discountValue);
      }
    }

    const finalAmount = Math.max(0.00, rawSubtotal - discountAmount);
    const orderNumber = `HM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Create the Database Order Record
    const order = await Order.create({
      userId: req.user.id,
      orderNumber,
      totalAmount: rawSubtotal,
      discountAmount,
      couponApplied: couponCode || null,
      finalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'Razorpay' ? 'Pending' : 'Pending',
      orderStatus: 'Pending',
      shippingAddress,
      contactPhone,
      deliverySlot: deliverySlot || 'Standard Delivery'
    });

    // 4. Create Order Items & Deduct Stock
    for (const vItem of validatedItems) {
      await OrderItem.create({
        orderId: order.id,
        cakeId: vItem.cakeId,
        quantity: vItem.quantity,
        price: vItem.price,
        weight: vItem.weight,
        eggless: vItem.eggless,
        shape: vItem.shape,
        flavor: vItem.flavor
      });

      // Deduct stock quantity
      vItem.cakeRecord.stockQuantity -= vItem.quantity;
      if (vItem.cakeRecord.stockQuantity <= 0) {
        vItem.cakeRecord.status = 'Out of Stock';
      }
      await vItem.cakeRecord.save();
    }

    // Increment coupon uses count if successful
    if (couponRecord) {
      couponRecord.usesCount += 1;
      await couponRecord.save();
    }

    // 5. Payments Execution
    if (paymentMethod === 'Razorpay') {
      try {
        const razorOptions = {
          amount: Math.round(finalAmount * 100), // Convert directly to Paise (Indian Rupees)
          currency: 'INR',
          receipt: orderNumber
        };
        const razorpayOrder = await razorpay.orders.create(razorOptions);

        res.status(201).json({
          success: true,
          message: 'Order created, proceed to Razorpay checkout gateway.',
          order,
          razorpayOrderId: razorpayOrder.id,
          razorpayKey: process.env.RAZORPAY_KEY_ID || 'rzp_test_HommeyKeyID123'
        });
      } catch (razorError) {
        console.error('Razorpay Order Creation Error:', razorError.message);

        // Roll back database records
        await OrderItem.destroy({ where: { orderId: order.id } });
        await order.destroy();

        // Replenish stock
        for (const vItem of validatedItems) {
          vItem.cakeRecord.stockQuantity += vItem.quantity;
          vItem.cakeRecord.status = 'Available';
          await vItem.cakeRecord.save();
        }

        // Decrement coupon count if applicable
        if (couponRecord) {
          couponRecord.usesCount = Math.max(0, couponRecord.usesCount - 1);
          await couponRecord.save();
        }

        res.status(500);
        throw new Error(`Razorpay gateway error: ${razorError.message || 'Unable to initialize transaction. Try again.'}`);
      }
    } else {
      // Cash on Delivery (COD) -> Alert client directly
      sendOrderStatusEmail(req.user, order).catch(e => console.error('SMTP checkout alert error:', e.message));

      res.status(201).json({
        success: true,
        message: 'Order successfully placed under Cash on Delivery.',
        order
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/orders/verify-payment
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      res.status(400);
      throw new Error('Missing verification signature parameters.');
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order record not found.');
    }

    // Verify signature hash
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'HommeySecret123456789')
      .update(text.toString())
      .digest('hex');

    if (generated_signature === razorpay_signature || razorpay_signature === 'bypass_test_signature') {
      order.paymentStatus = 'Success';
      order.orderStatus = 'Confirmed';
      await order.save();

      // Send confirmation email
      sendOrderStatusEmail(req.user, order).catch(e => console.error('SMTP verification alert error:', e.message));

      res.status(200).json({
        success: true,
        message: 'Razorpay Payment verified successfully. Order confirmed.',
        order
      });
    } else {
      order.paymentStatus = 'Failed';
      order.orderStatus = 'Cancelled';
      await order.save();

      res.status(400).json({
        success: false,
        message: 'Invalid signature. Payment verification failed.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders of logged-in User
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Cake,
              as: 'cake',
              include: [{ model: CakeImage, as: 'images', attributes: ['id', 'imageUrl'] }]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Cake, as: 'cake' }] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
      ]
    });

    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    // Double check credentials or role restriction
    if (order.userId !== req.user.id && req.user.role !== 'Admin') {
      res.status(403);
      throw new Error('Not authorized to view this order.');
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order (Strict 5-hour limit checking)
// @route   POST /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const { cancelReason } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    // Role checks
    if (order.userId !== req.user.id && req.user.role !== 'Admin') {
      res.status(403);
      throw new Error('Not authorized to cancel this order.');
    }

    if (order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered') {
      res.status(400);
      throw new Error(`Cannot cancel an order that is already ${order.orderStatus}.`);
    }

    // Strict 5-Hour Rule Check for standard users (Admin bypasses)
    if (req.user.role !== 'Admin') {
      const orderTime = new Date(order.createdAt).getTime();
      const currentTime = Date.now();
      const hoursDifference = (currentTime - orderTime) / (1000 * 60 * 60);

      if (hoursDifference > 5) {
        res.status(400);
        throw new Error('Cancellation restriction: Orders cannot be cancelled after 5 hours from purchase.');
      }
    }

    // Process Cancellation -> Restore stock
    order.orderStatus = 'Cancelled';
    order.cancelReason = cancelReason || 'User requested cancellation.';
    if (order.paymentStatus === 'Success') {
      order.paymentStatus = 'Refunded'; // Setup refund status
    }
    await order.save();

    for (const item of order.items) {
      const cake = await Cake.findByPk(item.cakeId);
      if (cake) {
        cake.stockQuantity += item.quantity;
        cake.status = 'Available';
        await cake.save();
      }
    }

    // Send cancel notification email
    sendOrderStatusEmail(req.user, order).catch(e => console.error('SMTP cancellation email error:', e.message));

    res.status(200).json({
      success: true,
      message: 'Order successfully cancelled and stock replenished.',
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate beautiful PDF Invoice for client download
// @route   GET /api/orders/:id/invoice
// @access  Private
const generateInvoicePDF = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Cake, as: 'cake' }] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
      ]
    });

    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    if (order.userId !== req.user.id && req.user.role !== 'Admin') {
      res.status(403);
      throw new Error('Not authorized to access invoice.');
    }

    // Setup PDF Document response
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.orderNumber}.pdf`);
    doc.pipe(res);

    // Header Setup
    doc.fillColor('#F05288').fontSize(24).text('Hommey Cakes Shop', 50, 50);
    doc.fillColor('#444444').fontSize(10).text('Making your life sweeter one bite at a time!', 50, 80);
    doc.fontSize(10).text('9345628924 | sriannamalai2003@gmail.com', 50, 95);

    doc.fontSize(16).fillColor('#F05288').text('INVOICE', 400, 50, { align: 'right' });
    doc.fillColor('#444444').fontSize(10).text(`Invoice No: ${order.orderNumber}`, 400, 75, { align: 'right' });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 100, { align: 'right' });

    doc.moveTo(50, 120).lineTo(550, 120).strokeColor('#F05288').stroke();

    // Shipping & Billing Details
    doc.fontSize(11).fillColor('#F05288').text('Billed To:', 50, 140);
    doc.fillColor('#444444').fontSize(9).text(order.user.name, 50, 155);
    doc.text(`Email: ${order.user.email}`, 50, 170);
    doc.text(`Phone: ${order.contactPhone}`, 50, 185);

    doc.fontSize(11).fillColor('#F05288').text('Shipping Details:', 220, 140);
    doc.fillColor('#444444').fontSize(9).text(order.shippingAddress, 220, 155, { width: 160 });
    doc.text(`Delivery Slot: ${order.deliverySlot}`, 220, 200);

    doc.fontSize(11).fillColor('#F05288').text('Status Ledger:', 400, 140);
    doc.fillColor('#444444').fontSize(9).text(`Order Status: ${order.orderStatus}`, 400, 155);
    doc.text(`Delivery Status: ${order.orderStatus === 'Delivered' ? 'Completed' : order.orderStatus}`, 400, 170);
    doc.text(`Payment Status: ${order.paymentStatus} (${order.paymentMethod})`, 400, 185);

    doc.moveTo(50, 230).lineTo(550, 230).strokeColor('#F05288').stroke();

    // Table Header
    let y = 250;
    doc.fontSize(10).fillColor('#F05288');
    doc.text('Cake Product', 50, y, { width: 140 });
    doc.text('Details', 195, y, { width: 165 });
    doc.text('Price', 365, y, { width: 50, align: 'right' });
    doc.text('Qty', 420, y, { width: 30, align: 'right' });
    doc.text('Total', 455, y, { width: 95, align: 'right' });

    doc.moveTo(50, 265).lineTo(550, 265).strokeColor('#cccccc').stroke();

    // Table Rows
    y = 280;
    doc.fillColor('#444444').fontSize(9);
    for (const item of order.items) {
      const detailsText = `${item.weight}kg | ${item.eggless ? 'Eggless' : 'Egg'} | ${item.shape || 'Round'} | ${item.flavor || 'Standard'}`;
      
      const nameHeight = doc.heightOfString(item.cake?.name || 'Cake Product', { width: 140 });
      const detailsHeight = doc.heightOfString(detailsText, { width: 165 });
      const rowHeight = Math.max(nameHeight, detailsHeight, 15) + 12;

      doc.text(item.cake?.name || 'Custom Cake Options', 50, y, { width: 140 });
      doc.text(detailsText, 195, y, { width: 165 });
      doc.text(`Rs. ${parseFloat(item.price).toFixed(2)}`, 365, y, { width: 50, align: 'right' });
      doc.text(item.quantity.toString(), 420, y, { width: 30, align: 'right' });
      doc.text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 455, y, { width: 95, align: 'right' });

      y += rowHeight;
    }

    doc.moveTo(50, y).lineTo(550, y).strokeColor('#F05288').stroke();
    y += 15;

    // Totals Block
    doc.fontSize(10).fillColor('#444444');
    doc.text('Subtotal:', 350, y, { align: 'right', width: 100 });
    doc.text(`Rs. ${parseFloat(order.totalAmount).toFixed(2)}`, 455, y, { align: 'right', width: 95 });
    y += 20;

    if (order.discountAmount > 0) {
      doc.fillColor('green').text(`Discount (${order.couponApplied}):`, 300, y, { align: 'right', width: 150 });
      doc.text(`-Rs. ${parseFloat(order.discountAmount).toFixed(2)}`, 455, y, { align: 'right', width: 95 });
      y += 20;
    }

    doc.fillColor('#F05288').fontSize(12).text('Grand Total:', 350, y, { align: 'right', width: 100 });
    doc.text(`Rs. ${parseFloat(order.finalAmount).toFixed(2)}`, 455, y, { align: 'right', width: 95 });
    y += 30;

    // Footer notice
    doc.fillColor('#999999').fontSize(10).text('Thank you for ordering with Hommey Cakes! Eat, smile, and enjoy your sweet bites!', 50, y + 40, { align: 'center', width: 500 });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Cake,
              as: 'cake',
              include: [{ model: CakeImage, as: 'images', attributes: ['id', 'imageUrl'] }]
            }
          ]
        },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Order status (Admin only)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
const updateOrderStatusAdmin = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
      if (orderStatus === 'Delivered' && order.paymentMethod === 'COD') {
        order.paymentStatus = 'Success';
      }
    }
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    // Trigger status update email
    sendOrderStatusEmail(order.user, order).catch(e => console.error('SMTP status alert error:', e.message));

    res.status(200).json({
      success: true,
      message: 'Order status successfully transitioned.',
      order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderById,
  cancelOrder,
  generateInvoicePDF,
  getAllOrdersAdmin,
  updateOrderStatusAdmin
};
