-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Allow public uploads to audio-files bucket"
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Allow public downloads from audio-files bucket"
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'audio-files');

CREATE POLICY "Allow public deletes from audio-files bucket"
ON storage.objects FOR DELETE 
TO public 
USING (bucket_id = 'audio-files');