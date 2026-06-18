'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Eye, X } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * DuplicateAwbModal
 * Shown when the AWB number entered already exists in the database.
 */
export function DuplicateAwbModal({ isOpen, onClose, awbNumber, existingId, onViewExisting }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dup-awb-title"
            className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-fe-muted overflow-hidden z-10"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-fe-gray hover:text-fe-dark hover:bg-fe-bg transition-colors focus:outline-none focus:ring-2 focus:ring-fe-teal"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon header */}
            <div className="flex flex-col items-center px-8 pt-8 pb-4 text-center">
              <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
              </div>
              <h3 id="dup-awb-title" className="text-base font-bold text-fe-dark font-heading">
                AWB Already Exists
              </h3>
              <p className="text-xs text-fe-gray font-sans mt-2 leading-relaxed">
                AWB <span className="font-mono font-semibold text-fe-dark">#{awbNumber}</span> is already
                registered in the system. A duplicate entry cannot be created.
              </p>
              <p className="text-xs text-fe-gray font-sans mt-1.5">
                Would you like to open the existing consignment for editing?
              </p>
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 flex flex-col gap-2 mt-2">
              <Button
                variant="primary"
                onClick={onViewExisting}
                className="w-full flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View &amp; Edit Existing
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full text-fe-gray"
              >
                Cancel — Enter Different AWB
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
