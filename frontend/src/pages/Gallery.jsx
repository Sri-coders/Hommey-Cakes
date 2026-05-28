import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Video as VideoIcon, Play, RefreshCw, Layers, X } from 'lucide-react';
import axios from 'axios';

const Gallery = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Image, Video
  const [activeMedia, setActiveMedia] = useState(null);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/gallery');
      if (res.data.success) {
        setMedia(res.data.media);
      }
    } catch (err) {
      console.error('Error loading gallery showcase:', err);
      // Fallback seeds matching standard images
      setMedia([
        { id: 1, mediaUrl: '/uploads/product-1.jpg', mediaType: 'Image', description: 'Freshly Baked Strawberry Cupcakes' },
        { id: 2, mediaUrl: '/uploads/product-2.jpg', mediaType: 'Image', description: 'Gourmet Cookies & Cream Celebration Cake' },
        { id: 3, mediaUrl: '/uploads/product-3.jpg', mediaType: 'Image', description: 'Gluten Free Assorted Fruit Mini Cupcakes' },
        { id: 4, mediaUrl: '/uploads/product-4.jpg', mediaType: 'Image', description: 'Decadent Fudge Cookie Dough Pastry' },
        { id: 5, mediaUrl: '/uploads/product-5.jpg', mediaType: 'Image', description: 'Vanilla Red Velvet Cream Cheese Swirl' },
        { id: 6, mediaUrl: '/uploads/product-6.jpg', mediaType: 'Image', description: 'Handcrafted Chocolate Glazed Sprinkled Donuts' },
        { id: 7, mediaUrl: '/uploads/media-1779798539972-951055709.mp4', mediaType: 'Video', description: 'Exquisite Decorating and Cake Frosting Showcase Reel' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const filteredMedia = media.filter(item => {
    if (filter === 'All') return true;
    return item.mediaType === filter;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10"
    >
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-charcoal font-serif">Bakery Showcase</h1>
        <p className="text-sm text-gray-500 max-w-lg mx-auto">
          Explore our multimedia gallery showcasing real cake orders, wedding setups, frosting processes, and sweet creations.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setFilter('All')}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${filter === 'All' ? 'bg-primary text-white border-primary shadow-premium' : 'bg-white border-primary-light text-charcoal hover:border-primary'}`}
        >
          <Layers size={14} /> Show All
        </button>
        <button
          onClick={() => setFilter('Image')}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${filter === 'Image' ? 'bg-primary text-white border-primary shadow-premium' : 'bg-white border-primary-light text-charcoal hover:border-primary'}`}
        >
          <ImageIcon size={14} /> Photos
        </button>
        <button
          onClick={() => setFilter('Video')}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${filter === 'Video' ? 'bg-primary text-white border-primary shadow-premium' : 'bg-white border-primary-light text-charcoal hover:border-primary'}`}
        >
          <VideoIcon size={14} /> Video Reels
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white/40 rounded-3xl border border-primary-light">
          <RefreshCw className="animate-spin text-primary mx-auto mb-4" size={32} />
          <p className="text-sm font-semibold text-gray-500">Arranging sweet showcase frames...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-primary-light shadow-sm">
          <ImageIcon className="text-gray-300 mx-auto mb-4" size={48} />
          <h3 className="font-serif font-bold text-xl text-charcoal">Showcase is empty</h3>
          <p className="text-sm text-gray-500">No media showcase assets have been added to this filter yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveMedia(item)}
              className="bg-white rounded-2xl overflow-hidden border border-primary-light shadow-premium-hover group flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-video overflow-hidden bg-cream shrink-0">
                {item.mediaType === 'Video' ? (
                  <div className="relative w-full h-full">
                    {/* Render a simple video element that loads on hover or can click */}
                    <video src={item.mediaUrl} className="w-full h-full object-cover" preload="metadata" />
                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 flex items-center justify-center transition-colors">
                      <span className="bg-primary text-white p-3 rounded-full shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <Play size={20} className="fill-white ml-0.5" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.mediaUrl}
                    alt={item.description}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>

              {item.description && (
                <div className="p-4 bg-white border-t border-primary-light/50">
                  <p className="text-xs font-semibold text-charcoal leading-relaxed line-clamp-2">{item.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Premium Media Lightbox Modal */}
      <AnimatePresence>
        {activeMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setActiveMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-primary-light/30 flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveMedia(null)}
                className="absolute top-4 right-4 z-10 bg-charcoal/80 text-white hover:bg-primary p-2.5 rounded-full transition-all duration-200 shadow-md hover:scale-110"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              {/* Media Container Pane */}
              <div className="bg-charcoal flex items-center justify-center aspect-video md:aspect-auto md:w-2/3 h-[40vh] md:h-[60vh] relative shrink-0">
                {activeMedia.mediaType === 'Video' ? (
                  <video
                    src={activeMedia.mediaUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={activeMedia.mediaUrl}
                    alt={activeMedia.description || 'Bakery creation'}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Information Pane */}
              <div className="p-8 md:w-1/3 flex flex-col justify-between bg-cream/35 border-t md:border-t-0 md:border-l border-primary-light/40 overflow-y-auto">
                <div className="space-y-5">
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    activeMedia.mediaType === 'Video'
                      ? 'bg-primary-light text-primary border border-primary/20'
                      : 'bg-accent-light/30 text-accent border border-accent/20'
                  }`}>
                    {activeMedia.mediaType === 'Video' ? <VideoIcon size={12} /> : <ImageIcon size={12} />}
                    {activeMedia.mediaType === 'Video' ? 'Video Reel' : 'Bakery Photo'}
                  </span>

                  <h3 className="font-serif font-bold text-2xl text-charcoal leading-tight">
                    {activeMedia.mediaType === 'Video' ? 'Interactive Demonstration' : 'Sweet Masterpiece'}
                  </h3>

                  <p className="text-sm text-charcoal/70 leading-relaxed font-sans">
                    {activeMedia.description || 'A stunning, handcrafted dessert creation designed and baked fresh daily by the master bakers at Hommey Cakes.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-primary-light/60 mt-8 md:mt-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans">
                    Hommey Cakes • Crafted with Love
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Gallery;
