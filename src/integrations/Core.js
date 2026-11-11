// Upload file lên Supabase Storage (bucket 'audio' — xem supabase/storage_audio.sql)
import { supabase } from '@/lib/supabaseClient';

export const UploadFile = async ({ file }) => {
  // Tên file an toàn: bỏ dấu/khoảng trắng/ký tự đặc biệt
  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${Date.now()}_${safeName}`;

  // 1) Upload lên bucket (admin-only — policy RLS bên phía Storage kiểm tra role)
  const { error: uploadError } = await supabase.storage
    .from('audio')
    .upload(path, file, {
      contentType: file.type || 'audio/mpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // 2) Lấy URL công khai để dán vào trường Audio URL của hiện vật
  const { data } = supabase.storage.from('audio').getPublicUrl(path);

  return { file_url: data.publicUrl, path };
};
