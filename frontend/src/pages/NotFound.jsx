import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cookie, ShoppingBag, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-6 animate-fade-in">
      <motion.div
        initial={{ rotate: -15, scale: 0.8 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <Cookie size={84} className="text-primary-light animate-pulse mx-auto" />
      </motion.div>
      
      <div className="space-y-2">
        <h1 className="text-6xl sm:text-8xl font-serif font-extrabold text-primary">404</h1>
        <h2 className="text-2xl font-serif font-bold text-charcoal">Oops! The cake is a lie...</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
          The bakery shelf or dessert page you are trying to reach has already been eaten or moved.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Link to="/" className="bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs px-6 py-3.5 rounded-full shadow-premium flex items-center gap-1.5 transition-colors">
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <Link to="/shop" className="bg-charcoal hover:bg-charcoal-dark text-white font-bold uppercase tracking-wider text-xs px-6 py-3.5 rounded-full transition-colors">
          Explore Our Cakes
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
