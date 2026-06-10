'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function Toast({
  message,
  type = 'success', // success, error, warning, info
  onClose,
}) {
  const styles = {
    success: {
      container: 'bg-[#EBFDF5] border-fe-green text-green-800',
      icon: <CheckCircle2 className="h-5 w-5 text-fe-green shrink-0" />,
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />,
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
    },
  };

  const currentStyle = styles[type] || styles.success;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`p-4 rounded-xl shadow-md border flex items-start gap-3 w-full max-w-sm pointer-events-auto ${currentStyle.container}`}
      role="status"
    >
      {currentStyle.icon}
      <div className="flex-1 text-sm font-medium pt-0.5 leading-tight">
        {message}
      </div>
      <button
        onClick={onClose}
        className="text-fe-gray hover:text-fe-dark p-0.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-fe-teal shrink-0"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
