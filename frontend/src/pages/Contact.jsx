import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Send, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../components/ToastContext';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await axios.post('/api/contact', { name, email, subject, message });
      if (res.data.success) {
        toast.success(`Thank you, ${name}! Your contact message has been dispatched to our bakery admins. We will email you shortly.`);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch contact message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fade-in"
    >

      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-primary font-bold text-xs uppercase tracking-widest">Get In Touch</span>
        <h1 className="text-4xl font-extrabold text-charcoal">We are here to help you!</h1>
        <p className="text-sm text-gray-500">
          Have queries about custom cake decoration rules, delivery time slots, bulk event catering, or private pastry classes? Shoot us a message!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Card 1: Phone */}
        <div className="bg-white p-8 rounded-3xl border border-primary-light text-center space-y-3 shadow-sm hover:border-primary transition-all shadow-premium-hover">
          <div className="bg-primary-light text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
            <Phone size={20} />
          </div>
          <h4 className="font-bold text-sm text-charcoal uppercase">Telephone Call</h4>
          <p className="text-xs font-bold text-primary hover:underline">
            <a href="tel:9345628924">9345628924</a>
          </p>
          <span className="text-[10px] text-gray-400 block">Mon - Fri: 8am - 8pm</span>
        </div>

        {/* Card 2: Email */}
        <div className="bg-white p-8 rounded-3xl border border-primary-light text-center space-y-3 shadow-sm hover:border-primary transition-all shadow-premium-hover">
          <div className="bg-primary-light text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
            <Mail size={20} />
          </div>
          <h4 className="font-bold text-sm text-charcoal uppercase">Email Inbox</h4>
          <p className="text-xs font-bold text-primary hover:underline">
            <a href="mailto:sriannamalai2003@gmail.com">sriannamalai2003@gmail.com</a>
          </p>
          <span className="text-[10px] text-gray-400 block">We reply within 4 hours.</span>
        </div>

        {/* Card 3: Address */}
        <div className="bg-white p-8 rounded-3xl border border-primary-light text-center space-y-3 shadow-sm hover:border-primary transition-all shadow-premium-hover">
          <div className="bg-primary-light text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
            <MapPin size={20} />
          </div>
          <h4 className="font-bold text-sm text-charcoal uppercase">Bakery Location</h4>
          <p className="text-xs text-charcoal font-semibold">
            Gopalan Signature Mall, Old Madras Road, Bengaluru, Karnataka 560016
          </p>
          <span className="text-[10px] text-gray-400 block">Bespoke customized orders pick-up.</span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-6">

        {/* Contact Form */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-primary-light shadow-premium space-y-6">
          <h3 className="font-bold text-lg text-charcoal border-b border-primary-light pb-3">Send Us A Message</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl bg-cream/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl bg-cream/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-400">Subject Topic</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Customized Wedding Cake Query"
                className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl bg-cream/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-400">Message details</label>
              <textarea
                rows="4"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your cake details or class workshop reservation..."
                className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl bg-cream/50"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl shadow-premium flex items-center justify-center gap-1.5 transition-colors"
            >
              {sending ? 'Dispatching Message...' : 'Send Message Now'} <Send size={12} />
            </button>
          </form>
        </div>

        {/* Embedded Map Visual Panel */}
        <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white h-[450px] relative bg-cream flex items-center justify-center text-center p-6 border-primary-light">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.6975549019685!2d77.66121461530932!3d12.993770690841285!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae114b74a38753%3A0xc7d69b35b6b1587a!2sGopalan%20Signature%20Mall!5e0!3m2!1sen!2sin!4v1714589254823!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full"
          ></iframe>
        </div>

      </div>

    </motion.div>
  );
};

export default Contact;
