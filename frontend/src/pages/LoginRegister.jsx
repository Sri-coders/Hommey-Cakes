import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Phone, Eye, EyeOff, Sparkles, RefreshCw, KeyRound } from 'lucide-react';
import axios from 'axios';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { useToast } from '../components/ToastContext';

const LoginRegister = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('login'); // login, register, forgot
  const [showPassword, setShowPassword] = useState(false);

  // Sign In inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Password Recovery Wizard states
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP and New Password
  const [recoveryOTP, setRecoveryOTP] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      const res = await axios.post('/api/auth/login', {
        email: loginEmail,
        password: loginPassword
      });

      if (res.data.success) {
        dispatch(loginSuccess({
          token: res.data.token,
          user: res.data.user
        }));

        toast.success(`Welcome back, ${res.data.user.name}!`);
        if (res.data.user.role === 'Admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      dispatch(loginFailure(errorMsg));
      toast.error(errorMsg);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/register', {
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword
      });

      if (res.data.success) {
        toast.success('Registration successful! Please sign in with your new credentials.');
        setActiveTab('login');
        setLoginEmail(regEmail);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Email might already exist.');
    }
  };

  const handleRecoveryEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/forgot-password', { email: recoveryEmail });
      if (res.data.success) {
        toast.success('Recovery verification OTP has been generated in backend. Check terminal logs or mail inbox!');
        setRecoveryStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch recovery request.');
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/reset-password', {
        email: recoveryEmail,
        otp: recoveryOTP,
        password: recoveryNewPassword
      });

      if (res.data.success) {
        toast.success('Password has been successfully updated! Please sign in with your new credentials.');
        setActiveTab('login');
        setLoginEmail(recoveryEmail);
        setRecoveryStep(1);
        setRecoveryEmail('');
        setRecoveryOTP('');
        setRecoveryNewPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP code.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden" style={{ backgroundImage: "linear-gradient(rgba(253, 251, 247, 0.9), rgba(253, 251, 247, 0.85)), url('/uploads/img/instagram/instagram-4.jpg')", bgSize: 'cover' }}>

      {/* Dynamic forms panel */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-primary-light shadow-2xl space-y-6"
      >

        {/* Core Header */}
        <div className="text-center">
          <span className="font-serif text-2xl font-bold text-charcoal">
            Hommey<span className="text-primary">Cakes</span>
          </span>
          <p className="text-xs text-gray-500 mt-2">Baking sweet moments for your lovely life</p>
        </div>

        {/* Tab switchers (only if not in recovery wizard) */}
        {activeTab !== 'forgot' && (
          <div className="flex bg-cream rounded-xl p-1 border border-primary-light">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${activeTab === 'login' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-primary'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${activeTab === 'register' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-primary'}`}
            >
              Register
            </button>
          </div>
        )}

        {/* 1. Sign In Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="sriannamalai2003@gmail.com"
                    className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl pl-10"
                  />
                  <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase text-gray-400">Secure Password</label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl pl-10 pr-10"
                  />
                  <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-primary"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs py-3.5 rounded-xl shadow-premium flex items-center justify-center gap-1.5 transition-colors"
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Sign In Now'}
            </button>
          </form>
        )}

        {/* 2. Registration Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in">
            <div className="space-y-3">

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Sri Annamalai"
                    className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl pl-10"
                  />
                  <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl pl-10"
                  />
                  <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400">Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. 9345628924"
                    className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl pl-10"
                  />
                  <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl pl-10"
                  />
                  <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>

            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs py-3.5 rounded-xl shadow-premium transition-colors"
            >
              Create Account
            </button>
          </form>
        )}

        {/* 3. Password Recovery Form */}
        {activeTab === 'forgot' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-1">
              <KeyRound className="text-primary" size={18} />
              <h3 className="font-bold text-sm text-charcoal">Password Recovery</h3>
            </div>

            {recoveryStep === 1 ? (
              <form onSubmit={handleRecoveryEmailSubmit} className="space-y-4">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Enter your registered email address. We will generate a verification OTP in terminal and send it to retrieve your credentials.
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="sriannamalai2003@gmail.com"
                      className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl pl-10"
                    />
                    <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="flex-1 border border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-xs py-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-grow bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl shadow-premium transition-colors"
                  >
                    Generate OTP
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <p className="text-[11px] text-green-700 font-bold leading-relaxed bg-green-50 p-2.5 rounded-xl border border-green-200">
                  OTP successfully created! Enter the verification code and set your new password.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Verification OTP</label>
                    <input
                      type="text"
                      required
                      value={recoveryOTP}
                      onChange={(e) => setRecoveryOTP(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl font-bold tracking-widest text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">New Secure Password</label>
                    <input
                      type="password"
                      required
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full text-xs border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(1)}
                    className="flex-1 border border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-xs py-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-grow bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl shadow-premium transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default LoginRegister;
