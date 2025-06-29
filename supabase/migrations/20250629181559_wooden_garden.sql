/*
  # Create audio_files table for storing audio generations

  1. New Tables
    - `audio_files`
      - `id` (uuid, primary key)
      - `user_name` (text, optional user identifier)
      - `message_text` (text, the original text that was converted to audio)
      - `audio_type` (text, type of audio generation - 'tts' for text-to-speech, 'tavus_video' for lip sync)
      - `audio_url` (text, URL to the generated audio/video file)
      - `video_id` (text, optional Tavus video ID for tracking)
      - `status` (text, generation status - 'pending', 'completed', 'failed')
      - `duration_seconds` (integer, duration of audio/video in seconds)
      - `file_size_bytes` (bigint, file size in bytes if available)
      - `metadata` (jsonb, additional metadata about the generation)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `audio_files` table
    - Add policy for public read access (since this is a demo)
    - Add policy for public insert access
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

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_audio_files_created_at ON audio_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_files_user_name ON audio_files(user_name);
CREATE INDEX IF NOT EXISTS idx_audio_files_status ON audio_files(status);
CREATE INDEX IF NOT EXISTS idx_audio_files_video_id ON audio_files(video_id) WHERE video_id IS NOT NULL;