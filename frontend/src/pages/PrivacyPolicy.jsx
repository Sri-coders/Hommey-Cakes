import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-12 space-y-6 animate-fade-in"
    >
      <h1 className="text-3xl font-extrabold text-charcoal border-b border-primary-light pb-3">Privacy Policy</h1>
      <p className="text-xs text-gray-400">Effective Date: May 25, 2026</p>
      
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <p>
          Welcome to Hommey Cakes Shop. We respect your privacy and are committed to protecting the personal information you share with us when placing online cake orders or booking pastry classes.
        </p>

        <h3 className="font-serif font-bold text-lg text-charcoal pt-4">1. Personal Information We Collect</h3>
        <p>
          When you register on our website or place an order, we collect details necessary to fulfill your request:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Identity: Name, email address, contact phone, and account credentials.</li>
          <li>Delivery Coordinates: Shipping addresses and delivery time slot preferences.</li>
          <li>Transaction Logs: Details of orders placed and payment gateway references.</li>
        </ul>

        <h3 className="font-serif font-bold text-lg text-charcoal pt-4">2. How We Secure Your Data</h3>
        <p>
          Our application implements security measures to prevent unauthorized access or disclosure:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Passwords hashed securely inside MySQL database using bcrypt algorithm parameters.</li>
          <li>All REST API transactions are guarded by JSON Web Tokens (JWT).</li>
          <li>Online payments are processed through Razorpay's PCI-DSS compliant secure sandboxes.</li>
        </ul>

        <h3 className="font-serif font-bold text-lg text-charcoal pt-4">3. Contacting Our Privacy Officer</h3>
        <p>
          If you have questions regarding this Privacy Policy, please email us at <a href="mailto:sriannamalai2003@gmail.com" className="text-primary font-bold hover:underline">sriannamalai2003@gmail.com</a> or telephone <span className="text-primary font-bold">9345628924</span>.
        </p>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;
