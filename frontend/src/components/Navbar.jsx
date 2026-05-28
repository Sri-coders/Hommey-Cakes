import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Menu, X, ShoppingCart, Heart, User, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { logout } from '../store/authSlice';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalWishlistCount = wishlistItems.length;

  const handleLogout = () => {
    dispatch(logout());
    setDropdownOpen(false);
    navigate('/login');
  };

  const getAvatarUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    if (img.startsWith('/uploads/')) return img;
    return `/uploads/${img}`;
  };

  const activeStyle = ({ isActive }) =>
    isActive
      ? 'text-primary font-bold border-b-2 border-primary pb-1 transition-all'
      : 'text-charcoal hover:text-primary transition-all pb-1';

  return (
    <header className="sticky top-0 z-40">
      {/* Visual Header Bar with isolated backdrop-blur */}
      <div className="bg-white/90 backdrop-blur-md shadow-sm border-b border-primary-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-tight text-charcoal">
                Hommey<span className="text-primary">Cakes</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex gap-8 text-sm font-semibold uppercase tracking-wider">
              <NavLink to="/" className={activeStyle}>Home</NavLink>
              <NavLink to="/shop" className={activeStyle}>Shop</NavLink>
              <NavLink to="/gallery" className={activeStyle}>Gallery</NavLink>
              <NavLink to="/about" className={activeStyle}>About</NavLink>
              <NavLink to="/contact" className={activeStyle}>Contact</NavLink>
              <NavLink to="/faq" className={activeStyle}>FAQ</NavLink>
            </nav>

            {/* Right Action Icons */}
            <div className="hidden md:flex items-center gap-6">

              {/* Wishlist */}
              <Link to="/wishlist" className="relative text-charcoal hover:text-primary transition-all">
                <Heart size={22} />
                {totalWishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {totalWishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Cart */}
              <Link to="/cart" className="relative text-charcoal hover:text-primary transition-all">
                <ShoppingCart size={22} />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {totalCartCount}
                  </span>
                )}
              </Link>

              {/* Profile Dropdown */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 text-sm font-bold text-charcoal hover:text-primary focus:outline-none transition-all"
                  >
                    {user?.profile_image ? (
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-primary-light bg-cream flex items-center justify-center shrink-0">
                        <img
                          src={getAvatarUrl(user.profile_image)}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="max-w-[100px] truncate">{user?.name}</span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-xl border border-primary-light py-2 animate-fade-in z-50">
                      {user?.role === 'Admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-charcoal hover:bg-primary-light hover:text-primary font-semibold transition-all"
                        >
                          <LayoutDashboard size={16} />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-charcoal hover:bg-primary-light hover:text-primary font-semibold transition-all"
                      >
                        <Settings size={16} />
                        My Account
                      </Link>
                      <hr className="my-1 border-primary-light" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold text-left transition-all"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-primary hover:bg-primary-dark text-white text-xs uppercase tracking-wider font-bold px-5 py-2.5 rounded-full shadow-premium transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Drawer Trigger */}
            <div className="md:hidden flex items-center gap-4">
              {/* Wishlist */}
              <Link to="/wishlist" className="relative text-charcoal hover:text-primary transition-all">
                <Heart size={22} />
                {totalWishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {totalWishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Cart */}
              <Link to="/cart" className="relative text-charcoal hover:text-primary transition-all">
                <ShoppingCart size={22} />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalCartCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-charcoal hover:text-primary transition-all focus:outline-none"
              >
                {mobileOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-cream p-6 shadow-2xl flex flex-col justify-between rounded-l-3xl border-l border-primary-light"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex justify-between items-center mb-8">
                  <span className="font-serif text-xl font-bold text-charcoal">
                    Hommey<span className="text-primary">Menu</span>
                  </span>
                  <button onClick={() => setMobileOpen(false)} className="text-charcoal hover:text-primary">
                    <X size={24} />
                  </button>
                </div>

                <nav className="flex flex-col gap-4 text-md font-bold uppercase tracking-wider">
                  <NavLink to="/" onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'text-primary' : 'text-charcoal hover:text-primary transition-colors'}>Home</NavLink>
                  <NavLink to="/shop" onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'text-primary' : 'text-charcoal hover:text-primary transition-colors'}>Shop</NavLink>
                  <NavLink to="/gallery" onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'text-primary' : 'text-charcoal hover:text-primary transition-colors'}>Gallery</NavLink>
                  <NavLink to="/about" onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'text-primary' : 'text-charcoal hover:text-primary transition-colors'}>About</NavLink>
                  <NavLink to="/contact" onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'text-primary' : 'text-charcoal hover:text-primary transition-colors'}>Contact</NavLink>
                  <NavLink to="/faq" onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'text-primary' : 'text-charcoal hover:text-primary transition-colors'}>FAQ</NavLink>
                  <NavLink to="/wishlist" onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'text-primary' : 'text-charcoal hover:text-primary transition-colors'}>Wishlist ({totalWishlistCount})</NavLink>
                </nav>
              </div>

              <div className="border-t border-primary-light pt-6">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {user?.profile_image ? (
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-primary-light bg-cream flex items-center justify-center shrink-0">
                          <img
                            src={getAvatarUrl(user.profile_image)}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className="font-bold truncate">{user?.name}</span>
                    </div>
                    {user?.role === 'Admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm font-semibold text-charcoal hover:underline"
                    >
                      My Profile / Orders
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-2.5 rounded-full uppercase tracking-wider mt-2 transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full block text-center bg-primary hover:bg-primary-dark text-white font-bold text-sm py-2.5 rounded-full uppercase tracking-wider transition-all"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
