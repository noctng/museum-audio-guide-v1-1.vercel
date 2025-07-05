import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode'; // Sử dụng lớp Html5Qrcode để kiểm soát tốt hơn

const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };
let html5QrCode;

export default function QrScanner({ onScanSuccess, onScanError }) {
  useEffect(() => {
    // Chỉ khởi tạo nếu chưa có
    if (!html5QrCode?.getState()) {
      html5QrCode = new Html5Qrcode('qr-reader-container');

      // Bắt đầu quét
      html5QrCode.start(
        { facingMode: 'environment' }, // Ưu tiên camera sau
        qrConfig,
        onScanSuccess,
        onScanError
      ).catch(err => {
        // Nếu không có camera sau, thử dùng camera trước
        console.log("Failed to start with environment camera, trying user camera.", err);
        html5QrCode.start(
          { facingMode: 'user' },
          qrConfig,
          onScanSuccess,
          onScanError
        ).catch(err2 => {
            console.error("Failed to start any camera.", err2);
            alert("Could not start camera. Please check permissions and refresh.");
        });
      });
    }

    // Hàm dọn dẹp để dừng camera khi component bị hủy
    return () => {
      if (html5QrCode?.isScanning) {
        html5QrCode.stop().then(() => {
          console.log("QR Code scanning stopped.");
        }).catch(err => {
          console.error("Failed to stop QR Code scanning.", err);
        });
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div id="qr-reader-container" style={{ width: '100%' }}></div>
  );
}