import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Cake, Sparkles, Heart, ShoppingCart, ArrowRight, Star, Clock, Trophy } from 'lucide-react';
import axios from 'axios';
import { addToCart } from '../store/cartSlice';
import RatingStars from '../components/RatingStars';
import { useToast } from '../components/ToastContext';
import QuickAddModal from '../components/QuickAddModal';

const Home = () => {
  const [featuredCakes, setFeaturedCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([
    { name: 'Cupcake', icon: <Cake className="text-primary" size={24} />, count: 'Loading...' },
    { name: 'Cake', icon: <Sparkles className="text-primary" size={24} />, count: 'Loading...' },
    { name: 'Red Velvet', icon: <Star className="text-primary" size={24} />, count: 'Loading...' },
    { name: 'Donut', icon: <Trophy className="text-primary" size={24} />, count: 'Loading...' },
  ]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeQuickAddCake, setActiveQuickAddCake] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await axios.get('/api/cakes/featured');
        if (res.data.success) {
          setFeaturedCakes(res.data.cakes);
        }
      } catch (err) {
        console.error('Error fetching featured cakes:', err);
        // Fallback mock seeds if server offline during first launch
        setFeaturedCakes([
          { id: 1, name: 'Dozen Cupcakes', category: 'Cupcake', price: 32.00, discountPrice: 28.00, ratings: 4.8, flavor: 'Vanilla', eggless: true, images: [{ imageUrl: '/uploads/product-1.jpg' }] },
          { id: 2, name: 'Cookies and Cream Cake', category: 'Cake', price: 30.00, discountPrice: null, ratings: 4.9, flavor: 'Oreo', eggless: true, images: [{ imageUrl: '/uploads/product-2.jpg' }] },
          { id: 8, name: 'Mississippi Mud Cake', category: 'Cake', price: 28.00, discountPrice: null, ratings: 4.9, flavor: 'Chocolate', eggless: true, images: [{ imageUrl: '/uploads/product-8.jpg' }] },
        ]);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/cakes?limit=100');
        if (res.data.success) {
          const cakesList = res.data.cakes;
          const counts = {};
          cakesList.forEach(cake => {
            const cat = cake.category || 'Cake';
            counts[cat] = (counts[cat] || 0) + 1;
          });

          const mapped = Object.keys(counts).map(catName => {
            let icon = <Sparkles className="text-primary" size={24} />;
            if (catName.toLowerCase().includes('cupcake')) {
              icon = <Cake className="text-primary" size={24} />;
            } else if (catName.toLowerCase().includes('velvet')) {
              icon = <Star className="text-primary" size={24} />;
            } else if (catName.toLowerCase().includes('biscuit')) {
              icon = <Star className="text-primary" size={24} />;
            } else if (catName.toLowerCase().includes('donut')) {
              icon = <Trophy className="text-primary" size={24} />;
            } else if (catName.toLowerCase().includes('cake')) {
              icon = <Sparkles className="text-primary" size={24} />;
            }
            return {
              name: catName,
              icon,
              count: `${counts[catName]} ${counts[catName] === 1 ? 'item' : 'items'}`
            };
          });
          setCategories(mapped);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Fallback default seeds
        setCategories([
          { name: 'Cupcake', icon: <Cake className="text-primary" size={24} />, count: '12 items' },
          { name: 'Cake', icon: <Sparkles className="text-primary" size={24} />, count: '8 items' },
          { name: 'Red Velvet', icon: <Star className="text-primary" size={24} />, count: '5 items' },
          { name: 'Donut', icon: <Trophy className="text-primary" size={24} />, count: '10 items' },
        ]);
      }
    };

    fetchFeatured();
    fetchCategories();
  }, []);

  const handleQuickAdd = (cake, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveQuickAddCake(cake);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-16 pb-20"
    >

      {/* 1. Hero Cover Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-cover bg-center overflow-hidden" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.3)), url('/uploads/img/footer-bg.jpg')" }}>
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 text-white space-y-6">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 bg-primary/95 text-white text-xs uppercase tracking-widest font-bold px-4 py-1.5 rounded-full"
          >
            <Sparkles size={14} /> Hommey Cakes Shop
          </motion.span>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl sm:text-6xl font-serif leading-tight font-extrabold max-w-4xl mx-auto"
          >
            Making your life sweeter <br />
            <span className="text-primary font-serif italic">one bite</span> at a time!
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-md sm:text-lg max-w-xl mx-auto text-gray-200"
          >
            Freshly baked gourmet cakes, mini cupcakes, and handcrafted pastries delivered straight from our ovens to your celebrations.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4 justify-center pt-4"
          >
            <Link to="/shop" className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-wider shadow-premium flex items-center gap-2 transition-all">
              Explore Our Cakes <ArrowRight size={16} />
            </Link>
            <Link to="/about" className="bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-wider backdrop-blur-md transition-all">
              Our Story
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. Core Dynamic Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Our Bakery Categories</span>
          <h2 className="text-3xl font-bold mt-2">What are you craving today?</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/shop?category=${cat.name}`)}
              className="bg-white p-6 rounded-2xl border border-primary-light flex flex-col items-center justify-center text-center cursor-pointer shadow-premium-hover hover:border-primary group"
            >
              <div className="bg-primary-light/50 p-4 rounded-full mb-4 group-hover:bg-primary/10 transition-colors">
                {cat.icon}
              </div>
              <h4 className="font-bold text-lg text-charcoal">{cat.name}</h4>
              <span className="text-xs text-gray-400 mt-1">{cat.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Dynamic Products Grid (Featured & Best Sellers) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white/50 py-12 rounded-3xl border border-primary-light/50 shadow-premium">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Baked Today</span>
            <h2 className="text-3xl font-bold mt-1">Our Featured Cakes</h2>
          </div>
          <Link to="/shop" className="text-primary hover:text-primary-dark font-bold text-sm uppercase tracking-wider flex items-center gap-1.5 group">
            View All Delights <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 mt-3">Loading fresh cakes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredCakes.map((cake) => {
              const activePrice = cake.discountPrice ? parseFloat(cake.discountPrice) : parseFloat(cake.price);
              const hasDiscount = !!cake.discountPrice;

              return (
                <div
                  key={cake.id}
                  onClick={() => navigate(`/cake/${cake.id}`)}
                  className="bg-white rounded-2xl overflow-hidden border border-primary-light shadow-premium-hover group cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative overflow-hidden aspect-square shrink-0">
                    <img
                      src={cake.images && cake.images[0] ? cake.images[0].imageUrl : '/uploads/product-1.jpg'}
                      alt={cake.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Tags */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="bg-primary text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {cake.category}
                      </span>
                      {cake.isBestSeller && (
                        <span className="bg-accent text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shadow-sm">
                          Best Seller
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-serif font-bold text-lg text-charcoal group-hover:text-primary transition-colors line-clamp-1">
                        {cake.name}
                      </h4>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Flavor: {cake.flavor}</span>
                        <span className="bg-primary-light text-primary font-bold px-2 py-0.5 rounded-md">
                          {cake.eggless ? 'Eggless' : 'With Egg'}
                        </span>
                      </div>

                      {/* Ratings */}
                      <div className="flex items-center gap-1.5">
                        <RatingStars rating={cake.ratings} />
                        <span className="text-xs font-bold text-gray-600">({cake.ratings})</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-primary-light/50 pt-4 mt-4">
                      <div>
                        {hasDiscount ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-primary font-bold text-lg">₹{activePrice.toFixed(2)}</span>
                            <span className="text-gray-400 line-through text-xs">₹{parseFloat(cake.price).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-primary font-bold text-lg">₹{parseFloat(cake.price).toFixed(2)}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleQuickAdd(cake, e)}
                        className="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-full shadow-sm transition-colors"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Professional Chef Info */}
      <section className="bg-primary-light/35 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-primary">
            <img src="/uploads/img/class-video.jpg" alt="Hommey Cakes Baking Class" className="w-full h-full object-cover" />
            <a href="https://www.youtube.com/watch?v=8PJ3_p7VqHw" target="_blank" className="absolute inset-0 flex items-center justify-center bg-black/35 hover:bg-black/45 transition-colors">
              <span className="bg-primary text-white p-5 rounded-full shadow-2xl animate-pulse">
                <Star size={32} className="fill-white" />
              </span>
            </a>
          </div>

          <div className="space-y-6">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Premium Quality</span>
            <h2 className="text-4xl font-serif font-bold text-charcoal">Made from your own hands!</h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              We don't just sell delicious ready-baked cakes, we also host custom cake decoration classes, pastry workshops, and provide specialized training from the master chefs of Queens! Learn standard cream-piping, chocolate sculpting, and sponge baking.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex gap-2.5 items-start">
                <Clock className="text-primary" size={24} />
                <div>
                  <h5 className="font-bold text-sm text-charcoal">4-Hour Prep Time</h5>
                  <p className="text-xs text-gray-500">Baked fresh upon your checkout.</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <Trophy className="text-primary" size={24} />
                <div>
                  <h5 className="font-bold text-sm text-charcoal">Award Winning Chefs</h5>
                  <p className="text-xs text-gray-500">Bespoke customized decorations.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Classic Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Testimonials</span>
          <h2 className="text-3xl font-bold mt-2">What our clients say</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-primary-light shadow-premium space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-primary-light">
                  <img src="/uploads/img/testimonial/ta-1.jpg" alt="Kerry D.Silva" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h5 className="font-bold text-charcoal">Kerry D.Silva</h5>
                  <span className="text-xs text-gray-400">New York</span>
                </div>
              </div>
              <RatingStars rating={5} />
            </div>
            <p className="text-sm italic text-gray-600 leading-relaxed">
              "The Mississippi Mud Cake was an absolute dream! It was so rich, moist, and chocolaty. Delivery was prompt, and the packaging kept the customized frosting pristine. Hommey Cakes is my new absolute favorite bakery."
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-primary-light shadow-premium space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-primary-light">
                  <img src="/uploads/img/testimonial/ta-2.jpg" alt="Ophelia Nunez" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h5 className="font-bold text-charcoal">Ophelia Nunez</h5>
                  <span className="text-xs text-gray-400">London</span>
                </div>
              </div>
              <RatingStars rating={4.8} />
            </div>
            <p className="text-sm italic text-gray-600 leading-relaxed">
              "Excellent standard and customer support! I ordered a customized Oreo vanilla sponge for my daughter's birthday. They accommodated our eggless requirement, and it tasted sensational. Everyone loved it!"
            </p>
          </div>
        </div>
      </section>

      {/* Option selection modal */}
      <QuickAddModal
        cake={activeQuickAddCake}
        isOpen={!!activeQuickAddCake}
        onClose={() => setActiveQuickAddCake(null)}
      />
    </motion.div>
  );
};

export default Home;
