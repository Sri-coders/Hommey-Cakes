import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { CreditCard, Truck, ShieldAlert, ArrowLeft, RefreshCw, BadgeAlert } from 'lucide-react';
import axios from 'axios';
import { clearCart, calculateTotals } from '../store/cartSlice';
import { useToast } from '../components/ToastContext';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const appliedCoupon = useSelector((state) => state.cart.coupon);

  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [deliverySlot, setDeliverySlot] = useState('Standard Delivery (Morning 10 AM - 1 PM)');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const [submitting, setSubmitting] = useState(false);
  const [orderCreatedRecord, setOrderCreatedRecord] = useState(null);
  const [razorpayOrderData, setRazorpayOrderData] = useState(null);

  const totals = calculateTotals(cartItems, appliedCoupon);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const openRazorpayModal = async (orderRecord, razorData) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      return;
    }

    const options = {
      key: razorData.key,
      amount: Math.round(orderRecord.finalAmount * 100), // Convert directly to Paise
      currency: 'INR',
      name: 'Hommey Cakes Shop',
      description: `Order Payment for ${orderRecord.orderNumber}`,
      image: '/uploads/product-1.jpg',
      order_id: razorData.orderId,
      handler: async function (response) {
        setSubmitting(true);
        try {
          const verifyPayload = {
            orderId: orderRecord.id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          };

          const verifyRes = await axios.post('/api/orders/verify-payment', verifyPayload);
          if (verifyRes.data.success) {
            dispatch(clearCart());
            toast.success('Razorpay Payment verified successfully! Order confirmed.');
            navigate('/dashboard');
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Payment verification failed.');
        } finally {
          setSubmitting(false);
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: contactPhone || ''
      },
      theme: {
        color: '#F05288'
      }
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!shippingAddress || !contactPhone) {
      toast.warning('Please fill in your delivery address and contact phone.');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        items: cartItems.map(item => ({
          cakeId: item.cakeId,
          quantity: item.quantity,
          weight: item.weight,
          eggless: item.eggless,
          shape: item.shape,
          flavor: item.flavor
        })),
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        shippingAddress,
        contactPhone,
        deliverySlot,
        paymentMethod
      };

      const res = await axios.post('/api/orders', orderPayload);
      if (res.data.success) {
        const orderRecord = res.data.order;

        if (paymentMethod === 'Razorpay') {
          setOrderCreatedRecord(orderRecord);
          const razorData = {
            key: res.data.razorpayKey,
            orderId: res.data.razorpayOrderId
          };
          setRazorpayOrderData(razorData);

          // Open Razorpay Checkout modal immediately
          openRazorpayModal(orderRecord, razorData);
        } else {
          // Cash on Delivery - Success
          dispatch(clearCart());
          toast.success('Order successfully placed under Cash on Delivery!');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateRazorpaySuccess = async () => {
    if (!orderCreatedRecord || !razorpayOrderData) return;

    setSubmitting(true);
    try {
      // Simulate verification callback signature using the backend bypass token
      const verifyPayload = {
        orderId: orderCreatedRecord.id,
        razorpay_order_id: razorpayOrderData.orderId,
        razorpay_payment_id: `pay_sim_${Date.now()}`,
        razorpay_signature: 'bypass_test_signature'
      };

      const res = await axios.post('/api/orders/verify-payment', verifyPayload);
      if (res.data.success) {
        dispatch(clearCart());
        toast.success('Simulated Razorpay Payment verified successfully! Order confirmed.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment verification simulation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0 && !orderCreatedRecord) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif font-bold text-2xl text-charcoal">Your shopping cart is empty</h2>
        <button onClick={() => navigate('/shop')} className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase transition-colors">
          Explore Shop
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10"
    >
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/cart')} className="text-gray-400 hover:text-primary transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-4xl font-extrabold text-charcoal">Secure Checkout</h1>
      </div>

      {orderCreatedRecord && razorpayOrderData ? (
        /* Razorpay sandbox overlay screen */
        <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-primary shadow-2xl text-center space-y-6 animate-slide-up">
          <BadgeAlert size={48} className="text-primary mx-auto animate-bounce" />
          <h2 className="font-serif font-bold text-2xl text-charcoal">Payment Required</h2>
          <p className="text-sm text-gray-500">
            Order <span className="font-bold text-charcoal">{orderCreatedRecord.orderNumber}</span> created successfully under pending status.
          </p>

          <div className="bg-primary-light/40 p-4 rounded-xl text-xs space-y-2 text-charcoal text-left">
            <p><span className="font-bold">Total Amount:</span> ₹{orderCreatedRecord.finalAmount}</p>
            <p><span className="font-bold">Gateway Order ID:</span> {razorpayOrderData.orderId}</p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => openRazorpayModal(orderCreatedRecord, razorpayOrderData)}
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs py-3.5 rounded-full shadow-premium flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? <RefreshCw className="animate-spin" size={14} /> : 'Pay Online Now (Razorpay)'}
            </button>
            <button
              onClick={handleSimulateRazorpaySuccess}
              disabled={submitting}
              className="w-full bg-charcoal hover:bg-charcoal-dark text-white font-bold uppercase tracking-wider text-[10px] py-2.5 rounded-full shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? <RefreshCw className="animate-spin" size={14} /> : 'Bypass & Simulate Success (Testing)'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-xs font-bold text-gray-400 hover:text-charcoal transition-colors"
            >
              Skip & Pay COD at Store Later
            </button>
          </div>
        </div>
      ) : (
        /* Standard checkout forms */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Form column */}
          <form onSubmit={handleCheckoutSubmit} className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-primary-light shadow-premium space-y-6">
              <h3 className="font-bold text-lg text-charcoal border-b border-primary-light pb-3">Delivery Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400">Recipient Name</label>
                  <input
                    type="text"
                    disabled
                    value={user?.name || ''}
                    className="w-full text-sm border border-gray-100 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400">Contact Telephone</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. 9345628924"
                    className="w-full text-sm border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400">Shipping Delivery Address</label>
                <textarea
                  rows="3"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street Address, Appt No, Zip Code, Frisco, CO"
                  className="w-full text-sm border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl"
                ></textarea>
              </div>

              {/* Time Slots */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400">Preferred Delivery Slot</label>
                <select
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  className="w-full text-sm border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl bg-cream/50"
                >
                  <option value="Morning Slot (10:00 AM - 01:00 PM)">Morning Slot (10:00 AM - 01:00 PM)</option>
                  <option value="Afternoon Slot (01:00 PM - 04:00 PM)">Afternoon Slot (01:00 PM - 04:00 PM)</option>
                  <option value="Evening Slot (04:00 PM - 07:00 PM)">Evening Slot (04:00 PM - 07:00 PM)</option>
                </select>
              </div>

            </div>

            {/* Payment Method selection */}
            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-primary-light shadow-premium space-y-6">
              <h3 className="font-bold text-lg text-charcoal border-b border-primary-light pb-3">Payment Gateway</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`border-2 p-6 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-primary bg-primary-light/20' : 'border-gray-200 hover:border-primary-light'}`}
                >
                  <Truck className="text-primary shrink-0" size={24} />
                  <div>
                    <h5 className="font-bold text-sm text-charcoal">Cash on Delivery</h5>
                    <p className="text-[10px] text-gray-400">Pay inside store or at doorstep.</p>
                  </div>
                </div>

                {/* Razorpay gateway */}
                <div
                  onClick={() => setPaymentMethod('Razorpay')}
                  className={`border-2 p-6 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${paymentMethod === 'Razorpay' ? 'border-primary bg-primary-light/20' : 'border-gray-200 hover:border-primary-light'}`}
                >
                  <CreditCard className="text-primary shrink-0" size={24} />
                  <div>
                    <h5 className="font-bold text-sm text-charcoal">Razorpay Gateway</h5>
                    <p className="text-[10px] text-gray-400">Cards, UPI, or NetBanking.</p>
                  </div>
                </div>

              </div>
            </div>

          </form>

          {/* Right Summary Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-primary-light shadow-premium space-y-6">
              <h3 className="font-bold text-md text-charcoal border-b border-primary-light/50 pb-3">Review Basket</h3>

              <div className="max-h-60 overflow-y-auto space-y-4 pr-1">
                {cartItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div>
                      <h5 className="font-bold text-charcoal">{item.name}</h5>
                      <span className="text-[10px] text-gray-400 font-semibold">{item.quantity}x | {item.weight}kg</span>
                    </div>
                    <span className="font-bold text-primary">₹{((item.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item.price)) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <hr className="border-primary-light/50" />

              <div className="space-y-2 text-xs text-charcoal-light">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal}</span>
                </div>
                {parseFloat(totals.discount) > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Discount:</span>
                    <span>-₹{totals.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-charcoal font-bold text-sm pt-2">
                  <span>Grand Total:</span>
                  <span className="text-primary font-serif">₹{totals.total}</span>
                </div>
              </div>

              <button
                onClick={handleCheckoutSubmit}
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs py-3.5 rounded-full shadow-premium flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? <RefreshCw className="animate-spin" size={14} /> : `Confirm & Place Order`}
              </button>
            </div>
          </div>

        </div>
      )}

    </motion.div>
  );
};

export default Checkout;
