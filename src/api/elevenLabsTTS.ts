import { audioFileService } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

interface ElevenLabsTTSOptions {
  voice_id?: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export const generateElevenLabsAudio = async (
  text: string,
  userName?: string,
  options: ElevenLabsTTSOptions = {}
): Promise<string> => {
  const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
  
  if (!API_KEY || API_KEY === 'your-elevenlabs-api-key') {
    console.error('❌ ElevenLabs API key not configured. Please set VITE_ELEVENLABS_API_KEY in your .env file');
    throw new Error('ElevenLabs API key not configured. Please add a valid API key to your .env file.');
  }

  // Default voice settings for natural speech
  const defaultOptions: ElevenLabsTTSOptions = {
    voice_id: options.voice_id || "21m00Tcm4TlvDq8ikWAM", // Rachel voice (default)
    model_id: options.model_id || "eleven_monolingual_v1",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
      ...options.voice_settings
    }
  };

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
        voice_id: defaultOptions.voice_id,
        model_id: defaultOptions.model_id,
        voice_settings: defaultOptions.voice_settings,
        api_endpoint: `https://api.elevenlabs.io/v1/text-to-speech/${defaultOptions.voice_id}`,
        request_timestamp: new Date().toISOString(),
        text_length: text.length,
        character_count: text.length
      }
    });
    console.log('✅ Created ElevenLabs TTS record:', audioFileRecord.id);
  } catch (dbError) {
    console.warn('⚠️ Failed to create TTS database record (non-critical):', dbError);
  }

  try {
    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${defaultOptions.voice_id}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: defaultOptions.model_id,
          voice_settings: defaultOptions.voice_settings,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Get audio blob
    const audioBlob = await response.blob();
    const fileName = `elevenlabs-${audioFileRecord?.id || Date.now()}.mp3`;

    // Upload to Supabase Storage
    let uploadData, uploadError;
    let audioUrl;
    
    if (supabase) {
      const uploadResult = await supabase.storage
        .from('audio-files')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mpeg',
          upsert: false
        });
      
      uploadData = uploadResult.data;
      uploadError = uploadResult.error;
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Storage upload error: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);
      
      audioUrl = urlData.publicUrl;
    } else {
      console.warn('⚠️ Supabase not available - creating blob URL for audio');
      // Create a blob URL as fallback when Supabase is not available
      audioUrl = URL.createObjectURL(audioBlob);
    }


    // Update database record with completion data
    if (audioFileRecord) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          status: 'completed',
          audio_url: audioUrl,
          file_size_bytes: audioBlob.size,
          duration_seconds: Math.ceil(text.length / 15), // Rough estimate: ~15 chars per second
          metadata: {
            ...audioFileRecord.metadata,
            completion_timestamp: new Date().toISOString(),
            file_name: fileName,
            storage_path: uploadData.path,
            file_size: audioBlob.size,
            public_url: audioUrl,
            upload_successful: true,
            estimated_duration: Math.ceil(text.length / 15)
          }
        });
        console.log('✅ Updated TTS record with audio URL:', audioUrl);
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record (non-critical):', dbError);
      }
    }

    console.log('🎵 ElevenLabs TTS audio generated and stored:', audioUrl);
    return audioUrl;

  } catch (error) {
    console.error('❌ Error generating ElevenLabs audio:', error);
    
    // Update database record with error
    if (audioFileRecord) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          status: 'failed',
          metadata: {
            ...audioFileRecord.metadata,
            error: error instanceof Error ? error.message : 'Unknown error',
            error_timestamp: new Date().toISOString(),
            generation_failed: true
          }
        });
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record with error (non-critical):', dbError);
      }
    }

    throw error;
  }
};

// Get available ElevenLabs voices
export const getElevenLabsVoices = async (): Promise<any[]> => {
  const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    throw error;
  }
};

// Predefined voice options for easy selection
export const ELEVENLABS_VOICES = {
  RACHEL: "21m00Tcm4TlvDq8ikWAM", // Female, calm
  DOMI: "AZnzlk1XvdvUeBnXmlld", // Female, strong
  BELLA: "EXAVITQu4vr4xnSDxMaL", // Female, soft
  ANTONI: "ErXwobaYiN019PkySvjV", // Male, well-rounded
  ELLI: "MF3mGyEYCl7XYWbV9V6O", // Female, emotional
  JOSH: "TxGEqnHWrfWFTfGW9XjX", // Male, deep
  ARNOLD: "VR6AewLTigWG4xSOukaG", // Male, crisp
  ADAM: "pNInz6obpgDQGcFmaJgB", // Male, deep
  SAM: "yoZ06aMxZJJ28mfd3POQ", // Male, raspy
};