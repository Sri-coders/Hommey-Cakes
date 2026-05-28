const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Helper to send emails
const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || `"Hommey Cakes" <sriannamalai2003@gmail.com>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  try {
    // If SMTP user is blank/default placeholders, print to console as fallback and return success
    if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('your_') || process.env.SMTP_USER === '') {
      console.log('\n--- EMAIL NOTIFICATION OUTBOX (SMTP fallback to Console) ---');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log('Body Summary:');
      console.log(mailOptions.html.replace(/<[^>]*>/g, '').substring(0, 500) + '...');
      console.log('----------------------------------------------------------\n');
      return { success: true, fallback: true };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email dispatched successfully: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error('Nodemailer SMTP Transporter Error:', error.message);
    // Silent success in dev environment to prevent application crashes due to SMTP configuration
    return { success: false, error: error.message };
  }
};

// 1. Welcome Email
const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #F05288; text-align: center;">Welcome to Hommey Cakes Shop!</h2>
      <p>Hello ${user.name},</p>
      <p>Thank you for registering at <strong>Hommey Cakes</strong>. We are thrilled to have you join our family of dessert lovers!</p>
      <p>Making your life sweeter one bite at a time is our core promise. You can now log into your dashboard, add delicious cakes to your cart, set dynamic delivery addresses, and track your orders in real-time.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background-color: #F05288; color: #fff; text-decoration: none; padding: 12px 25px; border-radius: 20px; font-weight: bold; display: inline-block;">Shop Cakes Now</a>
      </div>
      <p>Warmest regards,<br/>The Hommey Cakes Baking Team</p>
    </div>
  `;
  return sendEmail({
    email: user.email,
    subject: 'Welcome to Hommey Cakes Shop!',
    html
  });
};

// 2. Password Reset OTP
const sendPasswordResetOTP = async (user, otp) => {
  const html = `
    <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #F05288; text-align: center;">Reset Your Password - Hommey Cakes</h2>
      <p>Hello ${user.name},</p>
      <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to complete the reset process:</p>
      <div style="background-color: #f7f7f7; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 15px; border-radius: 6px; margin: 20px 0; color: #333;">
        ${otp}
      </div>
      <p style="color: #ff0000; font-size: 13px;">This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
      <p>Warm regards,<br/>Hommey Cakes Technical Support</p>
    </div>
  `;
  return sendEmail({
    email: user.email,
    subject: 'Your Password Reset OTP - Hommey Cakes',
    html
  });
};

