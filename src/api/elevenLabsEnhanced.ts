import { audioFileService } from "@/lib/supabase";

interface ElevenLabsConfig {
  voice_id?: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export const generateElevenLabsAudioBlob = async (
  text: string,
  userName?: string,
  config: ElevenLabsConfig = {}
): Promise<Blob> => {
  const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || "IKne3meq5aSn9XLyUdCD";
  
  if (!API_KEY || API_KEY === 'your-elevenlabs-api-key') {
    console.error('❌ ElevenLabs API key not configured. Please set VITE_ELEVENLABS_API_KEY in your .env file');
    throw new Error('ElevenLabs API key not configured');
  }

  // Default configuration
  const defaultConfig: ElevenLabsConfig = {
    voice_id: config.voice_id || VOICE_ID,
    model_id: config.model_id || "eleven_monolingual_v1",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
      ...config.voice_settings
    }
  };

  console.log('🎵 Generating ElevenLabs audio blob for text:', text.substring(0, 50) + '...');
  console.log('Using voice ID:', defaultConfig.voice_id);
  console.log('Using model:', defaultConfig.model_id);

  // Create initial database record
  let audioFileRecord;
  try {
    audioFileRecord = await audioFileService.create({
      user_name: userName,
      message_text: text,
      audio_type: 'tts',
      status: 'pending',
      metadata: {
        tts_provider: 'elevenlabs',
        voice_id: defaultConfig.voice_id,
        model_id: defaultConfig.model_id,
        voice_settings: defaultConfig.voice_settings,
        api_endpoint: `https://api.elevenlabs.io/v1/text-to-speech/${defaultConfig.voice_id}`,
        request_timestamp: new Date().toISOString(),
        text_length: text.length,
        character_count: text.length,
        workflow_step: 'audio_generation'
      }
    });
    console.log('✅ Created ElevenLabs TTS record:', audioFileRecord.id);
  } catch (dbError) {
    console.warn('⚠️ Failed to create TTS database record (non-critical):', dbError);
  }

  try {
    // Call ElevenLabs API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${defaultConfig.voice_id}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: defaultConfig.model_id,
          voice_settings: defaultConfig.voice_settings,
        }),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid ElevenLabs API key');
      } else if (response.status === 429) {
        throw new Error('ElevenLabs API rate limit exceeded');
      } else if (response.status >= 500) {
        throw new Error('ElevenLabs server error');
      } else {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }
    }

    // Get audio blob
    const audioBlob = await response.blob();
    console.log('✅ ElevenLabs audio blob generated:', audioBlob.size, 'bytes');

    // Update database record with completion data
    if (audioFileRecord) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          status: 'completed',
          file_size_bytes: audioBlob.size,
          duration_seconds: Math.ceil(text.length / 15), // Rough estimate: ~15 chars per second
          metadata: {
            ...audioFileRecord.metadata,
            completion_timestamp: new Date().toISOString(),
            file_size: audioBlob.size,
            estimated_duration: Math.ceil(text.length / 15),
            workflow_step: 'audio_completed'
          }
        });
        console.log('✅ Updated TTS record with completion data');
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record (non-critical):', dbError);
      }
    }

    return audioBlob;

  } catch (error) {
    console.error('❌ Error generating ElevenLabs audio blob:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - please try again');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error - check your internet connection');
      }
    }
    
    // Update database record with error
    if (audioFileRecord) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          status: 'failed',
          metadata: {
            ...audioFileRecord.metadata,
            error: error instanceof Error ? error.message : 'Unknown error',
            error_timestamp: new Date().toISOString(),
            workflow_step: 'audio_failed'
          }
        });
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record with error (non-critical):', dbError);
      }
    }

    throw error;
  }
};