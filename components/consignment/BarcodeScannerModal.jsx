'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, AlertCircle, RefreshCw } from 'lucide-react';

import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export function BarcodeScannerModal({ isOpen, onClose, onScan }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [scannerInstance, setScannerInstance] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setLoading(true);

    const html5QrCode = new Html5Qrcode('scanner-container-element', {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE
      ],
      verbose: false
    });
    setScannerInstance(html5QrCode);

    html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 15,
        aspectRatio: 1.333333,
      },
      (decodedText) => {
        onScan(decodedText);
        // Auto close after scanner succeeds
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            html5QrCode.clear();
            onClose();
          }).catch(() => onClose());
        } else {
          onClose();
        }
      },
      () => {
        // Silence noise from failed frame scan attempts
      }
    )
    .then(() => {
      setLoading(false);
    })
    .catch((err) => {
      console.error('Camera start failure:', err);
      setError('Camera permission denied or camera is not available. Please allow camera access in browser permissions.');
      setLoading(false);
    });

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop()
          .then(() => {
            html5QrCode.clear();
          })
          .catch((err) => console.error('Error stopping scanner:', err));
      }
    };
  }, [isOpen, onScan, onClose]);

  const handleClose = () => {
    if (scannerInstance && scannerInstance.isScanning) {
      scannerInstance.stop()
        .then(() => {
          scannerInstance.clear();
          onClose();
        })
        .catch((err) => {
          console.error('Error stopping scanner on close:', err);
          onClose();
        });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-fe-dark/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-fe-muted/20 flex flex-col font-sans"
        >
          {/* Style Injector for Laser line */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes scanLaser {
              0% { top: 0px; }
              50% { top: 100px; }
              100% { top: 0px; }
            }
            .animate-scanner-laser {
              animation: scanLaser 2.2s infinite linear;
              position: absolute;
            }
          `}} />

          {/* Header */}
          <div className="px-5 py-4 border-b border-fe-muted/10 flex justify-between items-center bg-fe-bg/40">
            <div className="flex items-center gap-2 text-fe-teal">
              <Camera className="h-4.5 w-4.5" />
              <span className="text-xs font-bold font-heading text-fe-dark">
                Scan AWB Barcode
              </span>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-fe-muted/30 text-fe-gray hover:text-fe-dark transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Camera Frame View */}
          <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center overflow-hidden">
            {/* Target element for html5-qrcode */}
            <div id="scanner-container-element" className="w-full h-full object-cover" />

            {/* Target Overlay Laser and border */}
            {!loading && !error && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Horizontal target frame */}
                <div className="border-2 border-fe-teal/80 w-[300px] h-[100px] rounded-lg relative overflow-hidden bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  {/* Scanner Red line laser */}
                  <div className="absolute left-0 w-full h-[2px] bg-red-500 shadow-[0_0_8px_#ef4444] animate-scanner-laser" />
                </div>
                <p className="text-[10px] text-white/95 font-medium tracking-wide mt-3 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  Align AWB barcode inside the frame
                </p>
              </div>
            )}

            {/* Camera loading state */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-fe-dark/95 z-10 space-y-3">
                <RefreshCw className="h-6 w-6 text-fe-teal animate-spin" />
                <p className="text-xs text-white/80">Accessing device camera...</p>
              </div>
            )}

            {/* Camera access/initialization error state */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-fe-dark/95 z-10 p-6 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="text-xs font-semibold text-white">Camera Access Error</p>
                <p className="text-[10px] text-white/60 leading-relaxed max-w-xs">{error}</p>
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 bg-fe-teal hover:bg-fe-teal-hover text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="p-4 bg-fe-bg/40 border-t border-fe-muted/10 text-center">
            <p className="text-[9px] text-fe-gray font-medium">
              Supports: CODE-128, CODE-39, EAN-13, EAN-8, QR Code
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
