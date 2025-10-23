// src/components/AudioPlayer.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, ArrowLeft, AlertCircle, Home, QrCode as QrCodeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QrScanner from './QrScanner';

// ================================================================
// Component Con 1: Header (Phần tĩnh)
// React.memo sẽ ngăn component này re-render không cần thiết.
// ================================================================
const PlayerHeader = React.memo(({ language, onBackToHome, onBack, onArtifactSubmit }) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScanSuccess = useCallback((decodedText) => {
    setIsScannerOpen(false);
    onArtifactSubmit(decodedText);
  }, [onArtifactSubmit]);

  const handleScanError = useCallback((errorMessage) => {
    console.warn("QR Scan error:", errorMessage);
  }, []);

  const languageNames = { en: 'English', vi: 'Tiếng Việt', zh: '中文', ru: 'Русский', ko: '한국어', ja: '日本語', fr: 'Français', de: 'Deutsch' };

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBackToHome}><Home className="w-4 h-4 mr-2" /> Home</Button>
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <Button as="button" variant="ghost" onClick={() => setIsScannerOpen(true)}>
            <QrCodeIcon className="w-4 h-4 mr-2" /> Scan QR
          </Button>
          <DialogContent>
            <DialogHeader><DialogTitle>Scan Artifact QR Code</DialogTitle></DialogHeader>
            {isScannerOpen && <QrScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />}
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full">
        <span className="text-amber-800 font-medium">{languageNames[language]}</span>
      </div>
    </div>
  );
});

// ================================================================
// Component Con 2: Lựa chọn ngôn ngữ (Phần tĩnh)
// ================================================================
const LanguageOptions = React.memo(({ currentLanguage, onLanguageChange }) => {
  const languageNames = { en: 'English', vi: 'Tiếng Việt', zh: '中文', ru: 'Русский', ko: '한국어', ja: '日本語', fr: 'Français', de: 'Deutsch' };
  
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Available Languages</h3>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(languageNames).map(([code, name]) => (
            <Button
              key={code}
              variant={code === currentLanguage ? "default" : "outline"}
              onClick={() => onLanguageChange(code)}
              className={code === currentLanguage ? "bg-amber-500 hover:bg-amber-600" : "border-slate-200 hover:border-amber-400"}
            >
              {name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});


// ================================================================
// Component Chính: AudioPlayer (Component cha)
// Nhiệm vụ chính là quản lý state và "lắp ráp" các component con.
// ================================================================
export default function AudioPlayer({
  language,
  artifactCode,
  onLanguageChange,
  onBack,
  artifactData,
  onBackToHome,
  onArtifactSubmit,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef(null);

  const audioUrl = artifactData?.audio_urls?.[language] || null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsLoading(true);
    setAudioError(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    
    audio.src = audioUrl;
    if (audioUrl) audio.load();
    else { setAudioError(true); setIsLoading(false); }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration); setIsLoading(false); setAudioError(false);
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleError = () => { setAudioError(true); setIsLoading(false); };
    const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioError) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(prev => !prev);
  }, [isPlaying, audioError]);

  const replay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioError) return;
    audio.currentTime = 0;
    if (!isPlaying) audio.play().then(() => setIsPlaying(true));
  }, [isPlaying, audioError]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          
          <PlayerHeader
            language={language}
            onBackToHome={onBackToHome}
            onBack={onBack}
            onArtifactSubmit={onArtifactSubmit}
          />

          {artifactData?.image_url && (
            <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <img src={artifactData.image_url} alt={artifactData.title?.[language] || `Artifact ${artifactCode}`} className="mx-auto block max-w-full h-auto rounded-lg shadow-md" style={{ maxHeight: '500px', objectFit: 'contain' }} />
            </motion.div>
          )}

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-8">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <span className="inline-block mb-4 px-3 py-1 bg-slate-100 rounded-full text-slate-600 text-sm font-medium">{artifactCode}</span>
                <h1 className="text-3xl font-light text-slate-900 mb-2">{artifactData?.title?.[language] || `Artifact ${artifactCode}`}</h1>
                <p className="text-slate-600 leading-relaxed">{artifactData?.description?.[language] || 'Discover the fascinating story...'}</p>
              </div>

              {/* PHẦN PLAYER NÀY LÀ NƠI DUY NHẤT BỊ RE-RENDER LIÊN TỤC, VÀ ĐIỀU NÀY LÀ ĐÚNG */}
              <div className="space-y-6">
                <audio ref={audioRef} />
                <AnimatePresence>
                  {audioError && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Alert variant="destructive"><AlertCircle className="w-4 h-4" /><AlertDescription>Audio not available for this language.</AlertDescription></Alert></motion.div>}
                </AnimatePresence>
                {!audioError && (
                  <>
                    <div className="space-y-2">
                      <Progress value={progressPercentage} className="h-2 bg-slate-200" />
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>{formatTime(currentTime)}</span>
                        <span>{duration ? formatTime(duration) : '--:--'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <Button variant="outline" size="lg" onClick={replay} disabled={isLoading} className="w-14 h-14 rounded-full"><RotateCcw className="w-6 h-6" /></Button>
                      <Button size="lg" onClick={togglePlayPause} disabled={isLoading} className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600">
                        {isLoading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-white border-t-transparent rounded-full" /> : isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
                      </Button>
                      <Button variant="outline" size="lg" disabled className="w-14 h-14 rounded-full opacity-0 cursor-default" />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          <LanguageOptions
            currentLanguage={language}
            onLanguageChange={onLanguageChange}
          />
        </motion.div>
      </div>
    </div>
  );
}
