'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function Card({
  children,
  className = '',
  animate = false,
  delay = 0,
  hoverEffect = true,
  onClick,
  ...props
}) {
  const baseStyle = `bg-white p-6 rounded-xl border border-fe-muted/30 transition-all ${
    hoverEffect ? 'hover:shadow-md' : 'shadow-sm'
  } ${onClick ? 'cursor-pointer' : ''}`;

  if (animate) {
    const prefersReducedMotion = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    return (
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        onClick={onClick}
        className={`${baseStyle} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div onClick={onClick} className={`${baseStyle} ${className}`} {...props}>
      {children}
    </div>
  );
}
