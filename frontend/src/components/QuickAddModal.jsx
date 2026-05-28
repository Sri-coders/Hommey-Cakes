import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Info } from 'lucide-react';
import { addToCart } from '../store/cartSlice';
import { useToast } from './ToastContext';

const QuickAddModal = ({ cake, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const toast = useToast();

  // Reset local customization state when cake changes
  const [weight, setWeight] = useState(1.00);
  const [eggless, setEggless] = useState(true);
  const [shape, setShape] = useState('Round');
  const [selectedFlavor, setSelectedFlavor] = useState('Standard');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (cake) {
      const defaultWeight = parseFloat(cake.weight || 1.00);
      setWeight(defaultWeight);
      setEggless(cake.eggless !== undefined ? cake.eggless : true);
      setQuantity(1);

      if (cake.shape) {
        const shapes = cake.shape.split(',').map(s => s.trim());
        if (shapes.length > 0) setShape(shapes[0]);
        else setShape('Round');
      } else {
        setShape('Round');
      }

      if (cake.flavor) {
        const flavors = cake.flavor.split(',').map(s => s.trim());
        if (flavors.length > 0) setSelectedFlavor(flavors[0]);
        else setSelectedFlavor('Standard');
      } else {
        setSelectedFlavor('Standard');
      }
    }
  }, [cake, isOpen]);

  if (!isOpen || !cake) return null;

  const availableShapes = cake.shape ? cake.shape.split(',').map(s => s.trim()) : ['Round'];
  const availableFlavors = cake.flavor ? cake.flavor.split(',').map(s => s.trim()) : ['Standard'];

  // Price adjustment dynamic calculation
  const activeBasePrice = cake.discountPrice ? parseFloat(cake.discountPrice) : parseFloat(cake.price);
  const defaultWeightVal = parseFloat(cake.weight || 1.00);
  const weightRatio = weight / defaultWeightVal;
  const adjustedPrice = activeBasePrice * weightRatio;

  const handleAddToCart = () => {
    dispatch(addToCart({
      cakeId: cake.id,
      name: cake.name,
      price: adjustedPrice,
      discountPrice: null, // use calculated final price directly
      imageUrl: cake.images && cake.images[0] ? cake.images[0].imageUrl : '/uploads/product-1.jpg',
      quantity,
      weight,
      eggless,
      shape,
      flavor: selectedFlavor,
      stockQuantity: cake.stockQuantity
    }));

    toast.success(`"${cake.name}" (${weight}kg, ${eggless ? 'Eggless' : 'Contains Egg'}, ${shape}, ${selectedFlavor}) added to cart!`);
    onClose();
  };

  const isOutOfStock = cake.status === 'Out of Stock' || cake.stockQuantity <= 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm">
        {/* Backdrop motion wrapper */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        {/* Modal Card container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl bg-white border border-primary-light rounded-3xl shadow-2xl overflow-hidden glass z-10 flex flex-col md:flex-row"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-cream hover:bg-primary-light/40 text-charcoal hover:text-primary transition-all active:scale-95 shadow-sm z-20"
          >
            <X size={18} />
          </button>

          {/* Left section: Visual Image */}
          <div className="w-full md:w-5/12 bg-cream flex items-center justify-center relative min-h-[220px] md:min-h-full">
            <img
              src={cake.images && cake.images[0] ? cake.images[0].imageUrl : '/uploads/product-1.jpg'}
              alt={cake.name}
              className="w-full h-full object-cover absolute inset-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/10" />
            
            {/* Category tag */}
            <span className="absolute bottom-4 left-4 bg-primary text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md">
              {cake.category}
            </span>
          </div>

          {/* Right section: Choices Customization Form */}
          <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Title & Short description */}
              <div>
                <h3 className="text-2xl font-extrabold text-charcoal pr-6 line-clamp-1">{cake.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-primary font-serif font-black text-xl">₹{adjustedPrice.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">(Calculated Cost)</span>
                </div>
              </div>

              <hr className="border-primary-light/50" />

              {/* Selection Grids */}
              <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                
                {/* 1. Weight and Eggless row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Weight Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Weight Selection</label>
                    <select
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value))}
                      className="w-full text-xs border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/50 font-semibold"
                    >
                      <option value={defaultWeightVal / 2}>0.5 kg (Mini size)</option>
                      <option value={defaultWeightVal}>1.0 kg (Regular size)</option>
                      <option value={defaultWeightVal * 2}>2.0 kg (Double size)</option>
                    </select>
                  </div>

                  {/* Eggless Option Checkbox */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Recipe Type</label>
                    <div className="flex items-center h-[42px] px-3 bg-cream/50 rounded-xl border border-gray-200">
                      <input
                        type="checkbox"
                        id="quick-eggless-chk"
                        checked={eggless}
                        onChange={(e) => setEggless(e.target.checked)}
                        className="accent-primary h-4 w-4 rounded cursor-pointer"
                      />
                      <label htmlFor="quick-eggless-chk" className="text-[10px] font-bold text-charcoal ml-2 cursor-pointer select-none">
                        100% Eggless
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Shape Buttons */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Cake Shape</label>
                  <div className="flex flex-wrap gap-2">
                    {availableShapes.map((sh) => {
                      const isSelected = shape === sh;
                      return (
                        <button
                          key={sh}
                          type="button"
                          onClick={() => setShape(sh)}
                          className={`text-[10px] font-bold px-3.5 py-2 rounded-xl transition-all border ${
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

                {/* 3. Flavor Buttons */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Cake Flavor</label>
                  <div className="flex flex-wrap gap-2">
                    {availableFlavors.map((fl) => {
                      const isSelected = selectedFlavor === fl;
                      return (
                        <button
                          key={fl}
                          type="button"
                          onClick={() => setSelectedFlavor(fl)}
                          className={`text-[10px] font-bold px-3.5 py-2 rounded-xl transition-all border ${
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

              </div>
            </div>

            {/* Quantity Selector and CTA Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
              
              {/* Qty increment block */}
              <div className="flex items-center justify-between border border-gray-200 rounded-xl overflow-hidden h-[44px] w-full sm:w-28 bg-cream/50 shrink-0">
                <button
                  type="button"
                  disabled={quantity === 1}
                  onClick={() => setQuantity(quantity - 1)}
                  className="w-8 h-full font-bold hover:bg-primary/10 transition-colors disabled:opacity-40"
                >
                  -
                </button>
                <span className="font-bold text-xs">{quantity}</span>
                <button
                  type="button"
                  disabled={quantity >= (cake.stockQuantity || 10)}
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-full font-bold hover:bg-primary/10 transition-colors disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 bg-primary hover:bg-primary-dark disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold uppercase tracking-wider text-[10px] h-[44px] rounded-xl flex items-center justify-center gap-2 shadow-premium transition-all active:scale-[0.98]"
                >
                  <ShoppingCart size={14} /> Add to Cart
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-charcoal hover:bg-charcoal-dark text-white font-bold uppercase tracking-wider text-[10px] h-[44px] px-4 rounded-xl transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickAddModal;
