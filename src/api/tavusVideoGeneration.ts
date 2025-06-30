import { audioFileService } from "@/lib/supabase";

interface TavusVideoResponse {
  video_id: string;
  video_url?: string;
  status: string;
  download_url?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
}

export const generateTavusVideoFromAudio = async (
  audioBlob: Blob,
  text: string,
  userName?: string
): Promise<TavusVideoResponse> => {
  const API_KEY = import.meta.env.VITE_TAVUS_API_KEY;
  const PERSONA_ID = import.meta.env.VITE_TAVUS_PERSONA_ID || "p5bf051443c7";
  
  if (!API_KEY || API_KEY === 'your-tavus-api-key') {
    console.error('❌ Tavus API key not configured. Please set VITE_TAVUS_API_KEY in your .env file');
    throw new Error('Tavus API key not configured. Please add a valid API key to your .env file.');
  }

  console.log('🎬 Creating Tavus video from audio blob');
  
  // Create initial database record
  let audioFileRecord;
  try {
    audioFileRecord = await audioFileService.create({
      user_name: userName,
      message_text: text,
      audio_type: 'tavus_video',
      status: 'pending',
      metadata: {
        api_endpoint: "https://api.tavus.io/videos",
        request_timestamp: new Date().toISOString(),
        text_length: text.length,
        original_text: text,
        persona_id: PERSONA_ID,
        step: 'uploading_audio'
      }
    });
    console.log('✅ Created Tavus video generation record:', audioFileRecord.id);
  } catch (dbError) {
    console.warn('⚠️ Failed to create database record (non-critical):', dbError);
  }
  
  try {
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('persona_id', PERSONA_ID);
    formData.append('audio', audioBlob, 'speech.mp3');
    
    console.log('📤 Sending audio to Tavus API...');
    console.log('Using persona_id:', PERSONA_ID);
    console.log('Audio blob size:', audioBlob.size, 'bytes');
    
    const response = await fetch("https://api.tavus.io/videos", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
    });

    if (!response?.ok) {
      const errorText = await response.text();
      console.error("❌ Tavus Video API Error Response:", errorText);
      
      if (response.status === 401) {
        throw new Error("Invalid Tavus API token. Please check your API key in settings.");
      } else if (response.status === 403) {
        throw new Error("Access forbidden. Please verify your Tavus API key has video generation permissions.");
      } else if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message?.includes("concurrent") || errorData.message?.includes("maximum")) {
            throw new Error("You have reached the maximum number of active video generations. Please wait for current videos to complete.");
          }
        } catch (parseError) {
          // If we can't parse the error, fall through to generic error
        }
        throw new Error(`Request failed: ${errorText}`);
      } else {
        throw new Error(`Failed to generate Tavus video: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log("✅ Tavus Video API Response:", data);
    
    // Update database record with video ID
    if (audioFileRecord && data.video_id) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          video_id: data.video_id,
          status: data.status === 'completed' ? 'completed' : 'pending',
          audio_url: data.video_url || undefined,
          metadata: {
            ...audioFileRecord.metadata,
            video_id: data.video_id,
            api_response: data,
            response_timestamp: new Date().toISOString(),
            video_generation_started: true,
            step: data.status === 'completed' ? 'completed' : 'processing'
          }
        });
        console.log('✅ Updated record with video ID:', data.video_id);
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record (non-critical):', dbError);
      }
    }
    
    return {
      video_id: data.video_id,
      status: data.status || 'processing',
      video_url: data.video_url,
      download_url: data.download_url,
      duration_seconds: data.duration_seconds,
      file_size_bytes: data.file_size_bytes
    };
  } catch (error) {
    console.error("❌ Error in generateTavusVideoFromAudio:", error);
    
    // Update database record with error status
    if (audioFileRecord) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          status: 'failed',
          metadata: {
            ...audioFileRecord.metadata,
            error: error instanceof Error ? error.message : 'Unknown error',
            error_timestamp: new Date().toISOString(),
            step: 'failed'
          }
        });
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record with error (non-critical):', dbError);
      }
    }
    
    throw error;
  }
};

export const getTavusVideoStatus = async (
  videoId: string,
  updateDatabase: boolean = true
): Promise<TavusVideoResponse> => {
  const API_KEY = import.meta.env.VITE_TAVUS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('Tavus API key not configured');
  }

  try {
    const response = await fetch(`https://api.tavus.io/videos/${videoId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error getting Tavus video status:", errorText);
      throw new Error(`Failed to get video status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("📊 Tavus video status response:", data);
    
    // Update database record if video is completed
    if (updateDatabase && data.status === 'completed' && data.video_url) {
      try {
        const audioFile = await audioFileService.getByVideoId(videoId);
        if (audioFile) {
          await audioFileService.update(audioFile.id, {
            status: 'completed',
            audio_url: data.video_url,
            duration_seconds: data.duration_seconds,
            file_size_bytes: data.file_size_bytes,
            metadata: {
              ...audioFile.metadata,
              completion_timestamp: new Date().toISOString(),
              final_status_response: data,
              video_generation_completed: true,
              final_video_url: data.video_url,
              download_url: data.download_url,
              step: 'completed'
            }
          });
          console.log('✅ Updated record with completion data');
        }
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record with completion data (non-critical):', dbError);
      }
    }
    
    return {
      video_id: data.video_id || videoId,
      status: data.status,
      video_url: data.video_url,
      download_url: data.download_url,
      duration_seconds: data.duration_seconds,
      file_size_bytes: data.file_size_bytes
    };
  } catch (error) {
    console.error("❌ Error getting Tavus video status:", error);
    throw error;
  }
};