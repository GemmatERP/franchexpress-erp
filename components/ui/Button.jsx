'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Button({
  children,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, danger, ghost
  size = 'md', // sm, md, lg
  loading = false,
  disabled = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
    
    const listener = (e) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const baseStyles = 'inline-flex items-center justify-center font-heading font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-fe-teal focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: 'bg-fe-teal text-white hover:bg-[#4fb598] active:bg-[#3ea084] shadow-sm',
    secondary: 'bg-fe-muted text-fe-dark hover:bg-fe-softgreen active:bg-[#a6bca9] shadow-sm',
    outline: 'border border-fe-teal text-fe-teal hover:bg-fe-teal/10 active:bg-fe-teal/20',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm focus:ring-red-500',
    ghost: 'text-fe-dark hover:bg-fe-muted active:bg-[#cbcfc2]',
  };

  const animationProps = reduceMotion
    ? {}
    : {
        whileHover: { scale: 1.01, y: -1 },
        whileTap: { scale: 0.99 },
      };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...animationProps}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
            role="img"
            aria-label="Loading"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
