'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Copy, LogOut, X } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * UnsavedChangesModal
 * Shown when the user tries to navigate away from a dirty New Consignment form.
 */
export function UnsavedChangesModal({ isOpen, onClose, onCopyAndStay, onDiscard }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            aria-labelledby="unsaved-title"
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
              <div className="h-14 w-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-7 w-7 text-orange-500" />
              </div>
              <h3 id="unsaved-title" className="text-base font-bold text-fe-dark font-heading">
                Unsaved Changes
              </h3>
              <p className="text-xs text-fe-gray font-sans mt-2 leading-relaxed">
                You have unsaved changes on this form. Leaving now will lose all entered data.
              </p>
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 flex flex-col gap-2 mt-2">
              <Button
                variant="outline"
                onClick={onCopyAndStay}
                className="w-full flex items-center justify-center gap-2 border-fe-teal text-fe-teal hover:bg-fe-teal/5"
              >
                <Copy className="h-4 w-4" />
                Copy Form Data &amp; Stay
              </Button>
              <Button
                variant="ghost"
                onClick={onDiscard}
                className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Discard &amp; Leave
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full text-fe-gray"
              >
                Cancel — Stay on Page
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
