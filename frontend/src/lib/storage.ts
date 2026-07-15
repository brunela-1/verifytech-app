import { supabase } from '../lib/supabase';

const BUCKET_TECH_DOCS = 'tech-docs';
const BUCKET_REQUEST_IMAGES = 'request-images';
const BUCKET_PROFILE_PHOTOS = 'profile-photos';

export async function uploadTechDoc(
  userId: string,
  label: 'dni-front' | 'dni-back' | 'cert',
  file: File
): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${label}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_TECH_DOCS)
    .upload(path, file, { upsert: true });
  if (error) {
    console.error(`[uploadTechDoc] ${label}:`, error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET_TECH_DOCS).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadRequestImage(
  requestId: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${requestId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_REQUEST_IMAGES)
    .upload(path, file, { upsert: true });
  if (error) {
    console.error('[uploadRequestImage]:', error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET_REQUEST_IMAGES).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_PROFILE_PHOTOS)
    .upload(path, file, { upsert: true });
  if (error) {
    console.error('[uploadProfilePhoto]:', error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET_PROFILE_PHOTOS).getPublicUrl(path);
  return data.publicUrl;
}
