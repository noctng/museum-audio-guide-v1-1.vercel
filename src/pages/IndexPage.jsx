import React, { useState } from 'react';
import LanguageSelector from '@/components/LanguageSelector';
import ArtifactInput from '@/components/ArtifactInput';
import AudioPlayer from '@/components/AudioPlayer';
import { supabase } from '@/lib/supabaseClient'; // Import supabase client

export default function IndexPage() {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [artifactCode, setArtifactCode] = useState(null);
  const [artifactData, setArtifactData] = useState(null); // Add state for data

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
