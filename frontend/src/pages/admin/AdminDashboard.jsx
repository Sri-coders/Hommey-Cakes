import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Cake as CakeIcon, ShoppingBag, Users, Tag, Image as ImageIcon, Plus, Trash2, ShieldAlert, Edit, Save, RefreshCw, XCircle, Eye, X, FileText } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import axios from 'axios';
import { useToast } from '../../components/ToastContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();

  // Tab State
  const [adminTab, setAdminTab] = useState('stats'); // stats, cakes, orders, users, coupons, gallery

  // Central Stats
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Sales Period Filters
  const [salesPeriodType, setSalesPeriodType] = useState('monthly'); // monthly, daily
  const [salesYear, setSalesYear] = useState(new Date().getFullYear());
  const [salesMonth, setSalesMonth] = useState(new Date().getMonth() + 1);

  // Cake CRUD State
  const [cakes, setCakes] = useState([]);
  const [loadingCakes, setLoadingCakes] = useState(false);
  const [editingCake, setEditingCake] = useState(null);

  // Cake Form Inputs
  const [cakeName, setCakeName] = useState('');
  const [cakeCategory, setCakeCategory] = useState('Cake');
  const [cakePrice, setCakePrice] = useState('');
  const [cakeDiscount, setCakeDiscount] = useState('');
  const [cakeStock, setCakeStock] = useState('');
  const [cakeFlavor, setCakeFlavor] = useState(['Chocolate Fudge']);
  const [cakeWeight, setCakeWeight] = useState('1.00');
  const [cakeEggless, setCakeEggless] = useState(true);
  const [cakeIsFeatured, setCakeIsFeatured] = useState(false);
  const [cakeShape, setCakeShape] = useState(['Round']);
  const [cakeDescription, setCakeDescription] = useState('');
  const [cakeFiles, setCakeFiles] = useState([]);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [adminCancelReason, setAdminCancelReason] = useState('');
  const [loadingCancel, setLoadingCancel] = useState(false);

  // Orders Filters State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('All');
  const [orderMethodFilter, setOrderMethodFilter] = useState('All');
  const [orderDateFilter, setOrderDateFilter] = useState('All');

  const getFilteredOrders = () => {
    return orders.filter(ord => {
      // 1. Search filter
      const searchLower = orderSearch.toLowerCase();
      const matchSearch = 
        ord.orderNumber.toLowerCase().includes(searchLower) ||
        (ord.user?.name || '').toLowerCase().includes(searchLower) ||
        (ord.user?.email || '').toLowerCase().includes(searchLower) ||
        ord.contactPhone.toLowerCase().includes(searchLower) ||
        ord.shippingAddress.toLowerCase().includes(searchLower) ||
        (ord.items && ord.items.some(item => (item.cake?.name || '').toLowerCase().includes(searchLower)));

      // 2. Status filter
      const matchStatus = orderStatusFilter === 'All' || ord.orderStatus === orderStatusFilter;

      // 3. Payment Status filter
      const matchPayment = orderPaymentFilter === 'All' || ord.paymentStatus === orderPaymentFilter;

      // 4. Payment Method filter
      const matchMethod = orderMethodFilter === 'All' || ord.paymentMethod === orderMethodFilter;

      // 5. Date filter
      let matchDate = true;
      if (orderDateFilter !== 'All') {
        const orderTime = new Date(ord.createdAt).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (orderDateFilter === 'Today') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          matchDate = orderTime >= startOfToday;
        } else if (orderDateFilter === 'Yesterday') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          const startOfYesterday = startOfToday - oneDay;
          matchDate = orderTime >= startOfYesterday && orderTime < startOfToday;
        } else if (orderDateFilter === '7Days') {
          matchDate = (now - orderTime) <= (7 * oneDay);
        }
      }

      return matchSearch && matchStatus && matchPayment && matchMethod && matchDate;
    });
  };

  // Customers State
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Coupon State
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  // Coupon Form Inputs
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('Percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponMin, setCouponMin] = useState('0.00');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [couponMax, setCouponMax] = useState('100');

  // Gallery State
  const [gallery, setGallery] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [galleryDesc, setGalleryDesc] = useState('');
  const [galleryFile, setGalleryFile] = useState(null);

  // Refresh helper functions
  const loadStatsData = async () => {
    setLoadingStats(true);
    try {
      const res = await axios.get(`/api/admin/dashboard/stats?filterType=${salesPeriodType}&year=${salesYear}&month=${salesMonth}`);
      if (res.data.success) {
        setStats(res.data.stats);
        setChartData(res.data.chartData);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingStats(false); }
  };

  const loadCakesData = async () => {
    setLoadingCakes(true);
    try {
      const res = await axios.get('/api/cakes?limit=100');
      if (res.data.success) setCakes(res.data.cakes);
    } catch (e) { console.error(e); }
    finally { setLoadingCakes(false); }
  };

  const loadOrdersData = async () => {
    setLoadingOrders(true);
    try {
      const res = await axios.get('/api/orders/admin/all');
      if (res.data.success) setOrders(res.data.orders);
    } catch (e) { console.error(e); }
    finally { setLoadingOrders(false); }
  };

  const loadCustomersData = async () => {
    setLoadingCustomers(true);
    try {
      const query = customerSearch ? `?search=${customerSearch}` : '';
      const res = await axios.get(`/api/admin/users${query}`);
      if (res.data.success) setCustomers(res.data.users);
    } catch (e) { console.error(e); }
    finally { setLoadingCustomers(false); }
  };

  const loadCouponsData = async () => {
    setLoadingCoupons(true);
    try {
      const res = await axios.get('/api/coupons');
      if (res.data.success) setCoupons(res.data.coupons);
    } catch (e) { console.error(e); }
    finally { setLoadingCoupons(false); }
  };

  const loadGalleryData = async () => {
    setLoadingGallery(true);
    try {
      const res = await axios.get('/api/gallery');
      if (res.data.success) setGallery(res.data.media);
    } catch (e) { console.error(e); }
    finally { setLoadingGallery(false); }
  };

  useEffect(() => {
    if (adminTab === 'stats') loadStatsData();
    if (adminTab === 'cakes') loadCakesData();
    if (adminTab === 'orders') loadOrdersData();
    if (adminTab === 'users') loadCustomersData();
    if (adminTab === 'coupons') loadCouponsData();
    if (adminTab === 'gallery') loadGalleryData();
  }, [adminTab, customerSearch, salesPeriodType, salesYear, salesMonth]);

  // Cake CRUD Operations
  const handleCakeSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', cakeName);
      formData.append('category', cakeCategory);
      formData.append('price', cakePrice);
      if (cakeDiscount) formData.append('discountPrice', cakeDiscount);
      formData.append('stockQuantity', cakeStock);
      formData.append('flavor', cakeFlavor.join(', '));
      formData.append('weight', cakeWeight);
      formData.append('eggless', cakeEggless.toString());
      formData.append('isFeatured', cakeIsFeatured.toString());
      formData.append('shape', cakeShape.join(', '));
      formData.append('description', cakeDescription);

      for (const file of cakeFiles) {
        formData.append('images', file);
      }

      let res;
      if (editingCake) {
        res = await axios.put(`/api/cakes/${editingCake.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post('/api/cakes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        toast.success(editingCake ? 'Cake successfully updated!' : 'New cake successfully added!');
        resetCakeForm();
        loadCakesData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process cake.');
    }
  };

  const handleEditCake = (cake) => {
    setEditingCake(cake);
    setCakeName(cake.name);
    setCakeCategory(cake.category);
    setCakePrice(cake.price);
    setCakeDiscount(cake.discountPrice || '');
    setCakeStock(cake.stockQuantity);
    setCakeFlavor(cake.flavor ? cake.flavor.split(', ') : ['Chocolate Fudge']);
    setCakeWeight(cake.weight);
    setCakeEggless(cake.eggless);
    setCakeIsFeatured(cake.isFeatured);
    setCakeShape(cake.shape ? cake.shape.split(', ') : ['Round']);
    setCakeDescription(cake.description);
  };

  const handleDeleteCake = async (cakeId) => {
    if (!window.confirm('Delete this cake? This removes it from catalog database.')) return;
    try {
      const res = await axios.delete(`/api/cakes/${cakeId}`);
      if (res.data.success) {
        toast.success('Cake successfully deleted.');
        loadCakesData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete restricted.');
    }
  };

  const resetCakeForm = () => {
    setEditingCake(null);
    setCakeName('');
    setCakeCategory('Cake');
    setCakePrice('');
    setCakeDiscount('');
    setCakeStock('');
    setCakeFlavor(['Chocolate Fudge']);
    setCakeWeight('1.00');
    setCakeEggless(true);
    setCakeIsFeatured(false);
    setCakeShape(['Round']);
    setCakeDescription('');
    setCakeFiles([]);
  };

  // Order status transition updates
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.put(`/api/orders/admin/${orderId}/status`, { orderStatus: newStatus });
      if (res.data.success) {
        toast.success(`Order transitioned to "${newStatus}" in bakery workflow.`);
        loadOrdersData();
      }
    } catch (e) {
      toast.error('Failed to transition status.');
    }
  };

  // Admin cancel order operation
  const handleCancelOrder = async (orderId, reason) => {
    setLoadingCancel(true);
    try {
      const res = await axios.post(`/api/orders/${orderId}/cancel`, { cancelReason: reason || 'Admin cancelled order' });
      if (res.data.success) {
        toast.success('Order cancelled successfully and stock replenished!');
        setShowCancelDialog(false);
        setAdminCancelReason('');
        setSelectedOrder(null); // Close order details modal
        loadOrdersData(); // Reload admin orders desk list
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setLoadingCancel(false);
    }
  };

  // Customer ban toggle
  const handleToggleCustomerBlock = async (userId) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/block`);
      if (res.data.success) {
        toast.success(res.data.message);
        loadCustomersData();
      }
    } catch (e) {
      toast.error('Suspension failed.');
    }
  };

  // Coupon Operations
  const handleAddCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/coupons', {
        code: couponCode,
        discountType: couponType,
        discountValue: couponValue,
        minOrderAmount: couponMin,
        expiryDate: couponExpiry,
        maxUses: couponMax
      });
      if (res.data.success) {
        toast.success('New Coupon successfully preloaded!');
        setCouponCode('');
        setCouponValue('');
        setCouponExpiry('');
        loadCouponsData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add coupon.');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete coupon code?')) return;
    try {
      const res = await axios.delete(`/api/coupons/${id}`);
      if (res.data.success) {
        toast.success('Coupon deleted successfully.');
        loadCouponsData();
      }
    } catch (e) { toast.error('Delete failed.'); }
  };

  // Gallery Operations
  const handleAddGallery = async (e) => {
    e.preventDefault();
    if (!galleryFile) return;
    try {
      const formData = new FormData();
      formData.append('description', galleryDesc);
      formData.append('media', galleryFile);

      const res = await axios.post('/api/gallery', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Showcase item added to gallery!');
        setGalleryDesc('');
        setGalleryFile(null);
        loadGalleryData();
      }
    } catch (e) { toast.error('Upload failed.'); }
  };

  const handleDeleteGallery = async (id) => {
    if (!window.confirm('Delete showcase item?')) return;
    try {
      const res = await axios.delete(`/api/gallery/${id}`);
      if (res.data.success) {
        toast.success('Showcase item deleted.');
        loadGalleryData();
      }
    } catch (e) { toast.error('Delete failed.'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Left column: Admin navigation sidebar controls */}
        <div className="bg-charcoal p-6 rounded-3xl h-fit text-gray-300 space-y-6">
          <div className="border-b border-gray-800 pb-4">
            <h4 className="font-serif font-bold text-white text-md">Hommey Console</h4>
            <span className="text-[10px] text-primary uppercase font-bold tracking-widest">Admin Control Center</span>
          </div>

          <nav className="flex flex-col gap-2 font-bold text-xs uppercase tracking-wider">
            <button
              onClick={() => setAdminTab('stats')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all ${adminTab === 'stats' ? 'bg-primary text-white shadow-premium' : 'hover:bg-gray-800 hover:text-white'}`}
            >
              <LayoutDashboard size={16} /> Sales Analytics
            </button>
            <button
              onClick={() => setAdminTab('cakes')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all ${adminTab === 'cakes' ? 'bg-primary text-white shadow-premium' : 'hover:bg-gray-800 hover:text-white'}`}
            >
              <CakeIcon size={16} /> Cake Catalog
            </button>
            <button
              onClick={() => setAdminTab('orders')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all ${adminTab === 'orders' ? 'bg-primary text-white shadow-premium' : 'hover:bg-gray-800 hover:text-white'}`}
            >
              <ShoppingBag size={16} /> Orders Desk
            </button>
            <button
              onClick={() => setAdminTab('users')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all ${adminTab === 'users' ? 'bg-primary text-white shadow-premium' : 'hover:bg-gray-800 hover:text-white'}`}
            >
              <Users size={16} /> Bans & Ledger
            </button>
            <button
              onClick={() => setAdminTab('coupons')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all ${adminTab === 'coupons' ? 'bg-primary text-white shadow-premium' : 'hover:bg-gray-800 hover:text-white'}`}
            >
              <Tag size={16} /> Coupon Desk
            </button>
            <button
              onClick={() => setAdminTab('gallery')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all ${adminTab === 'gallery' ? 'bg-primary text-white shadow-premium' : 'hover:bg-gray-800 hover:text-white'}`}
            >
              <ImageIcon size={16} /> Media Showcase
            </button>
          </nav>
        </div>

        {/* Right column: Dynamic Content displays */}
        <div className="lg:col-span-4 space-y-6">

          {/* Tab 1: Sales Analytics Dashboard */}
          {adminTab === 'stats' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              {/* Period Filter Toolbar */}
              <div className="bg-white p-5 rounded-3xl border border-primary-light shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSalesPeriodType('monthly')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      salesPeriodType === 'monthly'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-cream text-charcoal border-gray-200 hover:border-primary-light'
                    }`}
                  >
                    Monthly View
                  </button>
                  <button
                    onClick={() => setSalesPeriodType('daily')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      salesPeriodType === 'daily'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-cream text-charcoal border-gray-200 hover:border-primary-light'
                    }`}
                  >
                    Daily View
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Year Picker */}
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="text-gray-400 uppercase">Year</span>
                    <select
                      value={salesYear}
                      onChange={(e) => setSalesYear(parseInt(e.target.value))}
                      className="border border-gray-200 px-3 py-2 rounded-xl bg-cream/35 text-xs text-charcoal font-bold focus:border-primary"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month Picker */}
                  {salesPeriodType === 'daily' && (
                    <div className="flex items-center gap-1.5 text-xs font-bold animate-fade-in">
                      <span className="text-gray-400 uppercase">Month</span>
                      <select
                        value={salesMonth}
                        onChange={(e) => setSalesMonth(parseInt(e.target.value))}
                        className="border border-gray-200 px-3 py-2 rounded-xl bg-cream/35 text-xs text-charcoal font-bold focus:border-primary"
                      >
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((mName, idx) => (
                          <option key={idx + 1} value={idx + 1}>{mName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Sales Summary PDF Download Button */}
                  <a
                    href={`/api/admin/dashboard/sales-report?token=${localStorage.getItem('hommey_token')}&filterType=${salesPeriodType}&year=${salesYear}&month=${salesMonth}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-cream hover:bg-cream-dark border border-gray-200 text-charcoal font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Download Periodical Sales Invoice Report"
                  >
                    <FileText size={14} className="text-primary" /> Export Report
                  </a>
                </div>
              </div>

              {/* Aggregates Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Total Sales Card */}
                <div className="bg-white p-5 rounded-2xl border border-primary-light shadow-sm text-center select-none">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Total Sales</span>
                  <h3 className="font-serif text-xl font-bold text-primary mt-1">₹{stats?.totalSales || '0.00'}</h3>
                </div>

                {/* Total Orders Card (Click to Redirect) */}
                <button
                  onClick={() => {
                    setAdminTab('orders');
                    setOrderStatusFilter('All');
                    setOrderSearch('');
                    setOrderPaymentFilter('All');
                    setOrderMethodFilter('All');
                    setOrderDateFilter('All');
                    toast.success('Viewing all catalog orders.');
                  }}
                  className="bg-white p-5 rounded-2xl border border-primary-light hover:border-primary transition-all shadow-sm hover:shadow hover:-translate-y-0.5 text-center cursor-pointer group active:scale-95"
                >
                  <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-primary transition-colors">Total Orders</span>
                  <h3 className="font-serif text-xl font-bold text-charcoal mt-1 group-hover:scale-105 transition-transform">{stats?.totalOrders || 0}</h3>
                  <span className="text-[8px] font-bold uppercase text-gray-300 block mt-1">Click to view</span>
                </button>

                {/* Pending Orders Card (Click to Redirect) */}
                <button
                  onClick={() => {
                    setAdminTab('orders');
                    setOrderStatusFilter('Pending');
                    setOrderSearch('');
                    setOrderPaymentFilter('All');
                    setOrderMethodFilter('All');
                    setOrderDateFilter('All');
                    toast.success('Filtered orders by Pending status.');
                  }}
                  className="bg-white p-5 rounded-2xl border border-primary-light hover:border-primary transition-all shadow-sm hover:shadow hover:-translate-y-0.5 text-center cursor-pointer group active:scale-95"
                >
                  <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-primary transition-colors">Pending Orders</span>
                  <h3 className="font-serif text-xl font-bold text-charcoal mt-1 group-hover:scale-105 transition-transform">{stats?.pendingOrders || 0}</h3>
                  <span className="text-[8px] font-bold uppercase text-gray-300 block mt-1">Click to view</span>
                </button>

                {/* Completed Orders Card (Click to Redirect) */}
                <button
                  onClick={() => {
                    setAdminTab('orders');
                    setOrderStatusFilter('Delivered');
                    setOrderSearch('');
                    setOrderPaymentFilter('All');
                    setOrderMethodFilter('All');
                    setOrderDateFilter('All');
                    toast.success('Filtered orders by Completed (Delivered) status.');
                  }}
                  className="bg-white p-5 rounded-2xl border border-primary-light hover:border-primary transition-all shadow-sm hover:shadow hover:-translate-y-0.5 text-center cursor-pointer group active:scale-95"
                >
                  <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-primary transition-colors">Completed Orders</span>
                  <h3 className="font-serif text-xl font-bold text-charcoal mt-1 group-hover:scale-105 transition-transform">{stats?.completedOrders || 0}</h3>
                  <span className="text-[8px] font-bold uppercase text-gray-300 block mt-1">Click to view</span>
                </button>

                {/* Low Stock Cakes Card */}
                <div className="bg-white p-5 rounded-2xl border border-primary-light shadow-sm text-center bg-red-50 border-red-200 select-none">
                  <span className="text-[10px] uppercase font-bold text-red-500">Low Stock Cakes</span>
                  <h3 className="font-serif text-xl font-bold text-red-700 mt-1">{stats?.lowStockCakes || 0}</h3>
                  <span className="text-[8px] font-extrabold uppercase text-red-300 block mt-1">Needs attention</span>
                </div>
              </div>

              {/* Sales Period Graph Container */}
              <div className="bg-white p-8 rounded-3xl border border-primary-light shadow-premium space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-serif font-bold text-charcoal">
                    {salesPeriodType === 'monthly' ? `Annual Sales Revenue Trend (${salesYear})` : `Monthly Daily Sales Trend (${salesMonth}/${salesYear})`}
                  </h4>
                  <div className="flex gap-4 text-[10px] font-bold uppercase text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary inline-block"></span> Sales Revenue (₹)</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-charcoal inline-block"></span> Volume Orders</span>
                  </div>
                </div>

                <div className="h-72 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesTrendColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F05288" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#F05288" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="ordersTrendColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1E293B" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#1E293B" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="label" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #f0f2f5', 
                          borderRadius: '16px', 
                          boxShadow: '0 10px 25px rgba(240, 82, 136, 0.08)' 
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b', fontSize: '12px' }}
                        itemStyle={{ fontSize: '11px', color: '#F05288' }}
                        formatter={(value, name) => {
                          if (name === 'revenue') return [`₹${value}`, 'Sales Revenue'];
                          if (name === 'orders') return [value, 'Volume Orders'];
                          return [value, name];
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#F05288" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#salesTrendColor)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="orders" 
                        stroke="#1E293B" 
                        strokeWidth={1.5} 
                        fillOpacity={1} 
                        fill="url(#ordersTrendColor)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </motion.div>
          )}

          {/* Tab 2: Cake Catalog Management CRUD */}
          {adminTab === 'cakes' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              {/* Adding Form Card */}
              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-primary-light shadow-premium space-y-6">
                <h3 className="font-bold text-lg text-charcoal border-b border-primary-light pb-3">
                  {editingCake ? `Edit Dynamic Specs: ${editingCake.name}` : 'Add New Cake Product'}
                </h3>

                <form onSubmit={handleCakeSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Cake Name</label>
                    <input
                      type="text"
                      required
                      value={cakeName}
                      onChange={(e) => setCakeName(e.target.value)}
                      placeholder="e.g. Red Velvet Fudge"
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/35"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Category</label>
                    <select
                      value={cakeCategory}
                      onChange={(e) => setCakeCategory(e.target.value)}
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/35"
                    >
                      <option value="Cake">Cake</option>
                      <option value="Cupcake">Cupcake</option>
                      <option value="Biscuit">Biscuit</option>
                      <option value="Red Velvet">Red Velvet</option>
                      <option value="Donut">Donut</option>
                    </select>
                  </div>

                  {/* Available Flavors Custom Picker */}
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Available Flavors</label>
                    <div className="flex flex-wrap gap-2 bg-cream/25 p-3.5 rounded-2xl border border-gray-200">
                      {['Chocolate Fudge', 'Red Velvet', 'Vanilla Bean', 'Butterscotch', 'Strawberry Cream', 'Oreo Fudge', 'Mango Velvet'].map((fl) => {
                        const isSelected = cakeFlavor.includes(fl);
                        return (
                          <button
                            key={fl}
                            type="button"
                            onClick={() => {
                              if (cakeFlavor.includes(fl)) {
                                if (cakeFlavor.length > 1) {
                                  setCakeFlavor(cakeFlavor.filter(f => f !== fl));
                                } else {
                                  toast.warning('At least one cake flavor option must be selected!');
                                }
                              } else {
                                setCakeFlavor([...cakeFlavor, fl]);
                              }
                            }}
                            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all border ${
                              isSelected 
                                ? 'bg-primary text-white border-primary shadow-sm hover:bg-primary-dark' 
                                : 'bg-cream text-charcoal border-gray-200 hover:border-primary-light hover:bg-cream/70'
                            }`}
                          >
                            {fl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Retail Price (₹)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={cakePrice}
                      onChange={(e) => setCakePrice(e.target.value)}
                      placeholder="e.g. 25.00"
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/35"
                    />
                  </div>

                  {/* Discount Price */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Promo Discount Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={cakeDiscount}
                      onChange={(e) => setCakeDiscount(e.target.value)}
                      placeholder="Leave blank if no discount"
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/35"
                    />
                  </div>

                  {/* Stock Quantity */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Stock Quantity</label>
                    <input
                      type="number"
                      required
                      value={cakeStock}
                      onChange={(e) => setCakeStock(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/35"
                    />
                  </div>

                  {/* Weight */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Base Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={cakeWeight}
                      onChange={(e) => setCakeWeight(e.target.value)}
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/35"
                    />
                  </div>

                  {/* Eggless */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Recipe Type</label>
                    <select
                      value={cakeEggless.toString()}
                      onChange={(e) => setCakeEggless(e.target.value === 'true')}
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/35"
                    >
                      <option value="true">100% Eggless</option>
                      <option value="false">Contains Egg</option>
                    </select>
                  </div>

                  {/* Images Select files */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Attach Images (Multi)</label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setCakeFiles(Array.from(e.target.files))}
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2 rounded-xl bg-cream/35"
                    />
                  </div>

                  {/* Available Shapes Custom Picker */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Available Shapes</label>
                    <div className="flex flex-wrap gap-2">
                      {['Round', 'Square', 'Heart', 'Rectangle'].map((sh) => {
                        const isSelected = cakeShape.includes(sh);
                        return (
                          <button
                            key={sh}
                            type="button"
                            onClick={() => {
                              if (cakeShape.includes(sh)) {
                                if (cakeShape.length > 1) {
                                  setCakeShape(cakeShape.filter(s => s !== sh));
                                } else {
                                  toast.warning('At least one cake shape option must be selected!');
                                }
                              } else {
                                setCakeShape([...cakeShape, sh]);
                              }
                            }}
                            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all border ${
                              isSelected 
                                ? 'bg-primary text-white border-primary shadow-sm hover:bg-primary-dark' 
                                : 'bg-cream text-charcoal border-gray-200 hover:border-primary-light hover:bg-cream/70'
                            }`}
                          >
                            {sh}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Is Featured Toggle */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Showcase Options</label>
                    <div className="flex items-center h-[46px] px-3 bg-cream/35 rounded-xl border border-gray-200">
                      <input
                        type="checkbox"
                        id="featured-chk"
                        checked={cakeIsFeatured}
                        onChange={(e) => setCakeIsFeatured(e.target.checked)}
                        className="accent-primary h-4 w-4 rounded cursor-pointer"
                      />
                      <label htmlFor="featured-chk" className="text-xs font-bold text-charcoal ml-2 cursor-pointer">
                        Featured Product
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Product Catalog Description</label>
                    <textarea
                      rows="3"
                      required
                      value={cakeDescription}
                      onChange={(e) => setCakeDescription(e.target.value)}
                      placeholder="Describe raw ingredients, whipped frostings, layers, and decor outlines..."
                      className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl bg-cream/35"
                    ></textarea>
                  </div>

                  {/* Actions buttons */}
                  <div className="sm:col-span-3 text-right flex justify-end gap-2 pt-2">
                    {editingCake && (
                      <button
                        type="button"
                        onClick={resetCakeForm}
                        className="border border-gray-200 text-gray-500 font-bold uppercase text-xs px-5 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary-dark text-white font-bold uppercase text-xs px-6 py-3 rounded-xl shadow-premium transition-colors"
                    >
                      {editingCake ? 'Save Catalog Updates' : 'Add Cake to Catalog'}
                    </button>
                  </div>

                </form>
              </div>

              {/* Cakes Listing Table */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primary-light shadow-premium overflow-x-auto">
                <h4 className="font-serif font-bold text-charcoal mb-4">Catalog Cakes Directory</h4>

                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-primary-light font-bold text-gray-400 uppercase text-[10px]">
                      <th className="pb-3">Cake</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Flavor</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3 text-center">Featured</th>
                      <th className="pb-3">Shapes</th>
                      <th className="pb-3 text-center">Stock</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-light/40">
                    {cakes.map((c) => (
                      <tr key={c.id} className="hover:bg-cream/10">
                        <td className="py-3 font-bold text-charcoal">{c.name}</td>
                        <td className="py-3">{c.category}</td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {(c.flavor ? c.flavor.split(', ') : ['Standard']).map((fl, idx) => (
                              <span key={idx} className="bg-cream border border-gray-200 px-1.5 py-0.5 rounded text-[9px] font-medium text-charcoal">
                                {fl}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 text-primary font-bold">
                          ₹{c.discountPrice ? parseFloat(c.discountPrice).toFixed(2) : parseFloat(c.price).toFixed(2)}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                            c.isFeatured 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-gray-50 text-gray-400 border-gray-200'
                          }`}>
                            {c.isFeatured ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {(c.shape ? c.shape.split(', ') : ['Round']).map((s, idx) => (
                              <span key={idx} className="bg-cream border border-gray-200 px-1.5 py-0.5 rounded text-[9px] font-medium text-charcoal">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className={`py-3 text-center font-bold ${c.stockQuantity <= 3 ? 'text-red-600' : 'text-gray-500'}`}>
                          {c.stockQuantity}
                        </td>
                        <td className="py-3 text-right flex gap-1 justify-end">
                          <button
                            onClick={() => handleEditCake(c)}
                            className="bg-cream hover:bg-cream-dark p-2 rounded-lg border border-gray-200 text-charcoal transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCake(c.id)}
                            className="bg-red-50 hover:bg-red-100 p-2 rounded-lg border border-red-100 text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </motion.div>
          )}
          {/* Tab 3: Order Desk (Transition Manager) */}
          {adminTab === 'orders' && (() => {
            const filteredOrders = getFilteredOrders();
            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-4 sm:p-10 rounded-3xl border border-primary-light shadow-premium space-y-6">
                <h3 className="font-bold text-lg text-charcoal border-b border-primary-light pb-3">Bakery Orders Desk</h3>

                {/* Premium Interactive Multi-Filters Desk */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-5 rounded-2xl bg-cream/25 border border-primary-light/40 shadow-sm">
                  {/* 1. Search Box */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Search Orders</label>
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search code, client, cake..."
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-white shadow-sm font-semibold"
                    />
                  </div>

                  {/* 2. Order Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Order Status</label>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-white shadow-sm font-bold text-charcoal"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* 3. Payment Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Payment Status</label>
                    <select
                      value={orderPaymentFilter}
                      onChange={(e) => setOrderPaymentFilter(e.target.value)}
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-white shadow-sm font-bold text-charcoal"
                    >
                      <option value="All">All Payments</option>
                      <option value="Pending">Pending</option>
                      <option value="Success">Success</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>

                  {/* 4. Payment Method */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Payment Method</label>
                    <select
                      value={orderMethodFilter}
                      onChange={(e) => setOrderMethodFilter(e.target.value)}
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-white shadow-sm font-bold text-charcoal"
                    >
                      <option value="All">All Methods</option>
                      <option value="COD">Cash on Delivery (COD)</option>
                      <option value="Razorpay">Razorpay Gateway</option>
                    </select>
                  </div>

                  {/* 5. Date Range */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Date Range</label>
                    <select
                      value={orderDateFilter}
                      onChange={(e) => setOrderDateFilter(e.target.value)}
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-white shadow-sm font-bold text-charcoal"
                    >
                      <option value="All">All Time</option>
                      <option value="Today">Today</option>
                      <option value="Yesterday">Yesterday</option>
                      <option value="7Days">Last 7 Days</option>
                    </select>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="text-center py-16 space-y-3 bg-cream/10 border-2 border-dashed border-primary-light/50 rounded-3xl">
                    <ShoppingBag className="text-gray-300 mx-auto" size={44} />
                    <h4 className="font-bold text-charcoal text-sm">No Orders Found</h4>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">No client orders in our system match your current multi-filter criteria.</p>
                    <button
                      onClick={() => {
                        setOrderSearch('');
                        setOrderStatusFilter('All');
                        setOrderPaymentFilter('All');
                        setOrderMethodFilter('All');
                        setOrderDateFilter('All');
                      }}
                      className="text-xs font-bold text-primary uppercase tracking-wider hover:underline"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Desktop View: Premium Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-primary-light font-bold text-gray-400 uppercase text-[10px] pb-3">
                            <th className="pb-3">Order Code</th>
                            <th className="pb-3">Client</th>
                            <th className="pb-3 text-right">Amount</th>
                            <th className="pb-3 text-center">Status</th>
                            <th className="pb-3 text-right">Progress Update</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-light/40">
                          {filteredOrders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-cream/10">
                              <td className="py-4 font-mono font-bold text-charcoal">{ord.orderNumber}</td>
                              <td className="py-4">
                                <span className="font-bold text-charcoal block">{ord.user?.name}</span>
                                <span className="text-[10px] text-gray-400 block">{ord.contactPhone}</span>
                              </td>
                              <td className="py-4 text-right font-bold text-primary">₹{parseFloat(ord.finalAmount).toFixed(2)}</td>
                              <td className="py-4 text-center">
                                <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-full ${ord.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' : ord.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-primary-light text-primary'}`}>
                                  {ord.orderStatus}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                {ord.orderStatus !== 'Cancelled' && ord.orderStatus !== 'Delivered' ? (
                                  <select
                                    value={ord.orderStatus}
                                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                    className="text-xs border border-gray-200 px-2 py-1 rounded-lg focus:border-primary font-bold text-charcoal bg-cream/40"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Preparing">Preparing</option>
                                    <option value="Out for Delivery">Out for Delivery</option>
                                    <option value="Delivered">Delivered</option>
                                  </select>
                                ) : (
                                  <span className="text-[10px] text-gray-400 font-bold italic">No Updates (Locked)</span>
                                )}
                              </td>
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => setSelectedOrder(ord)}
                                  className="bg-cream hover:bg-cream-dark p-2 rounded-lg border border-gray-200 text-charcoal inline-flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider"
                                  title="View Detailed Items & Info"
                                >
                                  <Eye size={12} /> Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View: User Attractive Cards */}
                    <div className="block md:hidden space-y-4">
                      {filteredOrders.map((ord) => (
                        <div key={ord.id} className="bg-white p-5 rounded-2xl border border-primary-light shadow-premium flex flex-col gap-3 transition-all hover:shadow-premium-hover">
                          
                          {/* Top Row: Order Code & Time */}
                          <div className="flex justify-between items-center pb-2 border-b border-primary-light/40">
                            <span className="font-mono font-bold text-charcoal bg-cream px-2.5 py-0.5 rounded-lg border border-gray-200 text-[11px]">
                              {ord.orderNumber}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              {new Date(ord.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Middle Row: Client Profile & Total Amount */}
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block">Customer</span>
                              <span className="font-bold text-charcoal text-sm block">{ord.user?.name || 'Anonymous Guest'}</span>
                              <span className="text-xs text-gray-500 block">{ord.contactPhone}</span>
                            </div>
                            <div className="text-right space-y-0.5">
                              <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block">Amount</span>
                              <span className="text-primary font-serif font-extrabold text-base block">
                                ₹{parseFloat(ord.finalAmount).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Status & Update Controls */}
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-primary-light/40 items-center">
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Status</span>
                              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full inline-block ${
                                ord.orderStatus === 'Delivered' 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : ord.orderStatus === 'Cancelled' 
                                  ? 'bg-red-50 text-red-700 border border-red-200' 
                                  : 'bg-primary/5 text-primary border border-primary-light'
                              }`}>
                                {ord.orderStatus}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Progress</span>
                              {ord.orderStatus !== 'Cancelled' && ord.orderStatus !== 'Delivered' ? (
                                <select
                                  value={ord.orderStatus}
                                  onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                  className="w-full text-[11px] border border-gray-200 px-2 py-1 rounded-xl focus:border-primary font-bold text-charcoal bg-cream/40"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Preparing">Preparing</option>
                                  <option value="Out for Delivery">Out for Delivery</option>
                                  <option value="Delivered">Delivered</option>
                                </select>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-bold italic block py-1">Locked</span>
                              )}
                            </div>
                          </div>

                          {/* Quick Action View Details */}
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="w-full bg-cream hover:bg-cream-dark py-2.5 rounded-xl border border-gray-200 text-charcoal transition-colors flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider mt-1"
                          >
                            <Eye size={14} /> View Order Details
                          </button>
                          
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })()}

          {/* Tab 4: Customer Account Suspension Bans */}
          {adminTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-8 sm:p-10 rounded-3xl border border-primary-light shadow-premium space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-primary-light pb-3">
                <h3 className="font-bold text-lg text-charcoal">Customer Directory & Bans</h3>

                {/* Search Customer */}
                <input
                  type="text"
                  placeholder="Search email, phone, name..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="text-xs border border-gray-200 px-3 py-2 rounded-xl focus:border-primary max-w-xs w-full bg-cream/50 font-semibold"
                />
              </div>

              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-primary-light font-bold text-gray-400 uppercase text-[10px] pb-3">
                    <th className="pb-3">Client details</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Joined Date</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Suspend Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-light/40">
                  {customers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-cream/10">
                      <td className="py-4">
                        <span className="font-bold text-charcoal block">{cust.name}</span>
                        <span className="text-[10px] text-gray-400 block">{cust.phone}</span>
                      </td>
                      <td className="py-4">{cust.email}</td>
                      <td className="py-4 text-gray-500">{new Date(cust.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 text-center">
                        <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-full ${cust.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {cust.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleToggleCustomerBlock(cust.id)}
                          className={`text-[9px] font-bold uppercase px-3 py-2 rounded-xl border transition-all ${cust.status === 'Active' ? 'border-red-200 hover:border-red-500 text-red-500 bg-red-50/20' : 'border-green-200 hover:border-green-500 text-green-600 bg-green-50/20'}`}
                        >
                          {cust.status === 'Active' ? 'Suspend client' : 'Reactivate client'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* Tab 5: Coupon codes preloader */}
          {adminTab === 'coupons' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              {/* Form card */}
              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-primary-light shadow-premium space-y-6">
                <h3 className="font-bold text-lg text-charcoal border-b border-primary-light pb-3">Create Promo Coupon Code</h3>

                <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Coupon Code</label>
                    <input
                      type="text"
                      required
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. BIRTHDAY50"
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/35 uppercase font-bold"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Discount Type</label>
                    <select
                      value={couponType}
                      onChange={(e) => setCouponType(e.target.value)}
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/35"
                    >
                      <option value="Percentage">Percentage (%)</option>
                      <option value="Flat">Flat Amount (₹)</option>
                    </select>
                  </div>

                  {/* Value */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Discount Value</label>
                    <input
                      type="number"
                      required
                      value={couponValue}
                      onChange={(e) => setCouponValue(e.target.value)}
                      placeholder="e.g. 15 for 15%"
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/35"
                    />
                  </div>

                  {/* Min Spends */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Min Purchase Spends (₹)</label>
                    <input
                      type="number"
                      value={couponMin}
                      onChange={(e) => setCouponMin(e.target.value)}
                      placeholder="e.g. 10.00"
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/35"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={couponExpiry}
                      onChange={(e) => setCouponExpiry(e.target.value)}
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2 rounded-xl bg-cream/35 font-semibold"
                    />
                  </div>

                  {/* Max uses */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Max Usage Ceilings</label>
                    <input
                      type="number"
                      required
                      value={couponMax}
                      onChange={(e) => setCouponMax(e.target.value)}
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/35"
                    />
                  </div>

                  <div className="sm:col-span-3 text-right pt-2">
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary-dark text-white font-bold uppercase text-xs px-6 py-3 rounded-xl shadow-premium transition-colors"
                    >
                      Preload Coupon Code
                    </button>
                  </div>

                </form>
              </div>

              {/* Coupons List */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primary-light shadow-premium overflow-x-auto">
                <h4 className="font-serif font-bold text-charcoal mb-4">Active Promo Coupons Directory</h4>

                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-primary-light font-bold text-gray-400 uppercase text-[10px]">
                      <th className="pb-3">Code</th>
                      <th className="pb-3">Discount Details</th>
                      <th className="pb-3">Min Purchase</th>
                      <th className="pb-3">Expiration Date</th>
                      <th className="pb-3 text-center">Usages</th>
                      <th className="pb-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-light/40">
                    {coupons.map((cop) => (
                      <tr key={cop.id} className="hover:bg-cream/10">
                        <td className="py-3 font-mono font-bold text-charcoal">{cop.code}</td>
                        <td className="py-3 font-semibold text-primary">
                          {cop.discountType === 'Percentage' ? `${cop.discountValue}% Off` : `₹${cop.discountValue} Off`}
                        </td>
                        <td className="py-3 font-semibold text-gray-500">₹{parseFloat(cop.minOrderAmount).toFixed(2)}</td>
                        <td className="py-3">{new Date(cop.expiryDate).toLocaleDateString()}</td>
                        <td className="py-3 text-center">{cop.usesCount} / {cop.maxUses}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(cop.id)}
                            className="bg-red-50 hover:bg-red-100 p-2 rounded-lg border border-red-100 text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </motion.div>
          )}

          {/* Tab 6: Media Showcase panel */}
          {adminTab === 'gallery' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              {/* Form Upload */}
              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-primary-light shadow-premium space-y-6">
                <h3 className="font-bold text-lg text-charcoal border-b border-primary-light pb-3">Upload Showcase Media</h3>

                <form onSubmit={handleAddGallery} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Asset File (Image or Video)</label>
                    <input
                      type="file"
                      required
                      onChange={(e) => setGalleryFile(e.target.files[0])}
                      className="w-full text-xs border border-gray-200 px-3 py-2 rounded-xl focus:border-primary bg-cream/35"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Media Description</label>
                    <input
                      type="text"
                      value={galleryDesc}
                      onChange={(e) => setGalleryDesc(e.target.value)}
                      placeholder="e.g. Triple Tier Gold Wedding Custom Base Cake"
                      className="w-full text-xs border border-gray-200 px-3 py-2.5 rounded-xl focus:border-primary bg-cream/35"
                    />
                  </div>

                  <div className="sm:col-span-2 text-right pt-2">
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary-dark text-white font-bold uppercase text-xs px-6 py-3 rounded-xl shadow-premium transition-colors"
                    >
                      Publish to Showcase
                    </button>
                  </div>
                </form>
              </div>

              {/* Showcase items list */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primary-light shadow-premium overflow-x-auto">
                <h4 className="font-serif font-bold text-charcoal mb-4">Showcase Assets Showcase</h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {gallery.map((g) => (
                    <div key={g.id} className="relative group border border-primary-light rounded-xl overflow-hidden aspect-video">
                      {g.mediaType === 'Video' ? (
                        <video src={g.mediaUrl} className="w-full h-full object-cover" preload="metadata" />
                      ) : (
                        <img src={g.mediaUrl} alt={g.description} className="w-full h-full object-cover" />
                      )}

                      <button
                        onClick={() => handleDeleteGallery(g.id)}
                        className="absolute top-2 right-2 bg-white text-red-600 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>

                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white p-2 text-[10px] truncate">
                        {g.description || 'Showcase media'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

        </div>

      </div>

      {/* Detailed Order Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => {
              if (!showCancelDialog) setSelectedOrder(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-primary-light/30 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Icon */}
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 z-10 bg-charcoal/80 text-white hover:bg-primary p-2.5 rounded-full transition-all duration-200 shadow-md hover:scale-110"
                aria-label="Close details"
              >
                <X size={18} />
              </button>

              {/* Modal Header */}
              <div className="bg-charcoal p-6 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-primary/20">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Receipt Ledger</span>
                  <h3 className="font-serif font-bold text-2xl mt-0.5">Order #{selectedOrder.orderNumber}</h3>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-gray-400 block font-semibold uppercase">Purchased On</span>
                  <span className="text-xs font-bold">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-8 overflow-y-auto space-y-8 flex-1">

                {/* Section 1: Customer Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Bill To */}
                  <div className="bg-cream/35 p-5 rounded-2xl border border-primary-light/45">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Billed Customer</span>
                    <p className="font-bold text-charcoal">{selectedOrder.user?.name || 'Guest User'}</p>
                    <p className="text-xs text-gray-500 font-semibold mt-1">{selectedOrder.user?.email}</p>
                    <p className="text-xs text-gray-500 font-semibold">{selectedOrder.contactPhone}</p>
                  </div>

                  {/* Delivery Location */}
                  <div className="bg-cream/35 p-5 rounded-2xl border border-primary-light/45 md:col-span-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Shipping Destination</span>
                    <p className="text-xs text-charcoal font-semibold leading-relaxed">{selectedOrder.shippingAddress}</p>
                    <p className="text-xs text-primary font-bold mt-2 uppercase tracking-wide">
                      Slot: {selectedOrder.deliverySlot}
                    </p>
                  </div>

                </div>

                {/* Section 2: Items Breakdowns List */}
                <div className="space-y-4">
                  <h4 className="font-serif font-bold text-charcoal text-lg border-b border-primary-light pb-2">
                    Cake Products Ordered ({selectedOrder.items?.length || 0})
                  </h4>

                  <div className="divide-y divide-primary-light/35">
                    {selectedOrder.items?.map((item) => {
                      const cakeThumb = item.cake?.images?.[0]?.imageUrl || '/uploads/product-1.jpg';
                      return (
                        <div key={item.id} className="py-4 flex gap-4 items-center justify-between">
                          <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 bg-cream rounded-xl overflow-hidden border border-primary-light/40 shrink-0">
                              <img
                                src={cakeThumb}
                                alt={item.cake?.name || 'Cake'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/uploads/product-1.jpg';
                                }}
                              />
                            </div>
                            <div>
                              <h5 className="font-bold text-charcoal text-sm">{item.cake?.name || 'Cake Product'}</h5>
                              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                                Flavor: {item.flavor || 'Standard'} • Shape: {item.shape || 'Round'}
                              </p>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-light/30 border border-primary-light text-primary rounded-full text-[9px] font-bold uppercase mt-1">
                                {item.weight}kg | {item.eggless ? '100% Eggless' : 'Contains Egg'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-charcoal/80 block font-semibold">
                              ₹{item.price} x {item.quantity}
                            </span>
                            <span className="text-sm font-bold text-primary block mt-0.5">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Ledger Summary Block */}
                <div className="bg-cream/20 p-6 rounded-2xl border border-primary-light/50 flex flex-col md:flex-row justify-between gap-6">

                  {/* Left part: Payment method/status */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Transaction Ledger
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-charcoal">Gateway Method:</span>
                      <span className="text-xs font-bold uppercase text-primary bg-primary-light/40 px-2.5 py-1 rounded-lg border border-primary-light/60">
                        {selectedOrder.paymentMethod}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-charcoal">Payment Status:</span>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${selectedOrder.paymentStatus === 'Success'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : selectedOrder.paymentStatus === 'Refunded'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Right part: Subtotal and Grand Totals */}
                  <div className="w-full md:w-64 space-y-2.5 text-xs text-charcoal/85">
                    <div className="flex justify-between font-semibold">
                      <span>Order Subtotal:</span>
                      <span>₹{parseFloat(selectedOrder.totalAmount).toFixed(2)}</span>
                    </div>
                    {parseFloat(selectedOrder.discountAmount) > 0 && (
                      <div className="flex justify-between font-semibold text-green-600">
                        <span>Coupon Savings:</span>
                        <span>-₹{parseFloat(selectedOrder.discountAmount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-primary pt-2 border-t border-primary-light/60">
                      <span>Grand Total:</span>
                      <span>₹{parseFloat(selectedOrder.finalAmount).toFixed(2)}</span>
                    </div>
                  </div>

                </div>

                {/* Section 4: Cancel Dialog / Cancel Option */}
                {selectedOrder.orderStatus !== 'Cancelled' && selectedOrder.orderStatus !== 'Delivered' && (
                  <div className="border-t border-red-100 pt-6">
                    {!showCancelDialog ? (
                      <div className="flex justify-between items-center bg-red-50/30 p-5 rounded-2xl border border-red-100">
                        <div>
                          <h5 className="font-serif font-bold text-red-800 text-md">Need to Cancel this Order?</h5>
                          <p className="text-xs text-gray-500 mt-1">
                            This will replenish the cake catalog stock count and trigger email dispatches.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowCancelDialog(true)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[10px] tracking-wider px-5 py-3 rounded-xl transition-colors shadow-sm"
                        >
                          Cancel Order
                        </button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 p-6 rounded-2xl border border-red-200 space-y-4"
                      >
                        <h5 className="font-bold text-red-800 text-sm">Cancel Order Verification</h5>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-red-700">
                            Reason for Cancellation
                          </label>
                          <textarea
                            rows="2"
                            value={adminCancelReason}
                            onChange={(e) => setAdminCancelReason(e.target.value)}
                            placeholder="e.g. Requested flavor is out of stock / Customer request..."
                            className="w-full text-xs border border-red-200 focus:border-red-500 px-3 py-2 rounded-xl bg-white"
                          />
                        </div>
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setShowCancelDialog(false);
                              setAdminCancelReason('');
                            }}
                            className="bg-white border border-gray-200 text-gray-500 font-bold uppercase px-4 py-2.5 rounded-xl hover:bg-gray-50"
                          >
                            Go Back
                          </button>
                          <button
                            type="button"
                            disabled={loadingCancel}
                            onClick={() => handleCancelOrder(selectedOrder.id, adminCancelReason)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
                          >
                            {loadingCancel ? 'Processing...' : 'Confirm Cancellation'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {selectedOrder.orderStatus === 'Cancelled' && (
                  <div className="bg-red-50/40 p-5 rounded-2xl border border-red-100/70 text-center">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">
                      Cancellation Log Info
                    </span>
                    <p className="text-xs font-semibold text-red-800 mt-1">
                      Reason: {selectedOrder.cancelReason || 'Not specified'}
                    </p>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