// 3. Order Status Notifications
const sendOrderStatusEmail = async (user, orderInput) => {
  let order = orderInput;
  try {
    const { Order, OrderItem, Cake } = require('../models');
    const loadedOrder = await Order.findOne({
      where: { id: orderInput.id },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Cake, as: 'cake' }] }
      ]
    });
    if (loadedOrder) {
      order = loadedOrder;
    }
  } catch (err) {
    console.error('Failed to load order items for email template:', err.message);
  }

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eef2f5; border-radius: 16px; background-color: #ffffff; color: #333333; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #F05288; margin: 0; font-size: 24px; font-weight: bold; font-family: Georgia, serif;">Hommey Cakes Shop</h2>
        <p style="color: #888888; font-size: 10px; margin: 5px 0 0 0; letter-spacing: 1px; text-transform: uppercase; font-weight: bold;">Making your life sweeter one bite at a time!</p>
      </div>

      <div style="background-color: #fff0f5; padding: 15px; border-radius: 12px; text-align: center; margin-bottom: 25px; border: 1px solid #ffd3e2;">
        <h3 style="color: #c91a54; margin: 0 0 5px 0; font-size: 15px; font-weight: bold;">Order Status Notification</h3>
        <p style="margin: 0; font-size: 13px; color: #555;">Hello <strong>${user.name}</strong>, your order <strong>#${order.orderNumber}</strong> has transitioned successfully to status:</p>
        <span style="display: inline-block; background-color: #F05288; color: #ffffff; font-weight: bold; font-size: 12px; padding: 6px 16px; border-radius: 30px; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.5px;">${order.orderStatus}</span>
      </div>

      <!-- 1. Customer Information & Delivery Profile -->
      <div style="margin-bottom: 25px; background-color: #fafbfc; border-radius: 12px; padding: 15px; border: 1px solid #f0f2f5;">
        <h4 style="margin: 0 0 10px 0; color: #F05288; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Customer & Delivery Details</h4>
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; font-weight: bold; color: #666; width: 120px;">Client Name:</td>
            <td style="padding: 4px 0; color: #333;">${user.name}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold; color: #666;">Contact Phone:</td>
            <td style="padding: 4px 0; color: #333;">${order.contactPhone || user.phone}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold; color: #666;">Delivery Address:</td>
            <td style="padding: 4px 0; color: #333; line-height: 1.4;">${order.shippingAddress}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold; color: #666;">Delivery Slot:</td>
            <td style="padding: 4px 0; color: #c91a54; font-weight: bold;">${order.deliverySlot}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold; color: #666;">Delivery Status:</td>
            <td style="padding: 4px 0; color: #333; font-weight: bold; text-transform: uppercase;">${order.orderStatus === 'Delivered' ? 'Completed (Delivered)' : order.orderStatus}</td>
          </tr>
        </table>
      </div>

      <!-- 2. Cakes Items Breakdown -->
      <div style="margin-bottom: 25px;">
        <h4 style="margin: 0 0 10px 0; color: #F05288; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Cakes Product Details</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="border-bottom: 2px solid #F05288; color: #666; font-weight: bold;">
              <th style="text-align: left; padding: 8px 0; width: 55%;">Delight Product Specs</th>
              <th style="text-align: center; padding: 8px 0; width: 15%;">Qty</th>
              <th style="text-align: right; padding: 8px 0; width: 15%;">Unit</th>
              <th style="text-align: right; padding: 8px 0; width: 15%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items && order.items.map(item => `
              <tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 10px 0;">
                  <strong style="color: #333; font-size: 13px;">${item.cake?.name || 'Custom Cake Options'}</strong>
                  <div style="color: #777; font-size: 10px; margin-top: 3px; font-weight: bold; text-transform: uppercase;">
                    ${item.weight}kg • ${item.eggless ? 'Eggless' : 'Contains Egg'} • Shape: ${item.shape || 'Round'} • Flavor: ${item.flavor || 'Standard'}
                  </div>
                </td>
                <td style="text-align: center; padding: 10px 0; color: #333; font-weight: bold;">${item.quantity}</td>
                <td style="text-align: right; padding: 10px 0; color: #555;">₹${parseFloat(item.price).toFixed(2)}</td>
                <td style="text-align: right; padding: 10px 0; color: #F05288; font-weight: bold;">₹${parseFloat(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 3. Totals Block -->
      <div style="margin-bottom: 25px; border-top: 2px solid #f0f2f5; padding-top: 15px;">
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #666; text-align: right; width: 75%;">Subtotal:</td>
            <td style="padding: 4px 0; text-align: right; color: #333; font-weight: bold; width: 25%;">₹${parseFloat(order.totalAmount).toFixed(2)}</td>
          </tr>
          ${order.discountAmount > 0 ? `
          <tr>
            <td style="padding: 4px 0; color: green; text-align: right;">Coupon Savings (${order.couponApplied}):</td>
            <td style="padding: 4px 0; text-align: right; color: green; font-weight: bold;">-₹${parseFloat(order.discountAmount).toFixed(2)}</td>
          </tr>` : ''}
          <tr style="font-size: 14px; font-weight: bold;">
            <td style="padding: 10px 0 4px 0; color: #333; text-align: right; border-top: 1px solid #eee;">Grand Total:</td>
            <td style="padding: 10px 0 4px 0; text-align: right; color: #F05288; border-top: 1px solid #eee; font-family: Georgia, serif; font-size: 16px;">₹${parseFloat(order.finalAmount).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- 4. Payment details -->
      <div style="background-color: #fafbfc; border-radius: 12px; padding: 15px; border: 1px solid #f0f2f5; font-size: 12px; line-height: 1.5; margin-bottom: 25px;">
        <span style="font-weight: bold; color: #888; display: block; margin-bottom: 5px; text-transform: uppercase; font-size: 10px;">Transaction Summary</span>
        <div><span style="font-weight: bold; color: #555;">Payment Method:</span> <span style="text-transform: uppercase; font-weight: bold; color: #333;">${order.paymentMethod}</span></div>
        <div><span style="font-weight: bold; color: #555;">Payment Status:</span> <span style="text-transform: uppercase; font-weight: bold; color: ${order.paymentStatus === 'Success' ? 'green' : '#ff9800'};">${order.paymentStatus}</span></div>
      </div>

      <div style="text-align: center; margin: 30px 0 10px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="background-color: #F05288; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 30px; font-weight: bold; font-size: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(240, 82, 136, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">Track / View My Orders</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f0f2f5; margin: 25px 0 15px 0;" />
      <p style="font-size: 11px; color: #999999; text-align: center; margin: 0; line-height: 1.4;">
        Thank you for ordering with Hommey Cakes! Eat, smile, and enjoy your sweet bites.<br/>
        If you have any queries about this transaction, contact us at <a href="mailto:sriannamalai2003@gmail.com" style="color: #F05288; text-decoration: none;">sriannamalai2003@gmail.com</a>
      </p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject: `Order #${order.orderNumber} Status: ${order.orderStatus}`,
    html
  });
};

