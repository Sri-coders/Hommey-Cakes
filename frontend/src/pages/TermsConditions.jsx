import React from 'react';
import { motion } from 'framer-motion';

const TermsConditions = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-12 space-y-6 animate-fade-in"
    >
      <h1 className="text-3xl font-extrabold text-charcoal border-b border-primary-light pb-3">Terms & Conditions</h1>
      <p className="text-xs text-gray-400">Effective Date: May 25, 2026</p>
      
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <p>
          Welcome to Hommey Cakes Shop. By accessing our website, purchasing products, or enrolling in baking workshops, you agree to comply with the following Terms and Conditions.
        </p>

        <h3 className="font-serif font-bold text-lg text-charcoal pt-4">1. Online Orders & Preparation</h3>
        <p>
          Since every item is fresh-baked to order, baking begins upon purchase confirmation. All delivery orders must provide valid shipping coordinates and telephone numbers.
        </p>

        <h3 className="font-serif font-bold text-lg text-charcoal pt-4">2. Strict 5-Hour Cancellation Policy</h3>
        <p>
          To maintain bakery production standards:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Orders can be cancelled from the User Dashboard within 5 hours of purchase for a full refund.</li>
          <li>After 5 hours, prep work has progressed, and orders are locked. Cancellations will not be approved.</li>
        </ul>

        <h3 className="font-serif font-bold text-lg text-charcoal pt-4">3. Customer Accounts & Security</h3>
        <p>
          Customers are responsible for keeping account passwords confidential. We reserve the right to suspend or block accounts demonstrating suspicious behavior or violating terms.
        </p>
      </div>
    </motion.div>
  );
};

export default TermsConditions;
