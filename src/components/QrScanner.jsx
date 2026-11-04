import React from 'react';
import { Html5Qrcode } from 'html5-qrcode';

// Cấu hình cho trình quét QR
const qrConfig = { 
  fps: 10, 
  qrbox: { width: 250, height: 250 },
  // Thêm experimentalFeatures để cải thiện hiệu suất trên một số thiết bị
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: true,
  },
};

export default function QrScanner({ onScanSuccess, onScanError }) {
  // Sử dụng React.useEffect để quản lý vòng đời của trình quét
  React.useEffect(() => {
    // Khởi tạo một đối tượng quét mới mỗi khi component được render
    const html5QrCode = new Html5Qrcode('qr-reader-container');
    let isScanning = true;

    // Hàm xử lý khi quét thành công
    const handleSuccess = (decodedText, decodedResult) => {
      if (isScanning) {
        isScanning = false; // Ngăn việc gọi onScanSuccess nhiều lần
        onScanSuccess(decodedText, decodedResult);
      }
    };

    // Bắt đầu quá trình quét
    html5QrCode.start(
      { facingMode: 'environment' }, // Ưu tiên camera sau
      qrConfig,
      handleSuccess,
      onScanError
    ).catch((err) => {
      // Nếu không tìm thấy camera sau, thử lại với camera trước
      console.warn("Không thể khởi động camera sau, thử camera trước.", err);
      html5QrCode.start(
        { facingMode: 'user' },
        qrConfig,
        handleSuccess,
        onScanError
      ).catch((err2) => {
        console.error("Không thể khởi động bất kỳ camera nào.", err2);
        if (onScanError) {
          onScanError("Không thể khởi động camera. Vui lòng kiểm tra quyền truy cập và tải lại trang.");
        }
      });
    });

    // Hàm dọn dẹp (Cleanup Function) - RẤT QUAN TRỌNG
    // Hàm này sẽ được gọi khi component bị gỡ bỏ (unmount), ví dụ như khi đóng Dialog.
    return () => {
      // Kiểm tra xem trình quét có đang chạy không trước khi dừng
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop()
          .then(() => console.log("Đã dừng quét QR."))
          .catch((err) => console.error("Dừng quét QR thất bại.", err));
      }
    };
  }, [onScanSuccess, onScanError]); // Dependencies của useEffect

  // Container để thư viện hiển thị camera
  return (
    <div id="qr-reader-container" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}></div>
  );
}
