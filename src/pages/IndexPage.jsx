import React, { useState } from 'react';
import LanguageSelector from '@/components/LanguageSelector';
import ArtifactInput from '@/components/ArtifactInput';
import AudioPlayer from '@/components/AudioPlayer';
import artifactData from '@/data/artifacts.json';

export default function IndexPage() {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [artifactCode, setArtifactCode] = useState(null);

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
  };

  const handleArtifactSubmit = (code) => {
    if (artifactData[code]) {
      setArtifactCode(code);
    } else {
      alert(`Artifact with code "${code}" not found.`);
    }
  };

  const handleBack = () => {
    setArtifactCode(null);
  };

  const handleLanguageChange = (newLangCode) => {
    if (newLangCode) {
         setSelectedLanguage(newLangCode);
    } else {
        // Chức năng nút Globe trong trình phát, quay lại chọn ngôn ngữ
        setSelectedLanguage(null);
        setArtifactCode(null);
    }
  };

  if (!selectedLanguage) {
    return <LanguageSelector onLanguageSelect={handleLanguageSelect} />;
  }

  if (!artifactCode) {
    return <ArtifactInput selectedLanguage={selectedLanguage} onArtifactSubmit={handleArtifactSubmit} />;
  }

  return (
    <AudioPlayer
      language={selectedLanguage}
      artifactCode={artifactCode}
      onLanguageChange={handleLanguageChange}
      onBack={handleBack}
      artifactData={artifactData[artifactCode]}
    />
  );
}