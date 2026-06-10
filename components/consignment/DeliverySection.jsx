'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Truck } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export function DeliverySection({ formData, onChange, errors }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => setIsOpen(!isOpen);

  const statusOptions = [
    'Transit',
    'Reached Destination',
    'Out of Delivery',
    'Returned',
    'Holding at HUB',
    'Delivered',
  ];

  return (
    <div className="border border-fe-muted rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Section Header */}
      <button
        type="button"
        onClick={toggleSection}
        className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-fe-bg/30 transition-colors focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-fe-teal/10 text-fe-teal">
            <Truck className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-fe-dark font-heading">
              5. Delivery Info
            </h3>
            <p className="text-[10px] text-fe-gray font-sans">
              Shipment status updates, final delivered stamps
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-fe-gray" />
        </motion.div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-6 pt-2 border-t border-fe-muted/20 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white">
              {/* Delivery Status */}
              <Select
                label="Delivery Status"
                name="deliveryStatus"
                value={formData.deliveryStatus}
                onChange={onChange}
                options={statusOptions}
                error={errors.deliveryStatus}
                required
              />

              {/* Delivered Date */}
              <Input
                label="Delivered Date"
                name="deliveredDate"
                type="date"
                value={formData.deliveredDate}
                onChange={onChange}
                error={errors.deliveredDate}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
