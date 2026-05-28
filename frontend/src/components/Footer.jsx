import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Send } from 'lucide-react';
import { useToast } from '../components/ToastContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const toast = useToast();

  const handleSubscribe = (e) => {
    e.preventDefault();
    toast.success('Thank you for subscribing to Hommey Cakes newsletter! You will receive our sweet offers soon.');
  };

  return (
    <footer className="bg-charcoal text-gray-300 pt-16 pb-8 border-t-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          
          {/* Section 1: Working Hours */}
          <div>
            <h4 className="font-serif text-lg font-bold text-white mb-6 uppercase tracking-wider border-b border-primary/30 pb-2">
              Working Hours
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span>Monday - Friday:</span>
                <span className="text-primary font-bold">08:00 am – 08:30 pm</span>
              </li>
              <li className="flex justify-between">
                <span>Saturday:</span>
                <span className="text-primary font-bold">10:00 am – 04:30 pm</span>
              </li>
              <li className="flex justify-between">
                <span>Sunday:</span>
                <span className="text-primary font-bold">10:00 am – 04:30 pm</span>
              </li>
            </ul>

            <div className="mt-8">
              <h5 className="font-bold text-white text-sm mb-3">Bakery Suite</h5>
              <p className="text-xs leading-relaxed flex gap-2 items-start text-gray-400">
                <MapPin size={16} className="text-primary shrink-0" />
                <span>1000 Lakepoint Dr, Frisco, CO 80443, USA</span>
              </p>
            </div>
          </div>

          {/* Section 2: Logo & Story */}
          <div className="text-center flex flex-col items-center justify-center">
            <span className="font-serif text-3xl font-bold text-white mb-4">
              Hommey<span className="text-primary">Cakes</span>
            </span>
            <p className="text-sm leading-relaxed text-gray-400 max-w-sm mb-6">
              "Making your life sweeter one bite at a time!" Hommey Cakes is a premium boutique bakery baking happiness, custom cakes, and delicious cupcakes using premium fresh ingredients.
            </p>
            
            {/* Social Media Links */}
            <div className="flex gap-4">
              <a href="#" className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2.5 rounded-full transition-all duration-300">
                <Facebook size={18} />
              </a>
              <a href="#" className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2.5 rounded-full transition-all duration-300">
                <Twitter size={18} />
              </a>
              <a href="#" className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2.5 rounded-full transition-all duration-300">
                <Instagram size={18} />
              </a>
              <a href="#" className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2.5 rounded-full transition-all duration-300">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Section 3: Newsletter */}
          <div>
            <h4 className="font-serif text-lg font-bold text-white mb-6 uppercase tracking-wider border-b border-primary/30 pb-2">
              Subscribe
            </h4>
            <p className="text-sm leading-relaxed text-gray-400 mb-6">
              Subscribe to our monthly newsletter to get exclusive recipes, baking tips, and premium dessert discounts.
            </p>
            
            <form onSubmit={handleSubscribe} className="flex rounded-full overflow-hidden border border-gray-700 bg-charcoal-dark focus-within:border-primary transition-all">
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="bg-transparent px-4 py-3 text-sm flex-1 text-white border-none outline-none focus:ring-0"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white px-5 flex items-center justify-center transition-colors"
              >
                <Send size={16} />
              </button>
            </form>

            <div className="mt-8 space-y-2 text-xs text-gray-400">
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-primary" />
                <span>+1 800-786-1000</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-primary" />
                <span>Sweetcake@support.com</span>
              </p>
            </div>
          </div>

        </div>

        {/* Divider line */}
        <hr className="border-gray-800 mb-8" />

        {/* Bottom copyright bars */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>
            Copyright &copy; {currentYear} Hommey Cakes Shop. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms-conditions" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            <Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
