/*
  # Create audio_files table for Neuro meditation app

  1. New Tables
    - `audio_files`
      - `id` (uuid, primary key)
      - `user_name` (text, optional)
      - `message_text` (text, required)
      - `audio_type` (text, required - 'tts', 'tavus_video', 'ai_text_generation')
      - `audio_url` (text, optional)
      - `video_id` (text, optional)
      - `status` (text, required - 'pending', 'completed', 'failed')
      - `duration_seconds` (integer, optional)
      - `file_size_bytes` (bigint, optional)
      - `metadata` (jsonb, optional)
      - `created_at` (timestamptz, auto)
      - `updated_at` (timestamptz, auto)

  2. Security
    - Enable RLS on `audio_files` table
    - Add policies for public access (demo purposes)

  3. Indexes
    - Performance indexes for common queries
    - Trigger for auto-updating updated_at
*/

-- Create the table if it doesn't exist
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

-- Enable RLS
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to audio_files" ON audio_files;
DROP POLICY IF EXISTS "Allow public insert access to audio_files" ON audio_files;
DROP POLICY IF EXISTS "Allow public update access to audio_files" ON audio_files;

-- Create new policies for demo purposes
CREATE POLICY "Allow public read access to audio_files"
  ON audio_files
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to audio_files"
  ON audio_files
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to audio_files"
  ON audio_files
  FOR UPDATE
  TO public
  USING (true);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_audio_files_created_at ON audio_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_files_user_name ON audio_files(user_name);
CREATE INDEX IF NOT EXISTS idx_audio_files_status ON audio_files(status);
CREATE INDEX IF NOT EXISTS idx_audio_files_audio_type ON audio_files(audio_type);
CREATE INDEX IF NOT EXISTS idx_audio_files_video_id ON audio_files(video_id) WHERE video_id IS NOT NULL;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_audio_files_updated_at ON audio_files;

-- Create the trigger
CREATE TRIGGER update_audio_files_updated_at 
    BEFORE UPDATE ON audio_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();