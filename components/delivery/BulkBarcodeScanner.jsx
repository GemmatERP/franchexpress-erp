'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, AlertCircle, RefreshCw, Scan } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

/**
 * BulkBarcodeScanner
 * A persistent multi-scan wrapper that keeps the camera alive after each scan.
 * Unlike the existing BarcodeScannerModal (which auto-closes), this only stops
 * when the user clicks the X button.
 *
 * Props:
 *   isOpen    — boolean, whether the scanner overlay is visible
 *   onClose   — callback when user explicitly closes the scanner
 *   onScan    — callback(decodedText: string) fired on each successful scan
 */
export function BulkBarcodeScanner({ isOpen, onClose, onScan, isPaused = false }) {
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [lastScanned, setLastScanned] = useState('');
  const [scanCount, setScanCount]     = useState(0);
  const scannerRef                    = useRef(null);
  const SCANNER_ID                    = 'bulk-scanner-container';

  // Track pause state via Ref to avoid stale closure in html5Qrcode callback
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Debounce same-AWB re-scan within 2s
  const lastScanTimeRef = useRef(0);
  const lastScanTextRef = useRef('');

  const startScanner = useCallback(async () => {
    setError('');
    setLoading(true);

    const html5QrCode = new Html5Qrcode(SCANNER_ID, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,
    });
    scannerRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 15, aspectRatio: 1.333333 },
        (decodedText) => {
          if (isPausedRef.current) return;
          const now = Date.now();
          // Debounce: ignore if same barcode within 2.5s
          if (
            decodedText === lastScanTextRef.current &&
            now - lastScanTimeRef.current < 2500
          ) {
            return;
          }
          lastScanTextRef.current = decodedText;
          lastScanTimeRef.current = now;

          setLastScanned(decodedText);
          setScanCount((c) => c + 1);
          onScan(decodedText);
          // NOTE: We do NOT stop or close here — bulk mode keeps scanning
        },
        () => { /* Silence per-frame decode failures */ }
      );
      setLoading(false);
    } catch (err) {
      console.error('BulkBarcodeScanner start error:', err);
      setError('Camera permission denied or camera is not available. Please allow camera access in your browser settings.');
      setLoading(false);
    }
  }, [onScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.error('BulkBarcodeScanner stop error:', e);
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLastScanned('');
      setScanCount(0);
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-fe-dark/70 backdrop-blur-sm"
        />

        {/* Modal window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-fe-muted/20 flex flex-col font-sans z-10"
        >
          {/* Scanner laser keyframe */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes bulkScanLaser {
              0%   { top: 5%;  }
              50%  { top: 85%; }
              100% { top: 5%;  }
            }
            .bulk-scanner-laser {
              animation: bulkScanLaser 2s infinite linear;
              position: absolute;
            }
          `}} />

          {/* Header */}
          <div className="px-5 py-4 border-b border-fe-muted/10 flex justify-between items-center bg-gradient-to-r from-fe-teal/5 to-transparent">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-fe-teal/10 flex items-center justify-center">
                <Scan className="h-4 w-4 text-fe-teal" />
              </div>
              <div>
                <p className="text-xs font-bold text-fe-dark font-heading">Bulk AWB Scanner</p>
                <p className="text-[10px] text-fe-gray">Scanner stays active · scan continuously</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-red-50 text-fe-gray hover:text-red-600 transition-colors"
              title="Close scanner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Camera viewport */}
          <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center overflow-hidden">
            {/* html5-qrcode target */}
            <div id={SCANNER_ID} className="w-full h-full" />

            {/* Active scan overlay */}
            {!loading && !error && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="border-2 border-fe-teal/80 w-[290px] h-[100px] rounded-lg relative overflow-hidden bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  <div className="absolute left-0 w-full h-[2px] bg-red-500 shadow-[0_0_8px_#ef4444] bulk-scanner-laser" />
                </div>
                <p className="text-[10px] text-white/90 font-medium mt-3 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                  Align AWB barcode inside the frame
                </p>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-fe-dark/95 z-10 space-y-3">
                <RefreshCw className="h-6 w-6 text-fe-teal animate-spin" />
                <p className="text-xs text-white/80">Accessing camera...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-fe-dark/95 z-10 p-6 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="text-xs font-semibold text-white">Camera Access Error</p>
                <p className="text-[10px] text-white/60 leading-relaxed">{error}</p>
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 bg-fe-teal text-white text-[10px] font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Footer — live scan feedback */}
          <div className="p-4 bg-fe-bg/40 border-t border-fe-muted/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${!loading && !error ? 'bg-green-500 animate-pulse' : 'bg-fe-gray'}`} />
                <span className="text-[10px] text-fe-gray font-medium">
                  {loading ? 'Initialising...' : error ? 'Camera unavailable' : 'Live — scanning'}
                </span>
              </div>
              {scanCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-fe-teal bg-fe-teal/10 px-2 py-0.5 rounded-full">
                    {scanCount} scanned
                  </span>
                </div>
              )}
            </div>
            {lastScanned && (
              <div className="mt-2 px-3 py-1.5 bg-fe-teal/5 border border-fe-teal/20 rounded-lg">
                <p className="text-[9px] text-fe-gray">Last scanned:</p>
                <p className="text-xs font-bold text-fe-teal font-mono truncate">{lastScanned}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