// 4. New Cake Notification to All Registered Users
const sendNewCakeAlert = async (user, cake) => {
  const html = `
    <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #F05288; text-align: center;">New Delight in Our Menu!</h2>
      <p>Hello ${user.name},</p>
      <p>We are absolutely thrilled to introduce a brand-new mouth-watering cake added to our collection by our head pastry chefs:</p>
      
      <div style="border: 1px solid #F05288; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; background-color: #fffafb;">
        <h3 style="color: #F05288; margin-top: 0;">${cake.name}</h3>
        <p style="font-style: italic; color: #555;">Category: ${cake.category} | Flavor: ${cake.flavor}</p>
        <p style="margin: 10px 0; line-height: 1.5;">${cake.description}</p>
        <p style="font-size: 18px; font-weight: bold; color: #333;">Price: $${cake.price}</p>
        <span style="background-color: #F05288; color: white; padding: 4px 10px; font-size: 12px; border-radius: 10px; font-weight: bold;">
          ${cake.eggless ? 'Eggless (Vegetarian)' : 'With Egg'}
        </span>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/shop" style="background-color: #F05288; color: #fff; text-decoration: none; padding: 12px 25px; border-radius: 20px; font-weight: bold; display: inline-block;">Order the New Cake Now</a>
      </div>
      <p>Satisfy your sweet tooth today!</p>
    </div>
  `;
  return sendEmail({
    email: user.email,
    subject: `New Cake Alert: Try our new ${cake.name}!`,
    html
  });
};

// 5. Contact Form Email
const sendContactEmail = async (contactDetails) => {
  const html = `
    <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #F05288; text-align: center;">New Contact Message - Hommey Cakes</h2>
      <p>You have received a new message from the contact form on your website:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tbody>
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 120px; border-bottom: 1px solid #eee;">Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${contactDetails.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${contactDetails.email}">${contactDetails.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Subject:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${contactDetails.subject}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; vertical-align: top;">Message:</td>
            <td style="padding: 8px; line-height: 1.6;">${contactDetails.message}</td>
          </tr>
        </tbody>
      </table>
      
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 11px; color: #888; text-align: center;">This notification was dispatched automatically by Hommey Cakes server.</p>
    </div>
  `;
  return sendEmail({
    email: 'sriannamalai2003@gmail.com',
    subject: `[Contact Form] ${contactDetails.subject}`,
    html
  });
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetOTP,
  sendOrderStatusEmail,
  sendNewCakeAlert,
  sendContactEmail
};
