import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', description = '') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, description }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Helper methods to match standard toast libraries
  const toast = useCallback((message, type = 'info', description = '') => addToast(message, type, description), [addToast]);
  toast.success = useCallback((message, description = '') => addToast(message, 'success', description), [addToast]);
  toast.error = useCallback((message, description = '') => addToast(message, 'error', description), [addToast]);
  toast.warning = useCallback((message, description = '') => addToast(message, 'warning', description), [addToast]);
  toast.info = useCallback((message, description = '') => addToast(message, 'info', description), [addToast]);

  // Color & Icon mapping based on toast type
  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          borderColor: 'border-l-[#10B981]',
          icon: <CheckCircle className="text-[#10B981] shrink-0" size={20} />,
          progressBg: 'bg-[#10B981]',
        };
      case 'error':
        return {
          borderColor: 'border-l-[#EF4444]',
          icon: <XCircle className="text-[#EF4444] shrink-0" size={20} />,
          progressBg: 'bg-[#EF4444]',
        };
      case 'warning':
      case 'warn':
        return {
          borderColor: 'border-l-[#F59E0B]',
          icon: <AlertTriangle className="text-[#F59E0B] shrink-0" size={20} />,
          progressBg: 'bg-[#F59E0B]',
        };
      case 'info':
      default:
        return {
          borderColor: 'border-l-[#F05288]', // Premium Hommey Cakes Hot Pink
          icon: <Info className="text-[#F05288] shrink-0" size={20} />,
          progressBg: 'bg-[#F05288]',
        };
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Floating Container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const styles = getTypeStyles(t.type);
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className={`pointer-events-auto relative overflow-hidden bg-white border-l-4 ${styles.borderColor} shadow-premium rounded-r-2xl p-4 flex gap-3.5 items-start justify-between border border-primary-light/40`}
              >
                {/* Visual Icon */}
                {styles.icon}

                {/* Message Body */}
                <div className="flex-grow space-y-1">
                  <p className="text-sm font-semibold text-charcoal leading-snug">
                    {t.message}
                  </p>
                  {t.description && (
                    <p className="text-xs text-gray-500 leading-normal">
                      {t.description}
                    </p>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-gray-400 hover:text-charcoal transition-colors p-0.5 rounded-full hover:bg-gray-100/80"
                >
                  <X size={14} />
                </button>

                {/* Micro-animated countdown progress bar */}
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4.0, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-[3px] ${styles.progressBg}`}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
