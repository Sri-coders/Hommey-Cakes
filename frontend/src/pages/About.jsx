import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Heart, ShieldCheck } from 'lucide-react';

const About = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16"
    >
      
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-primary font-bold text-xs uppercase tracking-widest">Our Bakery Story</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-charcoal leading-tight">Baking Happiness Since 2016</h1>
        <p className="text-sm sm:text-md text-gray-500 leading-relaxed">
          Hommey Cakes Shop started as a small boutique oven in Frisco, Colorado. Over the years, our dedication to premium fresh ingredients, customized designs, and sweet tastes has turned us into an award-winning bakery.
        </p>
      </section>

      {/* Grid: Details story */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-primary-light">
          <img src="/uploads/img/about.jpg" alt="Hommey Bakery baking ovens" className="w-full h-full object-cover" />
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-serif font-bold text-charcoal">Making your life sweeter one bite at a time!</h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Our master pastry chefs handcraft every single cake with love and precision. We believe that a cake is not just a dessert—it is the centerpiece of your life's most memorable celebrations. Whether it is a beautiful multi-tiered wedding cake or a quick box of custom velvet cupcakes for a birthday, we guarantee premium flavor and perfection.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-2.5 items-start bg-white p-4 rounded-xl border border-primary-light shadow-sm">
              <Trophy className="text-primary shrink-0" size={20} />
              <div>
                <h5 className="font-bold text-xs text-charcoal">Award Winning</h5>
                <p className="text-[10px] text-gray-400">Best gourmet cake shop.</p>
              </div>
            </div>
            <div className="flex gap-2.5 items-start bg-white p-4 rounded-xl border border-primary-light shadow-sm">
              <Heart className="text-primary shrink-0" size={20} />
              <div>
                <h5 className="font-bold text-xs text-charcoal">100% Love</h5>
                <p className="text-[10px] text-gray-400">Baked fresh upon request.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team grid from original Colorlib template */}
      <section className="space-y-8">
        <div className="text-center">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Master Pastry Chefs</span>
          <h2 className="text-3xl font-bold mt-2">Meet Our Bakers</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="bg-white rounded-2xl overflow-hidden border border-primary-light shadow-sm text-center p-6 space-y-4 shadow-premium-hover">
            <div className="h-48 w-48 rounded-full overflow-hidden mx-auto bg-primary-light border-4 border-primary-light/50">
              <img src="/uploads/img/team/team-1.jpg" alt="Randy Butler" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-md text-charcoal">Randy Butler</h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Master Decorator</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-primary-light shadow-sm text-center p-6 space-y-4 shadow-premium-hover">
            <div className="h-48 w-48 rounded-full overflow-hidden mx-auto bg-primary-light border-4 border-primary-light/50">
              <img src="/uploads/img/team/team-2.jpg" alt="Sandra Butler" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-md text-charcoal">Sandra Butler</h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Pastry Chef</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-primary-light shadow-sm text-center p-6 space-y-4 shadow-premium-hover">
            <div className="h-48 w-48 rounded-full overflow-hidden mx-auto bg-primary-light border-4 border-primary-light/50">
              <img src="/uploads/img/team/team-3.jpg" alt="Albert Gibson" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-md text-charcoal">Albert Gibson</h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Biscuit Specialist</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-primary-light shadow-sm text-center p-6 space-y-4 shadow-premium-hover">
            <div className="h-48 w-48 rounded-full overflow-hidden mx-auto bg-primary-light border-4 border-primary-light/50">
              <img src="/uploads/img/team/team-4.jpg" alt="Ruby Wild" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-md text-charcoal">Ruby Wild</h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Sponge Master</span>
            </div>
          </div>

        </div>
      </section>

    </motion.div>
  );
};

export default About;
