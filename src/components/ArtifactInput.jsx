import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, ArrowRight, Home, QrCode as QrCodeIcon } from 'lucide-react'; // Đổi tên để tránh xung đột
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QrScanner from './QrScanner'; // Import component mới

export default function ArtifactInput({ selectedLanguage, onArtifactSubmit, onBackToHome }) {
  const [artifactCode, setArtifactCode] = useState('');
  const [error, setError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false); // State để điều khiển dialog

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!artifactCode.trim()) {
      setError('Please enter an artifact code');
      return;
    }
    setError('');
    onArtifactSubmit(artifactCode.trim().toUpperCase());
  };

  // Hàm được gọi khi quét QR thành công
  const handleScanSuccess = (decodedText, decodedResult) => {
    console.log(`Scan result: ${decodedText}`, decodedResult);
    setArtifactCode(decodedText);
    setIsScannerOpen(false); // Đóng dialog
    onArtifactSubmit(decodedText.trim().toUpperCase()); // Gửi mã đã quét
  };

  // Hàm được gọi khi có lỗi quét
  const handleScanError = (errorMessage) => {
    // Có thể bỏ qua hoặc log lỗi
    // console.error(errorMessage);
  };
  
  const languageNames = {
    // ... (giữ nguyên languageNames)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back to Home button */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBackToHome} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <Home className="w-4 h-4" />
            Home
          </Button>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-amber-800 font-medium">
              {languageNames[selectedLanguage]}
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-light text-slate-900 mb-4">
            Find Your Artifact
          </h1>
          <p className="text-slate-600 max-w-md mx-auto">
            Scan the QR code or enter the artifact code to begin your audio tour
          </p>
        </motion.div>

        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Artifact Code
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="text"
                      value={artifactCode}
                      onChange={(e) => setArtifactCode(e.target.value)}
                      placeholder="Enter code (e.g., A123)"
                      className="pl-10 h-12 text-lg border-slate-200 focus:border-amber-400 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <Alert variant="destructive" className="border-red-200">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Start Audio Guide
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-slate-500">
            <span className="text-sm">or</span>
          </div>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {/* Tích hợp Dialog và Scanner */}
              <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-12 border-slate-200 hover:border-amber-400 hover:bg-amber-50">
                    <QrCodeIcon className="w-5 h-5 mr-2" />
                    Scan QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Scan QR Code</DialogTitle>
                  </DialogHeader>
                  {/* Chỉ render QrScanner khi dialog được mở */}
                  {isScannerOpen && <QrScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}