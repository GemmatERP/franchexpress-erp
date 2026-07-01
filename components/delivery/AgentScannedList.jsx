'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trash2, Package, MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

/**
 * AgentScannedList
 * Renders the running list of scanned AWBs for the current session.
 * Each row shows consignment details, status, and action buttons.
 *
 * Props:
 *   items         — array of queue items
 *   onComplete    — callback(item) — marks an AWB as delivered
 *   onDelete      — callback(item) — removes AWB from the list
 *   onUndo        — callback(item) — reverts AWB back to pending
 *   actionLoading — id string of item currently being acted on
 */
export function AgentScannedList({ items, onComplete, onDelete, onUndo, actionLoading }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-fe-muted/20 flex items-center justify-center mb-4">
          <Package className="h-7 w-7 text-fe-gray/50" />
        </div>
        <p className="text-sm font-bold text-fe-dark font-heading">No AWBs in queue</p>
        <p className="text-xs text-fe-gray mt-1 max-w-xs">
          Click "Open Scanner" to start scanning AWB barcodes. They will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {items.map((item, index) => {
          const isCompleted = item.status === 'completed';
          const isLoading   = actionLoading === item.id;
          const isCarryFwd  = item.dayDate !== new Date().toISOString().slice(0, 10);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ duration: 0.22, delay: index * 0.03 }}
              className={`relative rounded-xl border transition-all ${
                isCompleted
                  ? 'bg-green-50/60 border-green-200/60'
                  : isCarryFwd
                  ? 'bg-amber-50/60 border-amber-200/60'
                  : 'bg-white border-fe-muted/30 hover:border-fe-muted/60 hover:shadow-sm'
              }`}
            >
              {/* Carry-forward badge */}
              {isCarryFwd && !isCompleted && (
                <div className="absolute -top-2 left-3 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" /> Carried forward from {item.dayDate}
                </div>
              )}

              <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* Text section: indicator dot and details */}
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  {/* Status indicator dot */}
                  <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                    isCompleted ? 'bg-green-500' : isCarryFwd ? 'bg-amber-500' : 'bg-fe-teal'
                  }`} />

                  {/* Main content info */}
                  <div className="flex-1 min-w-0">
                    {/* AWB row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono text-fe-dark tracking-wide">
                        {item.awbNumber}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Delivered
                        </span>
                      )}
                      {!isCompleted && !isCarryFwd && (
                        <span className="text-[10px] font-semibold text-fe-teal bg-fe-teal/10 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Consignee info */}
                    {item.consigneeName && (
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-fe-gray">
                          <Package className="h-3 w-3 shrink-0" />
                          {item.consigneeName}
                        </span>
                      </div>
                    )}

                    {/* Completion timestamp */}
                    {isCompleted && item.completedAt && (
                      <p className="text-[10px] text-green-600 mt-1">
                        Completed at {new Date(item.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                {!isCompleted && (
                  <div className="flex items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-fe-muted/10 sm:border-none shrink-0">
                    {isLoading ? (
                      <div className="h-8 w-8 flex items-center justify-center">
                        <Spinner size="sm" />
                      </div>
                    ) : (
                      <>
                        {/* Complete button */}
                        <button
                          onClick={() => onComplete(item)}
                          disabled={isLoading}
                          title="Mark as Delivered"
                          className="flex items-center justify-center gap-1.5 px-4 py-2 sm:px-3 sm:py-1.5 bg-fe-teal text-white text-xs sm:text-[11px] font-bold rounded-lg hover:bg-fe-teal/90 active:scale-95 transition-all shadow-sm shadow-fe-teal/20 disabled:opacity-50 min-h-[40px] sm:min-h-0"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Done
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => onDelete(item)}
                          disabled={isLoading}
                          title="Remove from list"
                          className="h-10 w-10 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg text-fe-gray hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 min-h-[40px] sm:min-h-0"
                        >
                          <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* ₹20 earned indicator & Undo button for completed */}
                {isCompleted && (
                  <div className="flex items-center justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-fe-muted/10 sm:border-none shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-green-700">+₹20</span>
                      <p className="text-[9px] text-green-500 font-medium">earned</p>
                    </div>
                    {isLoading ? (
                      <div className="h-8 w-8 flex items-center justify-center">
                        <Spinner size="sm" />
                      </div>
                    ) : (
                      <button
                        onClick={() => onUndo && onUndo(item)}
                        disabled={isLoading}
                        title="Undo delivery"
                        className="px-3.5 py-2 sm:px-2.5 sm:py-1.5 border border-fe-muted/30 hover:border-red-200 text-fe-gray hover:text-red-600 hover:bg-red-50 text-xs sm:text-[10px] font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 min-h-[40px] sm:min-h-0"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
