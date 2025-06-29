/*
  # Setup Audio Storage Bucket

  1. Storage
    - Create `audio-files` bucket for storing generated audio files
    - Set up public access policies for audio playback
    - Configure file upload policies

  2. Security
    - Allow public read access for audio playback
    - Allow authenticated uploads
    - Set file size and type restrictions
*/

-- Create the audio-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  true,
  10485760, -- 10MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to audio files
CREATE POLICY "Public read access for audio files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'audio-files');

-- Allow authenticated users to upload audio files
CREATE POLICY "Authenticated users can upload audio files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio-files');

-- Allow users to update their own audio files
CREATE POLICY "Users can update their own audio files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'audio-files');

-- Allow users to delete their own audio files
CREATE POLICY "Users can delete their own audio files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'audio-files');