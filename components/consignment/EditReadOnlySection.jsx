'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, UserCheck, UserPlus, Phone, MapPin } from 'lucide-react';

/**
 * EditReadOnlySection
 *
 * Renders consignor or consignee details as read-only display text.
 * Used in the Edit Consignment page where these fields cannot be changed.
 *
 * Props:
 * - type: 'consignor' | 'consignee'
 * - data: the consignment object
 * - sectionNumber: number for the section heading
 */
export function EditReadOnlySection({ type, data, sectionNumber }) {
  const [isOpen, setIsOpen] = useState(false);

  const isConsignor = type === 'consignor';
  const Icon = isConsignor ? UserCheck : UserPlus;
  const title = isConsignor ? 'Consignor Details (Sender)' : 'Consignee Details (Recipient)';
  const note = isConsignor
    ? 'Sender info is locked after booking. Contact support to correct errors.'
    : 'Recipient info is locked after booking. Contact support to correct errors.';

  const prefix = isConsignor ? 'consignor' : 'consignee';

  const fields = [
    { label: 'Phone', value: data[`${prefix}Phone`] },
    { label: 'Name', value: data[`${prefix}Name`] },
    { label: 'Address Line 1', value: data[`${prefix}Address1`] },
    { label: 'Address Line 2', value: data[`${prefix}Address2`] },
    { label: 'Address Line 3', value: data[`${prefix}Address3`] },
    { label: 'City', value: data[`${prefix}City`] },
    { label: 'Pincode', value: data[`${prefix}Pincode`] },
    { label: 'State', value: data[`${prefix}State`] },
    { label: 'Country', value: data[`${prefix}Country`] || 'India' },
  ].filter((f) => f.value);

  return (
    <div className="border border-fe-muted rounded-xl bg-white overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-fe-bg/30 transition-colors focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-fe-muted/40 text-fe-gray">
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-fe-dark font-heading">
                {sectionNumber}. {title}
              </h3>
              <span className="text-[9px] font-bold bg-fe-muted/40 text-fe-gray px-2 py-0.5 rounded-full uppercase tracking-wider">
                Read Only
              </span>
            </div>
            <p className="text-[10px] text-fe-gray font-sans mt-0.5">{note}</p>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-fe-gray" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-6 pt-4 border-t border-fe-muted/20 bg-fe-bg/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {fields.map((f) => (
                  <div key={f.label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider">{f.label}</span>
                    <p className={`text-sm font-medium text-fe-dark ${f.label === 'Phone' ? 'font-mono text-fe-teal' : ''}`}>
                      {f.value || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
