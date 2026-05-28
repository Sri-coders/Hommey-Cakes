const PDFDocument = require('pdfkit');
const { User, Order, Cake, OrderItem, Review, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Get dashboard metrics, card counts, and monthly analytics data (Admin only)
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const yearVal = parseInt(req.query.year || new Date().getFullYear());
    const filterType = req.query.filterType || 'monthly'; // 'monthly' or 'daily'
    
    let dateFilter = {};
    if (filterType === 'daily') {
      const monthVal = parseInt(req.query.month || (new Date().getMonth() + 1));
      const startDate = new Date(yearVal, monthVal - 1, 1);
      const endDate = new Date(yearVal, monthVal, 0, 23, 59, 59, 999);
      dateFilter = {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      };
    } else {
      const startDate = new Date(yearVal, 0, 1);
      const endDate = new Date(yearVal, 11, 31, 23, 59, 59, 999);
      dateFilter = {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      };
    }

    // 1. Order status counts for period
    const totalOrdersCount = await Order.count({ where: { createdAt: dateFilter } });
    const pendingOrdersCount = await Order.count({ where: { orderStatus: 'Pending', createdAt: dateFilter } });
    const completedOrdersCount = await Order.count({ where: { orderStatus: 'Delivered', createdAt: dateFilter } });
    const cancelledOrdersCount = await Order.count({ where: { orderStatus: 'Cancelled', createdAt: dateFilter } });

    // 2. Financial Totals for period (Successful / non-cancelled orders)
    const successfulPayments = await Order.findAll({
      where: {
        [Op.or]: [
          { paymentStatus: 'Success' },
          { orderStatus: 'Delivered' }
        ],
        orderStatus: { [Op.ne]: 'Cancelled' },
        createdAt: dateFilter
      }
    });

    const totalSales = successfulPayments.reduce((acc, order) => acc + parseFloat(order.finalAmount), 0.00);

    // 3. User & Cake metrics (remain global)
    const totalCustomersCount = await User.count({ where: { role: 'User' } });
    const totalCakesCount = await Cake.count();
    const lowStockCakesCount = await Cake.count({ where: { stockQuantity: { [Op.lte]: 3 } } });

    // 4. Reports (Sales trend over the selected period)
    let formattedChartData = [];
    if (filterType === 'daily') {
      const monthVal = parseInt(req.query.month || (new Date().getMonth() + 1));
      const dailySales = await Order.findAll({
        attributes: [
          [sequelize.fn('DAY', sequelize.col('createdAt')), 'day'],
          [sequelize.fn('SUM', sequelize.col('finalAmount')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orders']
        ],
        where: {
          createdAt: dateFilter,
          orderStatus: { [Op.ne]: 'Cancelled' }
        },
        group: [sequelize.fn('DAY', sequelize.col('createdAt'))],
        raw: true
      });

      const totalDays = new Date(yearVal, monthVal, 0).getDate();
      formattedChartData = Array.from({ length: totalDays }, (_, i) => {
        const dayNum = i + 1;
        const dbMatch = dailySales.find(item => parseInt(item.day) === dayNum);
        return {
          label: `${dayNum}`,
          revenue: dbMatch ? parseFloat(dbMatch.revenue).toFixed(2) : '0.00',
          orders: dbMatch ? parseInt(dbMatch.orders) : 0
        };
      });
    } else {
      const monthlySales = await Order.findAll({
        attributes: [
          [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
          [sequelize.fn('SUM', sequelize.col('finalAmount')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orders']
        ],
        where: {
          createdAt: dateFilter,
          orderStatus: { [Op.ne]: 'Cancelled' }
        },
        group: [sequelize.fn('MONTH', sequelize.col('createdAt'))],
        raw: true
      });

      const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      formattedChartData = monthsName.map((name, index) => {
        const dbMatch = monthlySales.find(item => parseInt(item.month) === index + 1);
        return {
          label: name,
          revenue: dbMatch ? parseFloat(dbMatch.revenue).toFixed(2) : '0.00',
          orders: dbMatch ? parseInt(dbMatch.orders) : 0
        };
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        totalSales: totalSales.toFixed(2),
        totalOrders: totalOrdersCount,
        pendingOrders: pendingOrdersCount,
        completedOrders: completedOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        totalCustomers: totalCustomersCount,
        totalCakes: totalCakesCount,
        lowStockCakes: lowStockCakesCount
      },
      chartData: formattedChartData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download periodical sales invoice summary report (Landscape PDF)
// @route   GET /api/admin/dashboard/sales-report
// @access  Private/Admin
const generateSalesReportPDF = async (req, res, next) => {
  try {
    const yearVal = parseInt(req.query.year || new Date().getFullYear());
    const filterType = req.query.filterType || 'monthly';
    
    let dateFilter = {};
    let periodName = '';
    
    if (filterType === 'daily') {
      const monthVal = parseInt(req.query.month || (new Date().getMonth() + 1));
      const startDate = new Date(yearVal, monthVal - 1, 1);
      const endDate = new Date(yearVal, monthVal, 0, 23, 59, 59, 999);
      dateFilter = {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      };
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      periodName = `${monthNames[monthVal - 1]} ${yearVal}`;
    } else {
      const startDate = new Date(yearVal, 0, 1);
      const endDate = new Date(yearVal, 11, 31, 23, 59, 59, 999);
      dateFilter = {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      };
      periodName = `Year ${yearVal}`;
    }

    // Fetch all orders in that period
    const orders = await Order.findAll({
      where: { createdAt: dateFilter },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Cake, as: 'cake' }]
        },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate aggregated metrics
    const totalOrdersCount = orders.length;
    const completedOrdersCount = orders.filter(o => o.orderStatus === 'Delivered').length;
    const pendingOrdersCount = orders.filter(o => o.orderStatus === 'Pending').length;
    const cancelledOrdersCount = orders.filter(o => o.orderStatus === 'Cancelled').length;
    const activeOrders = orders.filter(o => o.orderStatus !== 'Cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + parseFloat(o.finalAmount), 0.00);

    // Setup landscape PDF Document
    const doc = new PDFDocument({ layout: 'landscape', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SalesReport-${periodName.replace(/\s+/g, '')}.pdf`);
    doc.pipe(res);

    // Report Header
    doc.fillColor('#F05288').fontSize(22).font('Helvetica-Bold').text('Hommey Cakes Shop', 40, 40);
    doc.fillColor('#666666').fontSize(10).font('Helvetica').text('Making your life sweeter one bite at a time!', 40, 65);
    doc.text('Administrative Office | Gopalan Signature Mall, Bengaluru', 40, 78);

    doc.fillColor('#333333').fontSize(16).font('Helvetica-Bold').text('PERIODICAL SALES REPORT', 500, 40, { align: 'right' });
    doc.fontSize(10).font('Helvetica').fillColor('#666666').text(`Reporting Period: ${periodName}`, 500, 65, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 500, 78, { align: 'right' });

    doc.moveTo(40, 95).lineTo(752, 95).strokeColor('#F05288').stroke();

    // Summary Box (Metrics Grid)
    doc.fillColor('#fffafb').rect(40, 110, 712, 55).fillAndStroke('#F05288', '#fffafb');
    
    doc.fillColor('#444444').fontSize(10).font('Helvetica-Bold');
    doc.text('Total Revenue', 60, 120, { width: 120, align: 'center' });
    doc.text('Total Orders', 200, 120, { width: 100, align: 'center' });
    doc.text('Completed Orders', 320, 120, { width: 120, align: 'center' });
    doc.text('Pending Orders', 460, 120, { width: 120, align: 'center' });
    doc.text('Cancelled Orders', 600, 120, { width: 120, align: 'center' });

    doc.fontSize(14).fillColor('#F05288');
    doc.text(`Rs. ${totalRevenue.toFixed(2)}`, 60, 140, { width: 120, align: 'center' });
    doc.text(totalOrdersCount.toString(), 200, 140, { width: 100, align: 'center' });
    doc.text(completedOrdersCount.toString(), 320, 140, { width: 120, align: 'center' });
    doc.text(pendingOrdersCount.toString(), 460, 140, { width: 120, align: 'center' });
    doc.text(cancelledOrdersCount.toString(), 600, 140, { width: 120, align: 'center' });

    // Table Header
    let y = 185;
    doc.fontSize(10).fillColor('#F05288').font('Helvetica-Bold');
    doc.text('Order Number', 40, y, { width: 90 });
    doc.text('Date', 135, y, { width: 75 });
    doc.text('Customer Details', 215, y, { width: 110 });
    doc.text('Cakes Option Details', 330, y, { width: 200 });
    doc.text('Statuses', 535, y, { width: 110 });
    doc.text('Final Amount', 650, y, { width: 102, align: 'right' });

    doc.moveTo(40, 200).lineTo(752, 200).strokeColor('#cccccc').stroke();

    // Table Rows
    y = 210;
    doc.fillColor('#444444').font('Helvetica').fontSize(8.5);
    
    for (const order of orders) {
      const cakeSummary = order.items && order.items.map(item => {
        return `${item.cake?.name || 'Custom Cake'} (x${item.quantity}) [${item.weight}kg, ${item.shape || 'Round'}, ${item.flavor || 'Standard'}]`;
      }).join(', ');

      const customerText = `${order.user?.name || 'Guest'}\nPhone: ${order.contactPhone}\nEmail: ${order.user?.email || 'N/A'}`;
      const statusText = `Order: ${order.orderStatus}\nPayment: ${order.paymentStatus}\n(${order.paymentMethod})`;
      
      const cakeHeight = doc.heightOfString(cakeSummary, { width: 200 });
      const customerHeight = doc.heightOfString(customerText, { width: 110 });
      const statusHeight = doc.heightOfString(statusText, { width: 110 });
      
      const rowHeight = Math.max(cakeHeight, customerHeight, statusHeight, 25) + 12;

      // Page break check (Landscape height is 612, printable margin is 572)
      if (y + rowHeight > 540) {
        doc.addPage({ layout: 'landscape', margin: 40 });
        
        y = 40;
        doc.fontSize(10).fillColor('#F05288').font('Helvetica-Bold');
        doc.text('Order Number', 40, y, { width: 90 });
        doc.text('Date', 135, y, { width: 75 });
        doc.text('Customer Details', 215, y, { width: 110 });
        doc.text('Cakes Option Details', 330, y, { width: 200 });
        doc.text('Statuses', 535, y, { width: 110 });
        doc.text('Final Amount', 650, y, { width: 102, align: 'right' });
        doc.moveTo(40, y + 15).lineTo(752, y + 15).strokeColor('#cccccc').stroke();
        y = y + 25;
        doc.fillColor('#444444').font('Helvetica').fontSize(8.5);
      }

      doc.text(order.orderNumber, 40, y, { width: 90 });
      doc.text(new Date(order.createdAt).toLocaleDateString(), 135, y, { width: 75 });
      doc.text(customerText, 215, y, { width: 110 });
      doc.text(cakeSummary, 330, y, { width: 200 });
      doc.text(statusText, 535, y, { width: 110 });
      doc.text(`Rs. ${parseFloat(order.finalAmount).toFixed(2)}`, 650, y, { width: 102, align: 'right' });

      y += rowHeight;
    }

    doc.moveTo(40, y).lineTo(752, y).strokeColor('#F05288').stroke();
    y += 15;

    // Report Footer
    doc.fillColor('#999999').fontSize(9).text('Hommey Cakes Shop Sales Report - Private Administrative Use Only', 40, y + 10, { align: 'center', width: 712 });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    View and filter registered customers (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const { search, status } = req.query;

    const queryOptions = {
      where: { role: 'User' },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    };

    if (search) {
      queryOptions.where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) {
      queryOptions.where.status = status;
    }

    const users = await User.findAll(queryOptions);

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle block/unblock a customer (Admin only)
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('Customer not found.');
    }

    if (user.role === 'Admin') {
      res.status(400);
      throw new Error('Action restricted: Administrators cannot be suspended.');
    }

    // Toggle status
    user.status = user.status === 'Active' ? 'Blocked' : 'Active';
    await user.save();

    res.status(200).json({
      success: true,
      message: `Customer account successfully ${user.status === 'Blocked' ? 'blocked' : 'unblocked'}.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  toggleBlockUser,
  generateSalesReportPDF
};
