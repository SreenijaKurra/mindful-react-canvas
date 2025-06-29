import { audioFileService } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

interface TTSOptions {
  voice?: string;
  speed?: number;
  format?: 'mp3' | 'wav';
}

export const generateAndStoreAudio = async (
  text: string,
  userName?: string,
  options: TTSOptions = {}
): Promise<string> => {
  // Create initial database record
  const audioRecord = await audioFileService.create({
    user_name: userName,
    message_text: text,
    audio_type: 'tts',
    status: 'pending',
    metadata: {
      tts_options: options,
      request_timestamp: new Date().toISOString(),
      text_length: text.length
    }
  });

  try {
    // Example using OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: options.voice || 'alloy',
        response_format: options.format || 'mp3',
        speed: options.speed || 1.0
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const fileName = `tts-${audioRecord.id}.${options.format || 'mp3'}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, audioBlob, {
        contentType: `audio/${options.format || 'mp3'}`,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Storage upload error: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName);

    // Update database record with file URL
    await audioFileService.update(audioRecord.id, {
      status: 'completed',
      audio_url: urlData.publicUrl,
      file_size_bytes: audioBlob.size,
      duration_seconds: Math.ceil(text.length / 10), // Estimate
      metadata: {
        ...audioRecord.metadata,
        completion_timestamp: new Date().toISOString(),
        file_name: fileName,
        storage_path: uploadData.path,
        file_size: audioBlob.size
      }
    });

    return urlData.publicUrl;

  } catch (error) {
    // Update record with error status
    await audioFileService.update(audioRecord.id, {
      status: 'failed',
      metadata: {
        ...audioRecord.metadata,
        error: error instanceof Error ? error.message : 'Unknown error',
        error_timestamp: new Date().toISOString()
      }
    });

    throw error;
  }
};

// Function to clean up old audio files
export const cleanupOldAudioFiles = async (daysOld: number = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Get old files from database
  const { data: oldFiles, error } = await supabase
    .from('audio_files')
    .select('id, audio_url, metadata')
    .lt('created_at', cutoffDate.toISOString())
    .eq('audio_type', 'tts')
    .not('audio_url', 'is', null);

  if (error) {
    console.error('Error fetching old files:', error);
    return;
  }

  // Delete files from storage and database
  for (const file of oldFiles || []) {
    try {
      // Extract file name from URL or metadata
      const fileName = file.metadata?.file_name;
      if (fileName) {
        await supabase.storage
          .from('audio-files')
          .remove([fileName]);
      }

      // Delete database record
      await audioFileService.delete(file.id);
      
      console.log(`Cleaned up old audio file: ${file.id}`);
    } catch (error) {
      console.error(`Error cleaning up file ${file.id}:`, error);
    }
  }
};