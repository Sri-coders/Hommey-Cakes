import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, ShieldAlert, Sparkles, Clock, CheckCircle2, ChevronRight, Video, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { addToCart } from '../store/cartSlice';
import { toggleWishlist } from '../store/wishlistSlice';
import RatingStars from '../components/RatingStars';
import { useToast } from '../components/ToastContext';

const CakeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { isAuthenticated } = useSelector((state) => state.auth);

  const [cake, setCake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  
  // Customization choices
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [weight, setWeight] = useState(1.00);
  const [eggless, setEggless] = useState(true);
  const [shape, setShape] = useState('Round');
  const [selectedFlavor, setSelectedFlavor] = useState('Standard');
  const [quantity, setQuantity] = useState(1);

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFiles, setReviewFiles] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchCakeDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/cakes/${id}`);
      if (res.data.success) {
        setCake(res.data.cake);
        setWeight(parseFloat(res.data.cake.weight || 1.00));
        setEggless(res.data.cake.eggless);
        if (res.data.cake.shape) {
          const shapes = res.data.cake.shape.split(',').map(s => s.trim());
          if (shapes.length > 0) {
            setShape(shapes[0]);
          } else {
            setShape('Round');
          }
        } else {
          setShape('Round');
        }
        if (res.data.cake.flavor) {
          const flavors = res.data.cake.flavor.split(',').map(s => s.trim());
          if (flavors.length > 0) {
            setSelectedFlavor(flavors[0]);
          } else {
            setSelectedFlavor('Standard');
          }
        } else {
          setSelectedFlavor('Standard');
        }

        // Fetch related products
        const relRes = await axios.get(`/api/cakes?category=${res.data.cake.category}&limit=4`);
        if (relRes.data.success) {
          setRelated(relRes.data.cakes.filter(c => c.id !== parseInt(id)));
        }
      }
    } catch (err) {
      console.error('Error fetching cake details:', err);
      // Mock Fallback
      setCake({
        id: parseInt(id),
        name: 'Cookies and Cream Cake',
        category: 'Cake',
        description: 'Decadent chocolate layers sandwiched with whipped cream and crushed oreo cookies. Frosted with oreo butter-cream and topped with whole oreos. Beautifully crafted and delicious.',
        price: 30.00,
        discountPrice: 26.50,
        stockQuantity: 6,
        flavor: 'Oreo Fudge',
        weight: 1.50,
        eggless: true,
        shape: 'Round',
        ratings: 4.9,
        prepTime: 4,
        deliveryTime: 'Next Day Delivery',
        status: 'Available',
        images: [
          { id: 1, imageUrl: '/uploads/product-2.jpg', isVideo: false },
          { id: 2, imageUrl: '/uploads/product-3.jpg', isVideo: false }
        ],
        reviews: [
          { id: 1, rating: 5, comment: 'Simply the best oreo cake I have ever bought! Highly recommended.', user: { name: 'Sarah Miller' } }
        ]
      });
      setShape('Round');
      setSelectedFlavor('Oreo Fudge');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCakeDetails();
    setActiveMediaIndex(0);
    setQuantity(1);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto mb-4"></div>
        <h3 className="font-serif font-bold text-lg text-gray-500">Mixing cake layers...</h3>
      </div>
    );
  }

  if (!cake) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif font-bold text-2xl text-charcoal">Oops! Cake not found.</h2>
        <Link to="/shop" className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Price adjustment dynamic calculation
  const activeBasePrice = cake.discountPrice ? parseFloat(cake.discountPrice) : parseFloat(cake.price);
  const weightRatio = weight / parseFloat(cake.weight || 1.00);
  const adjustedPrice = activeBasePrice * weightRatio;

  const handleAddToCart = () => {
    dispatch(addToCart({
      cakeId: cake.id,
      name: cake.name,
      price: adjustedPrice,
      discountPrice: null, // calculated final price is used as direct base
      imageUrl: cake.images && cake.images[0] ? cake.images[0].imageUrl : '/uploads/product-1.jpg',
      quantity,
      weight,
      eggless,
      shape,
      flavor: selectedFlavor,
      stockQuantity: cake.stockQuantity
    }));
    toast.success(`"${cake.name}" (${weight}kg, ${eggless ? 'Eggless' : 'Contains Egg'}, Shape: ${shape}, Flavor: ${selectedFlavor}) added to cart!`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Please sign in to write customer reviews.');
      return;
    }

    setSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('cakeId', cake.id.toString());
      formData.append('rating', reviewRating.toString());
      formData.append('comment', reviewComment);
      
      for (const file of reviewFiles) {
        formData.append('images', file);
      }

      const res = await axios.post('/api/reviews', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success('Review submitted successfully! Thank you.');
        setReviewComment('');
        setReviewFiles([]);
        fetchCakeDetails(); // refresh reviews grid
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification restricted: You can only review products that you have purchased and received.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const currentMedia = cake.images && cake.images[activeMediaIndex] ? cake.images[activeMediaIndex] : null;
  const isOutOfStock = cake.status === 'Out of Stock' || cake.stockQuantity <= 0;
  const availableShapes = cake.shape ? cake.shape.split(',').map(s => s.trim()) : ['Round'];
  const availableFlavors = cake.flavor ? cake.flavor.split(',').map(s => s.trim()) : ['Standard'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16"
    >
      
      {/* 1. Details section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-8 sm:p-12 rounded-3xl border border-primary-light shadow-premium">
        
        {/* Left column: Image/Video Showcase */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-primary-light bg-cream flex items-center justify-center">
            {currentMedia ? (
              currentMedia.isVideo ? (
                <video src={currentMedia.imageUrl} controls className="w-full h-full object-cover" />
              ) : (
                <img src={currentMedia.imageUrl} alt={cake.name} className="w-full h-full object-cover" />
              )
            ) : (
              <img src="/uploads/product-1.jpg" alt="Fallback product image" className="w-full h-full object-cover" />
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-red-600 text-white font-bold tracking-wider text-xs uppercase px-5 py-2.5 rounded-full shadow-lg flex gap-1 items-center">
                  <ShieldAlert size={16} /> Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails row */}
          {cake.images && cake.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {cake.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`relative h-20 w-20 rounded-xl overflow-hidden border-2 shrink-0 ${activeMediaIndex === idx ? 'border-primary' : 'border-primary-light/50'}`}
                >
                  <img src={img.imageUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  {img.isVideo && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                      <Video size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Specs cards */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full">
              {cake.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal">{cake.name}</h1>
            
            {/* Ratings */}
            <div className="flex items-center gap-2">
              <RatingStars rating={cake.ratings} size={18} />
              <span className="text-sm font-bold text-gray-600">({cake.ratings} Customer Rating)</span>
            </div>
            
            <hr className="border-primary-light/50" />
            
            {/* Pricing */}
            <div className="pt-2">
              <span className="text-sm text-gray-400 font-semibold block">Calculated Price:</span>
              <span className="text-primary font-serif font-extrabold text-3xl">
                ₹{adjustedPrice.toFixed(2)}
              </span>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed pt-2">{cake.description}</p>
          </div>

          {/* Customization selection drawers */}
          <div className="space-y-4 pt-4 border-t border-primary-light/50">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Weight Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400">Weight Selection</label>
                <select
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  className="w-full text-sm border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl bg-cream/50"
                >
                  <option value={parseFloat(cake.weight || 1.00) / 2}>0.5 kg (Mini size)</option>
                  <option value={parseFloat(cake.weight || 1.00)}>1.0 kg (Regular size)</option>
                  <option value={parseFloat(cake.weight || 1.00) * 2}>2.0 kg (Double size)</option>
                </select>
              </div>

              {/* Eggless Option */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400">Recipe Type</label>
                <div className="flex items-center h-[46px] px-3 bg-cream/50 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="eggless-chk"
                    checked={eggless}
                    onChange={(e) => setEggless(e.target.checked)}
                    className="accent-primary h-4 w-4 rounded cursor-pointer"
                  />
                  <label htmlFor="eggless-chk" className="text-xs font-bold text-charcoal ml-2 cursor-pointer">
                    100% Eggless
                  </label>
                </div>
              </div>

            </div>

            {/* Shape Selector */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold uppercase text-gray-400 block mb-2">Cake Shape</label>
              <div className="flex flex-wrap gap-2">
                {availableShapes.map((sh) => {
                  const isSelected = shape === sh;
                  return (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => setShape(sh)}
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

            {/* Flavor Selector */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold uppercase text-gray-400 block mb-2">Cake Flavor</label>
              <div className="flex flex-wrap gap-2">
                {availableFlavors.map((fl) => {
                  const isSelected = selectedFlavor === fl;
                  return (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => setSelectedFlavor(fl)}
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

            {/* Quantity Selector and Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              
              {/* Qty increment block */}
              <div className="flex items-center justify-between border border-gray-200 rounded-xl overflow-hidden h-[50px] w-full sm:w-32 bg-cream/50 shrink-0">
                <button
                  disabled={quantity === 1}
                  onClick={() => setQuantity(quantity - 1)}
                  className="w-10 h-full font-bold hover:bg-primary/10 transition-colors"
                >
                  -
                </button>
                <span className="font-bold text-sm">{quantity}</span>
                <button
                  disabled={quantity >= (cake.stockQuantity || 1)}
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-full font-bold hover:bg-primary/10 transition-colors"
                >
                  +
                </button>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 bg-primary hover:bg-primary-dark disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold uppercase tracking-wider text-xs h-[50px] rounded-xl flex items-center justify-center gap-2 shadow-premium transition-all"
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="flex-1 bg-charcoal hover:bg-charcoal-dark disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold uppercase tracking-wider text-xs h-[50px] rounded-xl flex items-center justify-center transition-all"
                >
                  Buy Now
                </button>
              </div>

            </div>

            {/* Quick specifications badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] uppercase font-bold text-gray-500 pt-4 border-t border-primary-light/50">
              <div className="bg-cream/40 p-2.5 rounded-lg border border-primary-light/30 flex flex-col items-center gap-1">
                <Clock size={14} className="text-primary" />
                <span>Prep: {cake.prepTime} Hrs</span>
              </div>
              <div className="bg-cream/40 p-2.5 rounded-lg border border-primary-light/30 flex flex-col items-center gap-1">
                <Sparkles size={14} className="text-primary" />
                <span>Flavor: {selectedFlavor}</span>
              </div>
              <div className="bg-cream/40 p-2.5 rounded-lg border border-primary-light/30 flex flex-col items-center gap-1">
                <CheckCircle2 size={14} className="text-primary" />
                <span>Shape: {shape}</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 2. Customer Reviews section */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-primary-light shadow-premium grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left: Rating stats & write a review form */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-charcoal">Customer Reviews</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl font-extrabold text-primary">{cake.ratings}</span>
              <div className="space-y-0.5">
                <RatingStars rating={cake.ratings} size={16} />
                <span className="text-xs text-gray-400 font-semibold block">Based on verified purchases</span>
              </div>
            </div>
          </div>

          <hr className="border-primary-light/50" />

          {/* Form */}
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <h4 className="font-bold text-sm uppercase text-gray-500">Submit Customer Review</h4>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Rating Score</label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(parseInt(e.target.value))}
                className="w-full text-xs border border-gray-200 px-3 py-2 rounded-xl focus:border-primary bg-cream/50"
              >
                <option value="5">5 Stars - Sensational</option>
                <option value="4">4 Stars - Very Tasty</option>
                <option value="3">3 Stars - Good</option>
                <option value="2">2 Stars - Average</option>
                <option value="1">1 Star - Unsatisfactory</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Comment</label>
              <textarea
                rows="4"
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="What did you love about this cake flavor, decoration, or delivery?"
                className="w-full text-xs border border-gray-200 px-3 py-2 rounded-xl focus:border-primary bg-cream/50"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition-all"
            >
              {submittingReview ? 'Verifying & Posting...' : 'Post Verified Review'}
            </button>
            <p className="text-[10px] text-gray-400 leading-relaxed text-center">
              *Reviews are restricted strictly to customers who have ordered and received this item.
            </p>
          </form>
        </div>

        {/* Right: Reviews List grid */}
        <div className="lg:col-span-2 space-y-6 overflow-y-auto max-h-[500px] pr-2">
          {cake.reviews && cake.reviews.length === 0 ? (
            <div className="text-center py-16 space-y-2 border-2 border-dashed border-primary-light/50 rounded-2xl bg-cream/10">
              <ImageIcon className="text-gray-300 mx-auto" size={36} />
              <h4 className="font-bold text-sm text-charcoal">No customer feedback yet</h4>
              <p className="text-xs text-gray-400">Be the first verified customer to purchase and write a review.</p>
            </div>
          ) : (
            cake.reviews && cake.reviews.map((rev) => (
              <div key={rev.id} className="border-b border-primary-light/50 pb-6 last:border-none space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-sm text-charcoal">{rev.user?.name || 'Anonymous Guest'}</h5>
                    <span className="text-[10px] text-gray-400 font-semibold">{new Date(rev.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <RatingStars rating={rev.rating} size={12} />
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                
                {/* Review Images */}
                {rev.images && rev.images.length > 0 && (
                  <div className="flex gap-2">
                    {rev.images.map((img, i) => (
                      <a key={i} href={img} target="_blank" className="h-14 w-14 rounded-lg overflow-hidden border border-primary-light shrink-0">
                        <img src={img} alt="Client review upload" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>

      {/* 3. Related products drawer */}
      {related.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-2xl font-serif font-bold text-charcoal text-center">You might also love</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map((catCake) => (
              <div
                key={catCake.id}
                onClick={() => navigate(`/cake/${catCake.id}`)}
                className="bg-white p-4 rounded-2xl border border-primary-light shadow-premium-hover cursor-pointer group flex flex-col justify-between"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-cream">
                  <img
                    src={catCake.images && catCake.images[0] ? catCake.images[0].imageUrl : '/uploads/product-1.jpg'}
                    alt={catCake.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-charcoal group-hover:text-primary transition-colors line-clamp-1">
                    {catCake.name}
                  </h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-primary font-bold text-sm">₹{parseFloat(catCake.price).toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">{catCake.flavor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </motion.div>
  );
};

export default CakeDetails;
