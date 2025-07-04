
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Globe, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AudioPlayer({
  language,
  artifactCode,
  onLanguageChange,
  onBack,
  artifactData
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const audioRef = useRef(null);

  // Updated audio URL logic to support both local and external URLs
  const getAudioUrl = () => {
    // Check if artifact data has custom audio URLs
    if (artifactData?.audio_urls?.[language]) {
      return artifactData.audio_urls[language];
    }
    // Fall back to default structure
    return `/audio/${language}/${artifactCode}.mp3`;
  };

  const audioUrl = getAudioUrl();

  const languageNames = {
    en: 'English',
    vi: 'Tiếng Việt',
    zh: '中文'
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset states when URL changes
    setIsLoading(true);
    setAudioError(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false); // Stop playback when source changes
    setErrorMessage(''); // Added this line to reset error message

    // Load the new audio source
    audio.load();

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setAudioError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleError = (e) => { // Modified: added `e`
      console.log('Audio error:', e);
      console.log('Attempted URL:', audioUrl);
      setAudioError(true);
      setIsLoading(false);

      // More specific error messages
      if (audioUrl.includes('sharepoint.com') && !audioUrl.includes('?download=1')) {
        setErrorMessage('SharePoint links often require direct MP3 URLs. Please ensure it\'s a direct link or try appending "?download=1".');
      } else if (!audioUrl.endsWith('.mp3')) {
        setErrorMessage('The URL must point directly to an MP3 file (e.g., ending with .mp3).');
      } else {
        setErrorMessage(`Failed to load audio from: ${audioUrl}. It might be a network issue or an invalid file.`);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

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
  }, [audioUrl]); // Depend on audioUrl to re-run effect when URL changes

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const replay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full">
              <Globe className="w-4 h-4 text-amber-700" />
              <span className="text-amber-800 font-medium">
                {languageNames[language]}
              </span>
            </div>
          </div>

          {/* Artifact Info */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-8">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-slate-100 rounded-full">
                  <span className="text-slate-600 text-sm font-medium">
                    {artifactCode}
                  </span>
                </div>
                <h1 className="text-3xl font-light text-slate-900 mb-2">
                  {artifactData?.title?.[language] || `Artifact ${artifactCode}`}
                </h1>
                <p className="text-slate-600 leading-relaxed">
                  {artifactData?.description?.[language] || 'Discover the fascinating story behind this remarkable piece'}
                </p>
              </div>

              {/* Debug Info - Show current audio URL */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Debug Info:</p>
                <p className="text-xs text-gray-800 break-all">Audio URL: {audioUrl}</p>
                <p className="text-xs text-gray-600">Has custom URL: {artifactData?.audio_urls?.[language] ? 'Yes' : 'No'}</p>
              </div>

              {/* Audio Controls */}
              <div className="space-y-6">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onError={(e) => { // Updated as per outline for logging and immediate audioError state
                    console.log('Audio element onError prop triggered:', e);
                    setAudioError(true);
                  }}
                  preload="metadata" // Suggest to preload metadata only
                />

                <AnimatePresence>
                  {audioError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert className="border-amber-200 bg-amber-50">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          {errorMessage || `Audio file not available for this artifact in ${languageNames[language]}.
                          Please try a different language or contact museum staff.`}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!audioError && (
                  <>
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress
                        value={progressPercentage}
                        className="h-2 bg-slate-200"
                      />
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>{formatTime(currentTime)}</span>
                        <span>{duration ? formatTime(duration) : '--:--'}</span>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={replay}
                        disabled={isLoading}
                        className="w-14 h-14 rounded-full border-slate-200 hover:border-amber-400 hover:bg-amber-50"
                      >
                        <RotateCcw className="w-6 h-6" />
                      </Button>

                      <Button
                        size="lg"
                        onClick={togglePlayPause}
                        disabled={isLoading}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : isPlaying ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => onLanguageChange()}
                        className="w-14 h-14 rounded-full border-slate-200 hover:border-amber-400 hover:bg-amber-50"
                      >
                        <Globe className="w-6 h-6" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Language Options */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">
                Available Languages
              </h3>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(languageNames).map(([code, name]) => (
                  <Button
                    key={code}
                    variant={code === language ? "default" : "outline"}
                    onClick={() => onLanguageChange(code)}
                    className={code === language ?
                      "bg-amber-500 hover:bg-amber-600" :
                      "border-slate-200 hover:border-amber-400"
                    }
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
