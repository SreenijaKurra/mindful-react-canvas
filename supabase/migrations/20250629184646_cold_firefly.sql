/*
  # Update audio_files table to support new audio types

  1. Changes
    - Add support for 'ai_text_generation' audio type
    - Update existing records if needed
    - Add better indexing for audio_type column

  2. Security
    - Maintains existing RLS policies
    - No breaking changes to existing data
*/

-- Add index for audio_type if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_audio_files_audio_type ON audio_files(audio_type);

-- Update any existing records that might need type correction
-- This is safe as it only affects records that don't have a proper type
UPDATE audio_files 
SET audio_type = 'ai_text_generation' 
WHERE audio_type NOT IN ('tts', 'tavus_video', 'ai_text_generation') 
  AND audio_url IS NULL 
  AND video_id IS NULL;

-- Add a comment to the table for documentation
COMMENT ON TABLE audio_files IS 'Stores all generated content including AI text responses, TTS audio, and Tavus lip-sync videos';
COMMENT ON COLUMN audio_files.audio_type IS 'Type of generated content: ai_text_generation, tts, or tavus_video';
COMMENT ON COLUMN audio_files.metadata IS 'JSON metadata including API responses, timestamps, and generation details';