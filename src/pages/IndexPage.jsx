import React, { useState, useEffect, useRef } from 'react';
import LanguageSelector from '@/components/LanguageSelector';
import ArtifactInput from '@/components/ArtifactInput';
import AudioPlayer from '@/components/AudioPlayer';
import { supabase } from '@/lib/supabaseClient'; // Import supabase client
import { recordPageVisit, pingSession, removeSession, HEARTBEAT_MS } from '@/lib/tracking';

export default function IndexPage() {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [artifactCode, setArtifactCode] = useState(null);
  const [artifactData, setArtifactData] = useState(null); // Add state for data

  // Mỗi phiên truy cập 1 ID duy nhất (dùng chung giữa các màn hình)
  const sessionIdRef = useRef(crypto.randomUUID());
  const countedScreensRef = useRef(new Set());

  // Màn hình hiện tại của người dùng: home -> artifact_input -> artifact_player
  const screen = !selectedLanguage
    ? 'home'
    : (!artifactCode ? 'artifact_input' : 'artifact_player');

  // 📊 Ghi nhận 1 lượt truy cập mỗi khi chuyển màn hình
  useEffect(() => {
    if (countedScreensRef.current.has(screen)) return;
    countedScreensRef.current.add(screen);
    recordPageVisit(screen);
  }, [screen]);

  // 🟢 Đăng ký session "đang online" + heartbeat theo màn hình hiện tại
  useEffect(() => {
    const sid = sessionIdRef.current;

    const ping = () => pingSession(sid, screen);
    const clean = () => removeSession(sid);

    ping(); // đăng ký ngay khi vào màn hình
    const timer = setInterval(ping, HEARTBEAT_MS); // bắt nhịp định kỳ
    window.addEventListener('beforeunload', clean); // khi đóng tab

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', clean);
      clean(); // khi chuyển màn hình hoặc unmount
    };
  }, [screen]);

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
  };

  // Updated function to fetch from Supabase
  const handleArtifactSubmit = async (code) => {
    const { data, error } = await supabase
      .from('AudioGuide')
      .select('*')
      .eq('artifact_code', code.toUpperCase())
      .single(); // .single() gets one record

    if (error || !data) {
      alert(`Artifact with code "${code}" not found.`);
      setArtifactData(null);
    } else {
      setArtifactData(data);
      setArtifactCode(code.toUpperCase());
    }
  };

  const handleBack = () => {
    setArtifactCode(null);
    setArtifactData(null);
  };

  const handleLanguageChange = (newLangCode) => {
    if (newLangCode) {
      setSelectedLanguage(newLangCode);
    }
  };

  const handleBackToHome = () => {
    setSelectedLanguage(null);
    setArtifactCode(null);
    setArtifactData(null);
  }

  if (!selectedLanguage) {
    return <LanguageSelector onLanguageSelect={handleLanguageSelect} />;
  }

  if (!artifactCode) {
    return (
        <ArtifactInput
            selectedLanguage={selectedLanguage}
            onArtifactSubmit={handleArtifactSubmit}
            onBackToHome={handleBackToHome}
        />
    );
  }

  return (
    <AudioPlayer
      language={selectedLanguage}
      artifactCode={artifactCode}
      onLanguageChange={handleLanguageChange}
      onBack={handleBack}
      onBackToHome={handleBackToHome}
      artifactData={artifactData} // Pass the fetched data
      onArtifactSubmit={handleArtifactSubmit}
    />
  );
}
