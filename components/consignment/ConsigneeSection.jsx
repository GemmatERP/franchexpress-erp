'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, UserPlus } from 'lucide-react';
import { Input } from '../ui/Input';

export function ConsigneeSection({ formData, onChange, errors }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => setIsOpen(!isOpen);

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
            <UserPlus className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-fe-dark font-heading">
              4. Consignee Details (Recipient)
            </h3>
            <p className="text-[10px] text-fe-gray font-sans">
              Recipient name, contact, destination city and address
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
              {/* Phone */}
              <Input
                label="Recipient Phone"
                name="consigneePhone"
                placeholder="10-digit mobile number"
                value={formData.consigneePhone}
                onChange={onChange}
                error={errors.consigneePhone}
                required
              />

              {/* Name */}
              <Input
                label="Recipient Name"
                name="consigneeName"
                placeholder="Recipient's full name"
                value={formData.consigneeName}
                onChange={onChange}
                error={errors.consigneeName}
                required
              />

              {/* Address 1 */}
              <div className="md:col-span-2">
                <Input
                  label="Address Line 1"
                  name="consigneeAddress1"
                  placeholder="Door No, building name, street"
                  value={formData.consigneeAddress1}
                  onChange={onChange}
                  error={errors.consigneeAddress1}
                  required
                />
              </div>

              {/* Address 2 */}
              <Input
                label="Address Line 2 (Optional)"
                name="consigneeAddress2"
                placeholder="Locality, landmark"
                value={formData.consigneeAddress2}
                onChange={onChange}
                error={errors.consigneeAddress2}
              />

              {/* Address 3 */}
              <Input
                label="Address Line 3 (Optional)"
                name="consigneeAddress3"
                placeholder="Area name"
                value={formData.consigneeAddress3}
                onChange={onChange}
                error={errors.consigneeAddress3}
              />

              {/* City */}
              <Input
                label="City / Town"
                name="consigneeCity"
                placeholder="Enter city"
                value={formData.consigneeCity}
                onChange={onChange}
                error={errors.consigneeCity}
                required
              />

              {/* Pincode */}
              <Input
                label="Pincode"
                name="consigneePincode"
                placeholder="6-digit PIN code"
                value={formData.consigneePincode}
                onChange={onChange}
                error={errors.consigneePincode}
                required
              />

              {/* State */}
              <Input
                label="State"
                name="consigneeState"
                placeholder="Recipient state (e.g. Tamil Nadu)"
                value={formData.consigneeState}
                onChange={onChange}
                error={errors.consigneeState}
                required
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
