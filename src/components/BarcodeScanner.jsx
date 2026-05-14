import React, { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';

// Barcode scanner using html5-qrcode — works offline on Android Chrome
export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrCode = new Html5Qrcode('barcode-scanner-container');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' }, // use rear camera
          { fps: 10, qrbox: { width: 240, height: 120 } },
          (decodedText) => {
            // On successful scan — pass barcode back, stop camera
            onScan(decodedText);
            html5QrCode.stop().catch(() => {});
          },
          () => {} // ignore per-frame errors
        );
        setStarted(true);
      } catch (err) {
        setError('Camera access denied or not available. Please allow camera permission.');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
          <Camera size={16} color="var(--cyan)" /> Barcode / QR Scanner
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt2)' }} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {error ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--rose)', fontSize: '0.85rem', background: 'var(--rose-s)', borderRadius: 10 }}>
          {error}
        </div>
      ) : (
        <>
          <div id="barcode-scanner-container" />
          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--txt3)', marginTop: 10 }}>
            Point camera at a barcode or QR code. It will be matched to your product SKU automatically.
          </p>
        </>
      )}
    </div>
  );
}
