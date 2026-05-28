import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, ShoppingCart, Heart, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { addToCart } from '../store/cartSlice';
import { toggleWishlist } from '../store/wishlistSlice';
import RatingStars from '../components/RatingStars';
import { useToast } from '../components/ToastContext';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const [hearts, setHearts] = useState([]);
  const [cartParticles, setCartParticles] = useState([]);

  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // States mirroring search parameters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') || '');
  const [flavor, setFlavor] = useState(searchParams.get('flavor') || '');
  const [eggless, setEggless] = useState(searchParams.get('eggless') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'Latest');

  const categories = ['Cupcake', 'Cake', 'Biscuit', 'Red Velvet', 'Donut'];

  const fetchCakes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (priceMin) params.priceMin = priceMin;
      if (priceMax) params.priceMax = priceMax;
      if (flavor) params.flavor = flavor;
      if (eggless) params.eggless = eggless;
      if (sort) params.sort = sort;
      params.page = currentPage.toString();
      params.limit = '8';

      const query = new URLSearchParams(params).toString();
      const res = await axios.get(`/api/cakes?${query}`);
      if (res.data.success) {
        setCakes(res.data.cakes);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching cakes:', err);
      // Mock Fallback
      setCakes([
        { id: 1, name: 'Dozen Cupcakes', category: 'Cupcake', price: 32.00, discountPrice: 28.00, ratings: 4.8, flavor: 'Vanilla', eggless: true, images: [{ imageUrl: '/uploads/product-1.jpg' }], stockQuantity: 10, status: 'Available' },
        { id: 2, name: 'Cookies and Cream Cake', category: 'Cake', price: 30.00, discountPrice: null, ratings: 4.9, flavor: 'Oreo', eggless: true, images: [{ imageUrl: '/uploads/product-2.jpg' }], stockQuantity: 5, status: 'Available' },
        { id: 3, name: 'Gluten Free Mini Dozen', category: 'Cupcake', price: 31.00, discountPrice: 27.50, ratings: 4.6, flavor: 'Assorted Fruit', eggless: true, images: [{ imageUrl: '/uploads/product-3.jpg' }], stockQuantity: 8, status: 'Available' },
        { id: 4, name: 'Cookie Dough Cake', category: 'Cake', price: 25.00, discountPrice: null, ratings: 4.7, flavor: 'Chocolate Chip', eggless: false, images: [{ imageUrl: '/uploads/product-4.jpg' }], stockQuantity: 0, status: 'Out of Stock' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCakes();
  }, [searchParams, currentPage]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    const newParams = {};
    if (search) newParams.search = search;
    if (category) newParams.category = category;
    if (priceMin) newParams.priceMin = priceMin;
    if (priceMax) newParams.priceMax = priceMax;
    if (flavor) newParams.flavor = flavor;
    if (eggless) newParams.eggless = eggless;
    if (sort) newParams.sort = sort;

    setCurrentPage(1); // Reset page on filter submit
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setPriceMin('');
    setPriceMax('');
    setFlavor('');
    setEggless('');
    setSort('Latest');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleQuickAdd = (cake, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cake.status === 'Out of Stock' || cake.stockQuantity <= 0) {
      toast.warning('This item is currently out of stock!');
      return;
    }

    dispatch(addToCart({
      cakeId: cake.id,
      name: cake.name,
      price: cake.price,
      discountPrice: cake.discountPrice,
      imageUrl: cake.images && cake.images[0] ? cake.images[0].imageUrl : '/uploads/product-1.jpg',
      quantity: 1,
      weight: 1.00,
      eggless: cake.eggless,
      stockQuantity: cake.stockQuantity
    }));
    toast.success(`"${cake.name}" added to shopping cart!`);
    
    // Spawn bakery & cart burst emojis at click coordinates!
    const clickX = e.clientX;
    const clickY = e.clientY;
    const emojis = ['🛒', '🧁', '🎂', '🍰', '🍪', '🍩', '✨'];
    
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: Math.random() + i,
      x: clickX,
      y: clickY,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      driftX: (Math.random() - 0.5) * 140, // drift left or right
      driftY: Math.random() * 160 + 80,    // drift upwards
      size: Math.random() * 0.7 + 0.8,     // random size scaling
      angle: (Math.random() - 0.5) * 120,  // random rotation
      duration: Math.random() * 0.4 + 0.8  // random animation duration
    }));

    setCartParticles(prev => [...prev, ...newParticles]);

    // Prune after animation completes
    setTimeout(() => {
      setCartParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 1500);
  };

  const handleToggleWishlist = (cake, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isAdding = !wishlistItems.some(item => item.id === cake.id);
    dispatch(toggleWishlist(cake));

    if (isAdding) {
      toast.success(`"${cake.name}" added to wishlist!`);
      
      // Spawn heart burst emojis at click coordinates!
      const clickX = e.clientX;
      const clickY = e.clientY;
      const emojis = ['❤️', '💖', '💕', '💘', '💝', '✨'];
      
      const newHearts = Array.from({ length: 12 }).map((_, i) => ({
        id: Math.random() + i,
        x: clickX,
        y: clickY,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        driftX: (Math.random() - 0.5) * 120, // drift left or right
        driftY: Math.random() * 150 + 80,    // drift upwards
        size: Math.random() * 0.8 + 0.8,     // random size scaling
        angle: (Math.random() - 0.5) * 90,   // random rotation
        duration: Math.random() * 0.4 + 0.8  // random animation duration
      }));

      setHearts(prev => [...prev, ...newHearts]);

      // Prune after animation completes
      setTimeout(() => {
        setHearts(prev => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
      }, 1500);
    } else {
      toast.success(`"${cake.name}" removed from wishlist.`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-charcoal">Hommey Bakery Catalog</h1>
        <p className="text-sm text-gray-500 mt-2">Filter and find the perfect cake for your sweet celebrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left Side: Advanced Filters Bar */}
        <div className="bg-white p-6 rounded-3xl border border-primary-light h-fit space-y-6 shadow-premium">
          <div className="flex justify-between items-center border-b border-primary-light pb-4">
            <h3 className="font-bold flex items-center gap-2 text-charcoal">
              <SlidersHorizontal size={18} className="text-primary" />
              Refine Search
            </h3>
            <button onClick={handleClearFilters} className="text-xs text-primary font-bold hover:underline">
              Clear All
            </button>
          </div>

          <form onSubmit={handleApplyFilters} className="space-y-5">
            {/* 1. Name Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Search Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Cupcake"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-sm border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl pr-10"
                />
                <Search size={18} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            {/* 2. Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl"
              >
                <option value="">All Categories</option>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* 3. Price Bounds */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Price Bounds (₹)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-1/2 text-sm border border-gray-200 focus:border-primary px-3 py-2 rounded-xl"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-1/2 text-sm border border-gray-200 focus:border-primary px-3 py-2 rounded-xl"
                />
              </div>
            </div>

            {/* 4. Flavor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Flavor profile</label>
              <input
                type="text"
                placeholder="e.g. Chocolate, Caramel"
                value={flavor}
                onChange={(e) => setFlavor(e.target.value)}
                className="w-full text-sm border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl"
              />
            </div>

            {/* 5. Egg / Eggless */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Recipe Type</label>
              <select
                value={eggless}
                onChange={(e) => setEggless(e.target.value)}
                className="w-full text-sm border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl"
              >
                <option value="">Any Recipe Type</option>
                <option value="true">100% Eggless</option>
                <option value="false">Contains Egg</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl shadow-premium transition-colors"
            >
              Apply Filter Parameters
            </button>
          </form>
        </div>

        {/* Right Side: Products List */}
        <div className="lg:col-span-3 space-y-6">

          {/* Top toolbar */}
          <div className="bg-white px-6 py-4 rounded-2xl border border-primary-light flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
            <span className="text-xs font-semibold text-gray-500">
              Showing {cakes.length} delicious bakery items
            </span>

            <div className="flex gap-2 items-center">
              <label className="text-xs font-bold uppercase text-gray-400">Sort By:</label>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setSearchParams({ ...Object.fromEntries(searchParams), sort: e.target.value });
                }}
                className="text-xs font-bold text-charcoal border-none bg-transparent cursor-pointer focus:ring-0"
              >
                <option value="Latest">Newest Additions</option>
                <option value="PriceLowToHigh">Price: Low to High</option>
                <option value="PriceHighToLow">Price: High to Low</option>
                <option value="Popular">Best Customer Ratings</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 bg-white/40 rounded-3xl border border-primary-light">
              <RefreshCw className="animate-spin text-primary mx-auto mb-4" size={32} />
              <p className="text-sm font-semibold text-gray-500">Kneading and mixing catalog items...</p>
            </div>
          ) : cakes.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-primary-light shadow-sm space-y-4">
              <SlidersHorizontal className="text-gray-300 mx-auto" size={48} />
              <h3 className="font-serif font-bold text-xl text-charcoal">No cakes matched your criteria</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">Try broadening your pricing bounds, removing filters, or searching for other delicious words.</p>
              <button onClick={handleClearFilters} className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors">
                Reset Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {cakes.map((cake) => {
                const activePrice = cake.discountPrice ? parseFloat(cake.discountPrice) : parseFloat(cake.price);
                const hasDiscount = !!cake.discountPrice;
                const isOutOfStock = cake.status === 'Out of Stock' || cake.stockQuantity <= 0;

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

                      {/* Image Banners */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        <span className="bg-primary text-white text-[9px] uppercase font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                          {cake.category}
                        </span>
                        {isOutOfStock && (
                          <span className="bg-red-600 text-white text-[9px] uppercase font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                            Sold Out
                          </span>
                        )}
                      </div>

                      {/* Wishlist toggle */}
                      {(() => {
                        const isWishlisted = wishlistItems.some(item => item.id === cake.id);
                        return (
                          <button
                            onClick={(e) => handleToggleWishlist(cake, e)}
                            className="absolute top-3 right-3 bg-white/80 hover:bg-white text-primary p-2 rounded-full shadow-md backdrop-blur-sm transition-all active:scale-95"
                          >
                            <Heart
                              size={16}
                              className={`transition-all duration-300 ${
                                isWishlisted 
                                  ? 'fill-primary text-primary scale-110' 
                                  : 'text-primary hover:scale-110'
                              }`}
                            />
                          </button>
                        );
                      })()}
                    </div>

                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div className="space-y-2">
                        <h4 className="font-serif font-bold text-md text-charcoal group-hover:text-primary transition-colors line-clamp-1">
                          {cake.name}
                        </h4>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase font-bold">
                          <span>Flavor: {cake.flavor}</span>
                          <span className="text-primary">{cake.eggless ? 'Eggless' : 'With Egg'}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <RatingStars rating={cake.ratings} size={14} />
                          <span className="text-[10px] font-bold text-gray-500">({cake.ratings})</span>
                        </div>
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
                          className={`p-2.5 rounded-full shadow-sm transition-all active:scale-95 hover:scale-105 ${
                            isOutOfStock 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-primary hover:bg-primary-dark text-white'
                          }`}
                          title="Add to Shopping Cart"
                        >
                          <ShoppingCart size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-6">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="bg-white border border-primary-light hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-colors"
              >
                Previous
              </button>

              <span className="text-xs font-bold text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="bg-white border border-primary-light hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-colors"
              >
                Next
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Floating Heart burst particle emitters */}
      <AnimatePresence>
        {hearts.map(heart => (
          <motion.span
            key={heart.id}
            initial={{ opacity: 1, scale: 0.1, x: heart.x - 12, y: heart.y - 12 }}
            animate={{
              opacity: 0,
              scale: heart.size,
              x: heart.x + heart.driftX - 12,
              y: heart.y - heart.driftY - 12,
              rotate: heart.angle
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: heart.duration, ease: 'easeOut' }}
            className="fixed left-0 top-0 pointer-events-none text-xl z-50 select-none"
          >
            {heart.emoji}
          </motion.span>
        ))}
      </AnimatePresence>

      {/* Floating Cart burst particle emitters */}
      <AnimatePresence>
        {cartParticles.map(p => (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, scale: 0.1, x: p.x - 12, y: p.y - 12 }}
            animate={{
              opacity: 0,
              scale: p.size,
              x: p.x + p.driftX - 12,
              y: p.y - p.driftY - 12,
              rotate: p.angle
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.duration, ease: 'easeOut' }}
            className="fixed left-0 top-0 pointer-events-none text-xl z-50 select-none"
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default Shop;
