import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient'; // ✅ Kết nối Supabase

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
];

export default function LanguageSelector({ onLanguageSelect }) {
  const [visits, setVisits] = useState(null);

  // ✅ Lấy và tăng số lượt truy cập
  useEffect(() => {
    async function updateVisits() {
      try {
        // Lấy lượt truy cập hiện tại
        const { data: record, error: fetchError } = await supabase
          .from('page_visits')
          .select('count')
          .eq('page', 'home')
          .maybeSingle();

        if (fetchError) console.warn('Fetch error:', fetchError);

        const newCount = (record?.count || 0) + 1;

        // Cập nhật lại vào bảng
        const { error: updateError } = await supabase
          .from('page_visits')
          .upsert({
            page: 'home',
            count: newCount,
            updated_at: new Date().toISOString(),
          });

        if (updateError) console.error('Update error:', updateError);

        setVisits(newCount);
      } catch (err) {
        console.error('Supabase error:', err);
      }
    }

    updateVisits();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="mb-6">
            <img
              src="/assets/logoBTCP.png"
              alt="Museum Logo"
              className="w-24 h-auto mx-auto"
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-light text-slate-900 mb-4 tracking-tight">
            Museum Audio Guide
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Choose your preferred language to begin your immersive cultural journey
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <div className="grid gap-4">
            {languages.map((language, index) => (
              <motion.div
                key={language.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <Button
                      variant="ghost"
                      className="w-full h-full p-6 flex items-center justify-between hover:bg-amber-50/50 transition-colors duration-200"
                      onClick={() => onLanguageSelect(language.code)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{language.flag}</span>
                        <div className="text-left">
                          <div className="text-xl font-medium text-slate-900">
                            {language.name}
                          </div>
                          <div className="text-slate-500 text-sm">
                            {language.nativeName}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-amber-600" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-16 text-slate-400 text-sm"
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            <span>Premium Museum Experience</span>
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
          </div>

          {/* ✅ Hiển thị số lượt truy cập */}
          {visits !== null && (
            <div className="mt-2 text-slate-500">
              👁️ {visits.toLocaleString()} lượt truy cập
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
