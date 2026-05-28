import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      q: 'How far in advance do I need to order my cake?',
      a: 'Since we bake everything fresh to order, we require a minimum prep window of 4 hours for standard catalog cakes (like cupcakes, red velvet, and biscuits). For customized multi-tiered wedding cakes, we recommend booking at least 3 to 7 days in advance.'
    },
    {
      q: 'What is your cancellation and refund policy?',
      a: 'We enforce a strict 5-hour cancellation policy. You can cancel your order directly from your Customer Dashboard within 5 hours of placing it. After 5 hours, the ingredients are custom-allocated, and baking commences, so cancellations are no longer permitted. Refunded amounts for eligible cancellations are credited back in full.'
    },
    {
      q: 'Do you offer eggless and gluten-free options?',
      a: 'Yes! We are proud of our specialized dietary recipes. Standard menu cakes provide quick toggles for "100% Eggless" sponge cakes. We also offer Gluten-Free mini cupcakes and biscuit treats made with almond and coconut flours.'
    },
    {
      q: 'How do you handle delivery slots and packaging?',
      a: 'We deliver in three secure thermal-insulated slots: Morning (10 AM - 1 PM), Afternoon (1 PM - 4 PM), and Evening (4 PM - 7 PM). Cakes are boxed in sturdy eco-friendly packaging with dry-ice backups if requested, ensuring your frosting is pristine.'
    },
    {
      q: 'How do online payments work with Razorpay?',
      a: 'During checkout, choosing Razorpay opens a secure test sandbox checkout overlay supporting cards, UPI, or net-banking. We also provide cash-on-delivery (COD) for easy storefront pick-up and doorstep pay.'
    }
  ];

  const handleToggle = (idx) => {
    setActiveIndex(activeIndex === idx ? null : idx);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 animate-fade-in">
      <div className="text-center space-y-3">
        <HelpCircle className="text-primary mx-auto animate-bounce" size={48} />
        <h1 className="text-4xl font-extrabold text-charcoal">Frequently Asked Questions</h1>
        <p className="text-sm text-gray-500">Everything you need to know about our fresh baking schedules, refunds, and dietary choices.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = activeIndex === idx;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-primary-light overflow-hidden shadow-sm">
              <button
                onClick={() => handleToggle(idx)}
                className="w-full flex justify-between items-center p-6 text-left font-serif font-bold text-sm sm:text-md text-charcoal hover:text-primary transition-colors focus:outline-none"
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp className="text-primary" size={18} /> : <ChevronDown className="text-gray-400" size={18} />}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-primary-light/50 bg-cream/15"
                  >
                    <p className="p-6 text-xs sm:text-sm text-gray-500 leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQ;
