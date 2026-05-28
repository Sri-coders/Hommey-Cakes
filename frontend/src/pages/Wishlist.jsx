import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { toggleWishlist, clearWishlist } from '../store/wishlistSlice';
import { addToCart } from '../store/cartSlice';
import RatingStars from '../components/RatingStars';
import { useToast } from '../components/ToastContext';
import QuickAddModal from '../components/QuickAddModal';

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const toast = useToast();
  const [activeQuickAddCake, setActiveQuickAddCake] = useState(null);

  const handleQuickAdd = (cake, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cake.stockQuantity <= 0) {
      toast.warning('This item is currently out of stock.');
      return;
    }
    setActiveQuickAddCake(cake);
  };

  const handleRemove = (cake, e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist(cake));
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-6 animate-fade-in">
        <Heart className="text-primary-light mx-auto animate-pulse" size={72} />
        <h2 className="font-serif font-bold text-2xl text-charcoal">Your wishlist is empty</h2>
        <p className="text-gray-500 max-w-sm mx-auto text-sm">Save your favorite cakes and treats here to purchase them quickly for upcoming celebrations!</p>
        <Link to="/shop" className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-premium transition-all">
          Explore Our Shop <ArrowRight size={16} />
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-4xl font-extrabold text-charcoal">My Saved Favorites</h1>
        <button
          onClick={() => {
            dispatch(clearWishlist());
            toast.success('Favorites cleared.');
          }}
          className="text-xs font-bold uppercase tracking-wider border border-red-200 hover:border-red-500 text-red-500 px-4 py-2 rounded-xl transition-all"
        >
          Clear All Favorites
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {wishlistItems.map((cake) => {
          const activePrice = cake.discountPrice ? parseFloat(cake.discountPrice) : parseFloat(cake.price);
          const hasDiscount = !!cake.discountPrice;
          const isOutOfStock = cake.stockQuantity <= 0;

          return (
            <div
              key={cake.id}
              onClick={() => navigate(`/cake/${cake.id}`)}
              className="bg-white rounded-2xl overflow-hidden border border-primary-light shadow-premium-hover group cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-square overflow-hidden shrink-0">
                <img
                  src={cake.images && cake.images[0] ? cake.images[0].imageUrl : '/uploads/product-1.jpg'}
                  alt={cake.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <button
                  onClick={(e) => handleRemove(cake, e)}
                  className="absolute top-3 right-3 bg-white hover:bg-red-50 text-red-500 p-2 rounded-full shadow-md transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="p-5 flex-grow flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-md text-charcoal group-hover:text-primary transition-colors line-clamp-1">
                    {cake.name}
                  </h4>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase">
                    <span>Flavor: {cake.flavor}</span>
                    <span className="text-primary">{cake.eggless ? 'Eggless' : 'With Egg'}</span>
                  </div>
                  <RatingStars rating={cake.ratings} size={12} />
                </div>

                <div className="flex items-center justify-between border-t border-primary-light/50 pt-4 mt-4">
                  <div>
                    {hasDiscount ? (
                      <div className="flex items-center gap-1">
                        <span className="text-primary font-bold text-md">₹{activePrice.toFixed(2)}</span>
                        <span className="text-gray-400 line-through text-[10px]">₹{parseFloat(cake.price).toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-primary font-bold text-md">₹{parseFloat(cake.price).toFixed(2)}</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleQuickAdd(cake, e)}
                    disabled={isOutOfStock}
                    className={`p-2.5 rounded-full shadow-sm transition-all ${isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark text-white'}`}
                  >
                    <ShoppingCart size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Option selection modal */}
      <QuickAddModal
        cake={activeQuickAddCake}
        isOpen={!!activeQuickAddCake}
        onClose={() => setActiveQuickAddCake(null)}
      />
    </motion.div>
  );
};

export default Wishlist;
