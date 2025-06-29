/*
  # Create audio_files table for neuroheart org

  1. New Tables
    - `audio_files`
      - `id` (uuid, primary key)
      - `user_name` (text, optional)
      - `message_text` (text, required)
      - `audio_type` (text, default 'tts')
      - `audio_url` (text, optional)
      - `video_id` (text, optional for Tavus videos)
      - `status` (text, default 'pending')
      - `duration_seconds` (integer, optional)
      - `file_size_bytes` (bigint, optional)
      - `metadata` (jsonb, default '{}')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `audio_files` table
    - Add policies for public access (demo purposes)
    - Create indexes for efficient queries

  3. Notes
    - This table stores both TTS audio generations and Tavus lip-sync videos
    - Supports tracking generation status and metadata
    - Optimized for n8n workflow integration
*/

CREATE TABLE IF NOT EXISTS audio_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text,
  message_text text NOT NULL,
  audio_type text NOT NULL DEFAULT 'tts',
  audio_url text,
  video_id text,
  status text NOT NULL DEFAULT 'pending',
  duration_seconds integer,
  file_size_bytes bigint,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

-- Allow public read access for demo purposes
CREATE POLICY "Allow public read access to audio_files"
  ON audio_files
  FOR SELECT
  TO public
  USING (true);

-- Allow public insert access for demo purposes
CREATE POLICY "Allow public insert access to audio_files"
  ON audio_files
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update access for demo purposes
CREATE POLICY "Allow public update access to audio_files"
  ON audio_files
  FOR UPDATE
  TO public
  USING (true);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_audio_files_created_at ON audio_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_files_user_name ON audio_files(user_name);
CREATE INDEX IF NOT EXISTS idx_audio_files_status ON audio_files(status);
CREATE INDEX IF NOT EXISTS idx_audio_files_video_id ON audio_files(video_id) WHERE video_id IS NOT NULL;

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_audio_files_updated_at 
    BEFORE UPDATE ON audio_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();