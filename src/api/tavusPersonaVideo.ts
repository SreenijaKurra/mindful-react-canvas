import { audioFileService } from "@/lib/supabase";

interface TavusPersonaVideoResponse {
  video_id: string;
  video_url?: string;
  hosted_url?: string;
  status: string;
  download_url?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
}

export const generateTavusPersonaVideo = async (
  text: string,
  userName?: string
): Promise<TavusPersonaVideoResponse> => {
  const API_KEY = import.meta.env.VITE_TAVUS_API_KEY;
  const PERSONA_ID = import.meta.env.VITE_TAVUS_PERSONA_ID || "p5bf051443c7";
  
  if (!API_KEY || API_KEY === 'your-tavus-api-key') {
    console.error('❌ Tavus API key not configured. Please set VITE_TAVUS_API_KEY in your .env file');
    throw new Error('Tavus API key not configured');
  }

  console.log('🎬 Creating Tavus persona video');
  console.log('Using persona_id:', PERSONA_ID);
  console.log('Script text:', text.substring(0, 100) + '...');
  
  // Create initial database record
  let audioFileRecord;
  try {
    audioFileRecord = await audioFileService.create({
      user_name: userName,
      message_text: text,
      audio_type: 'tavus_video',
      status: 'pending',
      metadata: {
        api_endpoint: "https://tavusapi.com/v2/videos",
        request_timestamp: new Date().toISOString(),
        text_length: text.length,
        original_text: text,
        persona_id: PERSONA_ID,
        step: 'creating_persona_video'
      }
    });
    console.log('✅ Created Tavus persona video record:', audioFileRecord.id);
  } catch (dbError) {
    console.warn('⚠️ Failed to create database record (non-critical):', dbError);
  }
  
  try {
    // Use Tavus /v2/videos endpoint with persona_id and script
    console.log('🎬 Creating persona video with Tavus API...');
    
    const payload = {
      persona_id: PERSONA_ID,
      script: text,
      video_name: `NeuroPersona_${Date.now()}`
    };
    
    console.log('📤 Sending payload to Tavus:', payload);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch("https://tavusapi.com/v2/videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response?.ok) {
      const errorText = await response.text();
      console.error("❌ Tavus Persona Video API Error Response:", errorText);
      
      if (response.status === 401) {
        throw new Error("Invalid Tavus API key");
      } else if (response.status === 403) {
        throw new Error("Tavus API access forbidden - check your API key permissions");
      } else if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message?.includes("concurrent") || errorData.message?.includes("maximum")) {
            throw new Error("Maximum concurrent video generations reached. Please wait and try again.");
          }
          if (errorData.message?.includes("persona")) {
            throw new Error("Invalid persona ID. Please check your VITE_TAVUS_PERSONA_ID configuration.");
          }
        } catch (parseError) {
          // If we can't parse the error, fall through to generic error
        }
        throw new Error(`Invalid request to Tavus API: ${errorText}`);
      } else {
        throw new Error(`Tavus API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log("✅ Tavus Persona Video API Response:", data);
    
    // Update database record with video ID
    if (audioFileRecord && data.video_id) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          video_id: data.video_id,
          status: data.status === 'ready' ? 'completed' : 'pending',
          metadata: {
            ...audioFileRecord.metadata,
            video_id: data.video_id,
            api_response: data,
            response_timestamp: new Date().toISOString(),
            video_generation_started: true,
            step: data.status === 'ready' ? 'completed' : 'processing'
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
      video_url: data.video_url || data.hosted_url,
      hosted_url: data.hosted_url,
      download_url: data.download_url,
      duration_seconds: data.duration_seconds,
      file_size_bytes: data.file_size_bytes
    };
  } catch (error) {
    console.error("❌ Error in generateTavusPersonaVideo:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Video generation timed out - please try again');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error - check your internet connection');
      }
    }
    
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

export const getTavusPersonaVideoStatus = async (
  videoId: string,
  updateDatabase: boolean = true
): Promise<TavusPersonaVideoResponse> => {
  const API_KEY = import.meta.env.VITE_TAVUS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('Tavus API key not configured');
  }

  try {
    console.log(`📊 Checking persona video status for: ${videoId}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`https://tavusapi.com/v2/videos/${videoId}`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error getting Tavus persona video status:", errorText);
      throw new Error(`Failed to get video status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("📊 Tavus persona video status response:", data);
    
    // Update database record if video is completed
    if (updateDatabase && data.status === 'ready' && (data.video_url || data.hosted_url)) {
      try {
        const audioFile = await audioFileService.getByVideoId(videoId);
        if (audioFile) {
          await audioFileService.update(audioFile.id, {
            status: 'completed',
            audio_url: data.video_url || data.hosted_url,
            duration_seconds: data.duration_seconds,
            file_size_bytes: data.file_size_bytes,
            metadata: {
              ...audioFile.metadata,
              completion_timestamp: new Date().toISOString(),
              final_status_response: data,
              video_generation_completed: true,
              final_video_url: data.video_url || data.hosted_url,
              hosted_url: data.hosted_url,
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
      video_url: data.video_url || data.hosted_url,
      hosted_url: data.hosted_url,
      download_url: data.download_url,
      duration_seconds: data.duration_seconds,
      file_size_bytes: data.file_size_bytes
    };
  } catch (error) {
    console.error("❌ Error getting Tavus persona video status:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Status check timed out');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error during status check');
      }
    }
    
    throw error;
  }
};

// Polling function for persona videos
export const pollTavusPersonaVideoStatus = async (
  videoId: string,
  onStatusUpdate?: (status: string) => void,
  maxAttempts: number = 60 // 10 minutes max (10 second intervals)
): Promise<TavusPersonaVideoResponse> => {
  console.log(`🔄 Starting to poll persona video status for: ${videoId}`);
  const startTime = Date.now();
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📊 Polling attempt ${attempt}/${maxAttempts} for persona video ${videoId}`);
      
      const statusResponse = await getTavusPersonaVideoStatus(videoId);
      console.log(`Status: ${statusResponse.status}`);
      
      // Call status update callback if provided
      if (onStatusUpdate) {
        onStatusUpdate(statusResponse.status);
      }
      
      if (statusResponse.status === 'ready') {
        const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('\n🎬 Persona Video Ready!');
        console.log('Watch it here:\n' + (statusResponse.hosted_url || statusResponse.video_url));
        console.log(`⏱️ Video generation time: ${durationSec} seconds`);
        return statusResponse;
      }
      
      if (statusResponse.status === 'failed') {
        console.error('❌ Persona video generation failed.');
        throw new Error('Persona video generation failed on Tavus servers');
      }
      
      // Wait 10 seconds before next poll (except on last attempt)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
    } catch (error) {
      console.error(`❌ Error on polling attempt ${attempt}:`, error);
      
      // If it's the last attempt, throw the error
      if (attempt >= maxAttempts) {
        throw error;
      }
      
      // For other attempts, wait and retry with exponential backoff
      const backoffDelay = Math.min(10000 * Math.pow(1.2, attempt - 1), 30000);
      console.log(`⏳ Retrying in ${backoffDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw new Error(`Persona video generation timed out after ${maxAttempts} attempts (${(maxAttempts * 10)/60} minutes)`);
};