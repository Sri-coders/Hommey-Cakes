import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight, Tag, X, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { removeFromCart, updateQuantity, applyCoupon, removeCoupon, calculateTotals } from '../store/cartSlice';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cartItems = useSelector((state) => state.cart.items);
  const appliedCoupon = useSelector((state) => state.cart.coupon);
  
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Dynamic calculations
  const totals = calculateTotals(cartItems, appliedCoupon);

  const handleQuantityChange = (item, nextQty) => {
    dispatch(updateQuantity({
      cakeId: item.cakeId,
      weight: item.weight,
      eggless: item.eggless,
      shape: item.shape,
      flavor: item.flavor,
      quantity: nextQty
    }));
  };

  const handleRemoveItem = (item) => {
    dispatch(removeFromCart({
      cakeId: item.cakeId,
      weight: item.weight,
      eggless: item.eggless,
      shape: item.shape,
      flavor: item.flavor
    }));
  };

  const handleValidateCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput) return;

    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await axios.post('/api/coupons/validate', {
        code: couponInput,
        totalAmount: parseFloat(totals.subtotal)
      });

      if (res.data.success) {
        dispatch(applyCoupon(res.data.coupon));
        setCouponSuccess(`Coupon applied! Saved ₹${res.data.coupon.discountValue}${res.data.coupon.discountType === 'Percentage' ? '%' : ''}`);
        setCouponInput('');
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon code.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    setCouponSuccess('');
    setCouponError('');
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-6">
        <ShoppingBag className="text-primary-light mx-auto" size={72} />
        <h2 className="font-serif font-bold text-2xl text-charcoal">Your shopping cart is empty</h2>
        <p className="text-gray-500 max-w-sm mx-auto text-sm">Fill your basket with sweet delights and delicious cupcakes to celebrate your life's best events!</p>
        <Link to="/shop" className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-premium transition-all">
          Browse Our Shop <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10"
    >
      <h1 className="text-4xl font-extrabold text-charcoal text-center sm:text-left">Shopping Basket</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Cart Items list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-primary-light p-6 sm:p-8 shadow-premium space-y-6">
            
            {cartItems.map((item, idx) => {
              const activePrice = item.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item.price);
              const itemTotal = activePrice * item.quantity;

              return (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-6 border-b border-primary-light/50 pb-6 last:border-none last:pb-0">
                  
                  {/* Image Link */}
                  <Link 
                    to={`/cake/${item.cakeId}`} 
                    className="h-24 w-24 rounded-xl overflow-hidden border border-primary-light shrink-0 bg-cream hover:opacity-85 transition-opacity cursor-pointer block"
                    title="View Cake Specifications"
                  >
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </Link>

                  {/* Title & custom configuration */}
                  <div className="flex-grow text-center sm:text-left space-y-1">
                    <Link 
                      to={`/cake/${item.cakeId}`} 
                      className="font-serif font-bold text-lg text-charcoal hover:text-primary transition-colors cursor-pointer block w-fit mx-auto sm:mx-0"
                      title="View Cake Specifications"
                    >
                      {item.name}
                    </Link>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start text-[10px] font-bold uppercase text-gray-400">
                      <span className="bg-cream px-2.5 py-0.5 rounded border border-gray-200">Weight: {item.weight}kg</span>
                      <span className="bg-cream px-2.5 py-0.5 rounded border border-gray-200">{item.eggless ? 'Eggless' : 'Contains Egg'}</span>
                      <span className="bg-cream px-2.5 py-0.5 rounded border border-gray-200">Shape: {item.shape || 'Round'}</span>
                      <span className="bg-cream px-2.5 py-0.5 rounded border border-gray-200">Flavor: {item.flavor || 'Standard'}</span>
                    </div>
                  </div>

                  {/* Pricing and control blocks */}
                  <div className="flex items-center gap-6 justify-between w-full sm:w-auto">
                    
                    {/* Qty increment block */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-9 bg-cream/50">
                      <button
                        disabled={item.quantity === 1}
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        className="w-8 h-full font-bold hover:bg-primary/10 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-bold">{item.quantity}</span>
                      <button
                        disabled={item.quantity >= item.stockLimit}
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        className="w-8 h-full font-bold hover:bg-primary/10 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-primary font-bold text-sm block">₹{itemTotal.toFixed(2)}</span>
                      <span className="text-[10px] text-gray-400 block">₹{activePrice.toFixed(2)} each</span>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="text-gray-400 hover:text-red-600 transition-colors focus:outline-none"
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        </div>

        {/* Right column: Order Summary & Coupon box */}
        <div className="space-y-6">
          
          {/* Order Summary card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primary-light shadow-premium space-y-6">
            <h3 className="font-bold text-lg text-charcoal border-b border-primary-light/50 pb-3">Order Summary</h3>
            
            <div className="space-y-3 text-sm text-charcoal-light">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">₹{totals.subtotal}</span>
              </div>
              
              {parseFloat(totals.discount) > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span className="flex items-center gap-1">Discount Coupon ({appliedCoupon?.code}):</span>
                  <span>-₹{totals.discount}</span>
                </div>
              )}

              <hr className="border-primary-light/50" />

              <div className="flex justify-between text-charcoal font-bold text-lg">
                <span>Grand Total:</span>
                <span className="text-primary font-serif">₹{totals.total}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs py-3.5 rounded-full shadow-premium flex items-center justify-center gap-2 transition-colors"
            >
              Proceed to Checkout <ArrowRight size={14} />
            </button>
          </div>

          {/* Coupon Coupon form */}
          <div className="bg-white p-6 rounded-3xl border border-primary-light shadow-premium space-y-4">
            <h4 className="font-bold text-sm text-charcoal flex items-center gap-1.5">
              <Tag size={16} className="text-primary" /> Apply Promo Code
            </h4>

            {appliedCoupon ? (
              <div className="bg-green-50 text-green-800 text-xs rounded-xl p-3 flex justify-between items-center border border-green-200">
                <span className="font-bold">Active Coupon: {appliedCoupon.code}</span>
                <button onClick={handleRemoveCoupon} className="text-green-800 hover:text-red-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleValidateCoupon} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Enter coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/50 uppercase font-semibold"
                />
                <button
                  type="submit"
                  disabled={validatingCoupon}
                  className="bg-charcoal hover:bg-charcoal-dark text-white px-4 rounded-xl text-xs font-bold uppercase shrink-0 transition-colors flex items-center justify-center"
                >
                  {validatingCoupon ? <RefreshCw className="animate-spin" size={14} /> : 'Apply'}
                </button>
              </form>
            )}

            {couponError && <p className="text-red-600 text-xs font-bold">{couponError}</p>}
            {couponSuccess && <p className="text-green-600 text-xs font-bold">{couponSuccess}</p>}
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default Cart;
