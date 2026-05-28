import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { User, ShoppingBag, MapPin, Phone, Lock, Calendar, FileText, XCircle, ChevronRight, Activity, Clock, ShieldAlert, RefreshCw, Camera } from 'lucide-react';
import axios from 'axios';
import { updateUserSuccess } from '../store/authSlice';
import { addToCart } from '../store/cartSlice';
import { useToast } from '../components/ToastContext';

const axiosInstance = axios;

const UserDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // profile, orders, track
  const [hoveredCardId, setHoveredCardId] = useState(null);

  const isOrderInStock = (order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.every(item => item.cake && item.cake.stockQuantity > 0 && item.cake.status === 'Available');
  };

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;

    order.items.forEach(item => {
      if (!item.cake) return;
      dispatch(addToCart({
        cakeId: item.cakeId,
        name: item.cake.name,
        price: item.cake.price,
        discountPrice: item.cake.discountPrice,
        imageUrl: item.cake.images?.[0]?.imageUrl || '/uploads/product-1.jpg',
        quantity: item.quantity,
        weight: parseFloat(item.weight),
        eggless: !!item.eggless,
        shape: item.shape || 'Round',
        flavor: item.flavor || 'Standard',
        stockQuantity: item.cake.stockQuantity
      }));
    });

    toast.success('Successfully added all items from this order to your cart!');
    navigate('/cart');
  };

  // Profile forms
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAddress, setProfileAddress] = useState(user?.address || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Tracking details
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingIdInput, setTrackingIdInput] = useState('');

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await axiosInstance.get('/api/orders');
      if (res.data.success) {
        setOrders(res.data.orders);
        if (res.data.orders.length > 0 && !trackingOrder) {
          setTrackingOrder(res.data.orders[0]); // default tracking
        }
      }
    } catch (err) {
      console.error('Error loading user orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const payload = {
        name: profileName,
        phone: profilePhone,
        address: profileAddress
      };
      if (profilePassword) payload.password = profilePassword;

      const res = await axiosInstance.put('/api/auth/profile', payload);
      if (res.data.success) {
        dispatch(updateUserSuccess(res.data.user));
        toast.success('Account profile settings successfully updated.');
        setProfilePassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Profile avatar upload using Multer backend API
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type and size (limit to 5MB)
    if (!file.type.startsWith('image/')) {
      toast.warning('Invalid file type. Please select an image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('File size too large. Maximum allowed size is 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      toast.success('Uploading profile photo...');
      const res = await axiosInstance.put('/api/auth/profile/image', formData);

      if (res.data.success) {
        dispatch(updateUserSuccess({ profile_image: res.data.profile_image }));
        toast.success('Profile avatar updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload profile image.');
    }
  };

  const getAvatarUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    if (img.startsWith('/uploads/')) return img;
    return `/uploads/${img}`;
  };

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this order? This action cannot be undone.');
    if (!confirmCancel) return;

    try {
      const res = await axiosInstance.post(`/api/orders/${orderId}/cancel`, { cancelReason: 'User cancelled via Dashboard' });
      if (res.data.success) {
        toast.success('Order successfully cancelled! Stock has been replenished.');
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation restricted: Orders cannot be cancelled after 5 hours.');
    }
  };

  const handleSelectTracking = (order) => {
    setTrackingOrder(order);
    setActiveTab('track');
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const match = orders.find(o => o.orderNumber === trackingIdInput.trim());
    if (match) {
      setTrackingOrder(match);
      setTrackingIdInput('');
    } else {
      toast.error('Order Number not found in your transaction directory.');
    }
  };

  // Timeline Helper
  const timelineSteps = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
  const getStepIndex = (status) => {
    if (status === 'Cancelled') return -1;
    return timelineSteps.indexOf(status);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left Side: Sidebar Controls */}
        <div className="bg-white p-6 rounded-3xl border border-primary-light h-fit shadow-premium space-y-6">
          <div className="flex flex-col items-center text-center gap-3 border-b border-primary-light/50 pb-6">
            {/* Round Avatar Container with Camera Overlay */}
            <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-primary bg-cream shadow-premium shrink-0 transition-transform duration-300 hover:scale-105">
              {user?.profile_image ? (
                <img
                  src={getAvatarUrl(user.profile_image)}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-primary-light flex items-center justify-center text-primary font-bold text-3xl">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              
              {/* Camera Hover Overlay */}
              <label className="absolute inset-0 bg-charcoal/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="text-white animate-pulse" size={22} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            <div>
              <h4 className="font-serif font-bold text-base text-charcoal">{user?.name}</h4>
              <span className="text-[10px] bg-primary-light/45 text-primary font-bold px-3 py-1 rounded-full uppercase tracking-wider block mt-1.5">
                {user?.role} Account
              </span>
              <p className="text-[9px] text-gray-400 mt-2 font-semibold truncate max-w-[180px]">{user?.email}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2 font-bold text-xs uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-primary text-white shadow-premium' : 'text-gray-500 hover:bg-primary-light/35 hover:text-primary'}`}
            >
              <User size={16} /> Profile Details
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-primary text-white shadow-premium' : 'text-gray-500 hover:bg-primary-light/35 hover:text-primary'}`}
            >
              <ShoppingBag size={16} /> Purchase History ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all ${activeTab === 'track' ? 'bg-primary text-white shadow-premium' : 'text-gray-500 hover:bg-primary-light/35 hover:text-primary'}`}
            >
              <Activity size={16} /> Stepper Tracking
            </button>
          </nav>
        </div>

        {/* Right Side: Dynamic Content Display */}
        <div className="lg:col-span-3">

          {/* Tab 1: Account Profile Settings */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-8 sm:p-10 rounded-3xl border border-primary-light shadow-premium space-y-6">
              <h3 className="font-bold text-xl text-charcoal border-b border-primary-light pb-3">Account Profile</h3>

              <form onSubmit={handleProfileSave} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400">Email Address (Read Only)</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full text-xs border border-gray-100 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400">Update Password (Optional)</label>
                  <input
                    type="password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="Enter new password if updating"
                    className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl"
                  />
                </div>

                {/* Profile Image (Optional Upload) */}
                <div className="sm:col-span-2 space-y-2 bg-cream/25 p-5 rounded-2xl border border-primary-light/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-primary bg-cream shrink-0 flex items-center justify-center shadow-sm">
                      {user?.profile_image ? (
                        <img 
                          src={getAvatarUrl(user.profile_image)} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-light flex items-center justify-center text-primary font-bold text-xl">
                          {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-xs text-charcoal">Profile Image (Optional)</h4>
                      <p className="text-[10px] text-gray-400">Upload or change your public avatar picture (JPEG, PNG - Max 5MB)</p>
                    </div>
                  </div>
                  <div>
                    <label className="bg-white hover:bg-cream/30 border border-gray-200 hover:border-primary-light text-charcoal font-bold uppercase tracking-wider text-[10px] px-4 py-2.5 rounded-xl cursor-pointer inline-flex items-center gap-2 transition-all active:scale-95 shadow-sm">
                      <Camera size={14} className="text-primary animate-pulse" />
                      Change Avatar
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Saved Home Delivery Address */}
                <div className="sm:col-span-2 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-primary" />
                    <label className="text-xs font-bold uppercase text-gray-400">Saved Home Delivery Address</label>
                  </div>
                  <textarea
                    rows="3"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="Provide your main delivery address (e.g. 15 Garden St, Suite 4B, Boston, MA)"
                    className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl"
                  ></textarea>
                </div>

                <div className="sm:col-span-2 pt-2 text-right">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-xl shadow-premium transition-colors"
                  >
                    {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Tab 2: Order History Logs */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-8 sm:p-10 rounded-3xl border border-primary-light shadow-premium space-y-6">
              <h3 className="font-bold text-xl text-charcoal border-b border-primary-light pb-3">Purchase History</h3>

              {loadingOrders ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <ShoppingBag className="text-gray-300 mx-auto" size={40} />
                  <p className="text-sm text-gray-500 font-semibold">You have not placed any orders yet.</p>
                  <Link to="/shop" className="text-xs font-bold text-primary uppercase hover:underline">Go to shop</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => {
                    // Check strict 5-hour cancellation rule
                    const orderTime = new Date(order.createdAt).getTime();
                    const currentTime = Date.now();
                    const hoursPassed = (currentTime - orderTime) / (1000 * 60 * 60);
                    const canCancel = hoursPassed <= 5 && order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Delivered';

                    const isHovered = hoveredCardId === order.id;
                    const isAnyHovered = hoveredCardId !== null;

                    return (
                      <div
                        key={order.id}
                        onMouseEnter={() => setHoveredCardId(order.id)}
                        onMouseLeave={() => setHoveredCardId(null)}
                        className={`border rounded-2xl p-6 space-y-4 transition-all duration-300 ease-out transform ${isHovered
                            ? 'border-primary bg-cream/30 shadow-premium scale-[1.02] -translate-y-1 z-10'
                            : isAnyHovered
                              ? 'border-primary-light/40 bg-cream/5 opacity-50 scale-[0.98] blur-[0.5px]'
                              : 'border-primary-light/60 bg-cream/15 shadow-sm scale-100 translate-y-0'
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-primary-light/40 pb-3">
                          <div>
                            <span className="text-xs text-gray-400 font-bold block uppercase">Order Number</span>
                            <span className="font-mono font-bold text-sm text-charcoal">{order.orderNumber}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' : order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-primary-light text-primary'}`}>
                              {order.orderStatus}
                            </span>
                            <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${order.paymentStatus === 'Success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              Payment: {order.paymentStatus}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-gray-400 font-bold uppercase block">Date & Time</span>
                            <span className="font-semibold text-charcoal">{new Date(order.createdAt).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-bold uppercase block">Delivery Slot</span>
                            <span className="font-semibold text-charcoal">{order.deliverySlot}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-bold uppercase block">Grand Total</span>
                            <span className="font-serif font-bold text-primary text-sm">₹{parseFloat(order.finalAmount).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Purchased Cakes Breakdown (Click to View) */}
                        <div className="pt-4 border-t border-primary-light/40 space-y-3">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Ordered Items (Click to View)</span>
                          <div className="grid grid-cols-1 gap-2.5">
                            {order.items && order.items.map((item, itemIdx) => {
                              const cakeImg = item.cake?.images?.[0]?.imageUrl || '/uploads/product-1.jpg';
                              const isItemOutOfStock = !item.cake || item.cake.stockQuantity <= 0 || item.cake.status !== 'Available';
                              return (
                                <div key={itemIdx} className="flex items-center gap-3.5 bg-white p-3 rounded-xl border border-primary-light/45 hover:border-primary-light transition-all shadow-sm">
                                  {/* Clickable Image */}
                                  <Link
                                    to={`/cake/${item.cakeId}`}
                                    className="h-12 w-12 rounded-lg overflow-hidden border border-primary-light/40 shrink-0 bg-cream hover:opacity-85 transition-opacity block"
                                    title="View Cake Specifications"
                                  >
                                    <img
                                      src={cakeImg}
                                      alt={item.cake?.name || 'Cake Product'}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/uploads/product-1.jpg';
                                      }}
                                    />
                                  </Link>

                                  {/* Custom Configuration Details */}
                                  <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Link
                                        to={`/cake/${item.cakeId}`}
                                        className="font-serif font-bold text-xs text-charcoal hover:text-primary transition-colors truncate block"
                                        title="View Cake Specifications"
                                      >
                                        {item.cake?.name || 'Custom Cake Options'}
                                      </Link>
                                      {isItemOutOfStock && (
                                        <span className="bg-red-100 text-red-800 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-red-200 animate-pulse shrink-0">
                                          Out of Stock
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-bold uppercase text-gray-400">
                                      <span className="bg-cream/40 px-1.5 py-0.5 rounded border border-gray-150">Qty: {item.quantity}</span>
                                      <span className="bg-cream/40 px-1.5 py-0.5 rounded border border-gray-200">{item.weight}kg</span>
                                      <span className="bg-cream/40 px-1.5 py-0.5 rounded border border-gray-250">{item.eggless ? 'Eggless' : 'Contains Egg'}</span>
                                      <span className="bg-cream/40 px-1.5 py-0.5 rounded border border-gray-250">{item.shape || 'Round'}</span>
                                      <span className="bg-cream/40 px-1.5 py-0.5 rounded border border-gray-250">{item.flavor || 'Standard'}</span>
                                    </div>
                                  </div>

                                  {/* Pricing details */}
                                  <div className="text-right shrink-0">
                                    <span className="text-primary font-bold text-xs font-serif block">
                                      ₹{parseFloat(item.price * item.quantity).toFixed(2)}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-semibold block">
                                      ₹{parseFloat(item.price).toFixed(2)} each
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Order Actions */}
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-primary-light/40 justify-between items-center">
                          <button
                            onClick={() => handleSelectTracking(order)}
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                          >
                            Live Tracking Details <ChevronRight size={14} />
                          </button>

                          <div className="flex gap-2 items-center">
                            <a
                              href={`/api/orders/${order.id}/invoice?token=${localStorage.getItem('hommey_token')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-cream hover:bg-cream-dark border border-gray-200 text-charcoal font-bold uppercase tracking-wider text-[10px] px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                            >
                              <FileText size={12} /> Invoice PDF
                            </a>

                            {order.orderStatus === 'Delivered' && order.paymentStatus === 'Success' && (
                              isOrderInStock(order) ? (
                                <button
                                  onClick={() => handleReorder(order)}
                                  className="bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-[10px] px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm hover:shadow active:scale-95"
                                >
                                  <RefreshCw size={12} /> Reorder
                                </button>
                              ) : (
                                <span className="bg-red-50 border border-red-250 text-red-600 font-bold uppercase tracking-wider text-[10px] px-4 py-2 rounded-xl flex items-center gap-1.5 select-none animate-pulse">
                                  <ShieldAlert size={12} /> Out of Stock
                                </span>
                              )
                            )}

                            {canCancel ? (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold uppercase tracking-wider text-[10px] px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                              >
                                <XCircle size={12} /> Cancel Order
                              </button>
                            ) : (
                              order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Delivered' && (
                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 italic bg-gray-50 border border-gray-100 p-2 rounded-xl">
                                  <ShieldAlert size={12} /> Cancellation Locked (5-Hr Expired)
                                </span>
                              )
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 3: Stepper Order Tracking */}
          {activeTab === 'track' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-8 sm:p-10 rounded-3xl border border-primary-light shadow-premium space-y-6">
              <h3 className="font-bold text-xl text-charcoal border-b border-primary-light pb-3">Stepper Order Tracking</h3>

              {/* Order selector form */}
              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Enter Order Number to track (e.g. HM-123456...)"
                  value={trackingIdInput}
                  onChange={(e) => setTrackingIdInput(e.target.value)}
                  className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/50 uppercase font-semibold"
                />
                <button
                  type="submit"
                  className="bg-charcoal hover:bg-charcoal-dark text-white px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center justify-center"
                >
                  Locate
                </button>
              </form>

              {trackingOrder ? (
                <div className="space-y-8 pt-4 animate-slide-up">
                  <div className="bg-primary-light/35 p-5 rounded-2xl border border-primary-light/60 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Tracking Target</span>
                      <h4 className="font-serif font-bold text-charcoal mt-0.5">{trackingOrder.orderNumber}</h4>
                    </div>
                    <div className="text-right sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Estimated Delivery</span>
                      <p className="text-xs font-bold text-charcoal mt-0.5">{trackingOrder.deliverySlot}</p>
                    </div>
                  </div>

                  {trackingOrder.orderStatus === 'Cancelled' ? (
                    <div className="bg-red-50 text-red-800 p-6 rounded-2xl border border-red-200 text-center space-y-2">
                      <ShieldAlert size={36} className="text-red-600 mx-auto" />
                      <h4 className="font-bold text-charcoal">Order Cancelled</h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto">
                        This order was cancelled on client request or administrative oversight. Stock has been returned and refund processing initialized.
                      </p>
                    </div>
                  ) : (
                    /* Visual Vertical / Horizontal Stepper */
                    <div className="relative flex flex-col md:flex-row justify-between items-center pt-8 pb-4 gap-8 md:gap-2">

                      {/* Step Progress Line */}
                      <div className="absolute top-[48px] left-[50%] md:left-[50px] right-[50%] md:right-[50px] h-[300px] md:h-1 bg-gray-200 -translate-x-[50%] md:translate-x-0 hidden md:block">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${(Math.max(0, getStepIndex(trackingOrder.orderStatus)) / 4) * 100}%` }}
                        ></div>
                      </div>

                      {timelineSteps.map((step, index) => {
                        const isCompleted = index <= getStepIndex(trackingOrder.orderStatus);
                        const isActive = index === getStepIndex(trackingOrder.orderStatus);

                        return (
                          <div key={index} className="relative z-10 flex flex-col items-center text-center space-y-2">
                            {/* Step Bubble */}
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 transition-all ${isCompleted ? 'bg-primary border-primary text-white scale-110' : 'bg-white border-gray-200 text-gray-400'} ${isActive && 'animate-pulse ring-4 ring-primary-light'}`}
                            >
                              {index + 1}
                            </div>
                            <div className="space-y-1">
                              <h5 className={`font-bold text-xs ${isCompleted ? 'text-charcoal' : 'text-gray-400'}`}>
                                {step}
                              </h5>
                              <p className="text-[9px] text-gray-400 font-semibold max-w-[120px]">
                                {step === 'Pending' && 'Order Placed'}
                                {step === 'Confirmed' && 'Payment Verified'}
                                {step === 'Preparing' && 'Baking in Ovens'}
                                {step === 'Out for Delivery' && 'With Delivery Partner'}
                                {step === 'Delivered' && 'Order Completed'}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-10 space-y-2 border-2 border-dashed border-primary-light/50 rounded-2xl bg-cream/10">
                  <Clock className="text-gray-300 mx-auto animate-spin" size={32} />
                  <p className="text-xs text-gray-400">Your dynamic stepper timeline will appear here once located.</p>
                </div>
              )}
            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
};

export default UserDashboard;
