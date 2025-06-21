import React from 'react';
import {QRCode} from 'qrcode.react';

export default function TestQRCode() {
  const value = "yappy://pay?recipient=67890123&amount=100.00";

  return (
    <div style={{ padding: 20 }}>
      <h1>Prueba QR Code</h1>
      <QRCode value={value} size={200} />
    </div>
  );
}
