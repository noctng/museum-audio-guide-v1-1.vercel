import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, ArrowRight, Home, QrCode as QrCodeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QrScanner from './QrScanner';

export default function ArtifactInput({ selectedLanguage, onArtifactSubmit, onBackToHome }) {
  const [artifactCode, setArtifactCode] = useState('');
  const [error, setError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!artifactCode.trim()) {
      setError('Please enter an artifact code');
      return;
    }
    setError('');
    onArtifactSubmit(artifactCode.trim().toUpperCase());
  };

  const handleScanSuccess = (decodedText, decodedResult) => {
    console.log(`Scan result: ${decodedText}`, decodedResult);
    setArtifactCode(decodedText);
    setIsScannerOpen(false);
    onArtifactSubmit(decodedText.trim().toUpperCase());
  };

  const handleScanError = (errorMessage) => {
    // console.error(errorMessage);
  };
  
  const languageNames = {
    en: 'English', vi: 'Tiếng Việt', zh: '中文', ru: 'Русский',
    ko: '한국어', ja: '日本語', fr: 'Français', de: 'Deutsch'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back to Home button */}
        <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={onBackToHome} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                <Home className="w-4 h-4" /> Home
            </Button>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full">
                <span className="text-amber-800 font-medium">
                    {languageNames[selectedLanguage] || 'English'}
                </span>
            </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-slate-900 mb-4">
            Find Your Artifact
          </h1>
          <p className="text-slate-600 max-w-md mx-auto">
            Scan the QR code or enter the artifact code to begin your audio tour
          </p>
        </motion.div>

        <div className="max-w-md mx-auto space-y-6">

          {/* === PHẦN QUÉT MÃ QR (ĐÃ DI CHUYỂN LÊN TRÊN) === */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
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
                  {isScannerOpen && <QrScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <div className="text-center text-slate-500">
            <span className="text-sm">or</span>
          </div>

          {/* === PHẦN NHẬP MÃ (ĐÃ DI CHUYỂN XUỐNG DƯỚI) === */}
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

        </div>
      </div>
    </div>
  );
}
