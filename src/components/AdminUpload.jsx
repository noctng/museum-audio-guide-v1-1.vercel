import React, { useState } from 'react';
import { UploadFile } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadCloud, Copy, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminUploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [error, setError] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'audio/mpeg') {
      setSelectedFile(file);
      setError('');
      setUploadedUrl('');
    } else {
      setSelectedFile(null);
      setError('Please select an MP3 file.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('No file selected.');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadedUrl('');

    try {
      const result = await UploadFile({ file: selectedFile });
      if (result && result.file_url) {
        setUploadedUrl(result.file_url);
      } else {
        throw new Error('Upload failed. No URL returned.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('An error occurred during upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(uploadedUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y:20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                <UploadCloud className="w-8 h-8 text-amber-500" />
                <span>Upload Audio File</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-600">
                Use this page to upload your MP3 audio files. After uploading, you will get a direct URL to use in your artifact data.
              </p>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center space-y-4">
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <div className="font-medium text-amber-600 hover:text-amber-700">
                    {selectedFile ? 'Change file' : 'Choose an MP3 file'}
                  </div>
                  <Input 
                    id="audio-upload"
                    type="file" 
                    accept=".mp3,audio/mpeg"
                    onChange={handleFileChange} 
                    className="hidden"
                  />
                </label>
                {selectedFile && <p className="text-sm text-slate-500">{selectedFile.name}</p>}
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || isUploading}
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>

              {uploadedUrl && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Upload Successful!</AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-green-700 mb-4">Here is your direct audio URL:</p>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="text" 
                        readOnly 
                        value={uploadedUrl} 
                        className="bg-white"
                      />
                      <Button variant="outline" size="icon" onClick={handleCopy}>
                        {hasCopied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}