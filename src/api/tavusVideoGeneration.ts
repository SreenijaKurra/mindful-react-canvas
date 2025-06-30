import { audioFileService, supabase } from "@/lib/supabase";

interface TavusVideoResponse {
  video_id: string;
  video_url?: string;
  hosted_url?: string;
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
  const REPLICA_ID = import.meta.env.VITE_TAVUS_REPLICA_ID || "r62baeccd777";
  
  if (!API_KEY || API_KEY === 'your-tavus-api-key') {
    console.error('❌ Tavus API key not configured. Please set VITE_TAVUS_API_KEY in your .env file');
    throw new Error('Tavus API key not configured');
  }

  console.log('🎬 Creating Tavus video using replica approach');
  console.log('Using replica_id:', REPLICA_ID);
  
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
        replica_id: REPLICA_ID,
        step: 'uploading_audio'
      }
    });
    console.log('✅ Created Tavus video generation record:', audioFileRecord.id);
  } catch (dbError) {
    console.warn('⚠️ Failed to create database record (non-critical):', dbError);
  }
  
  try {
    // Step 1: Upload audio to Supabase storage to get a public URL
    console.log('📤 Step 1: Uploading audio to Supabase storage...');
    
    if (!supabase) {
      throw new Error('Supabase not configured - cannot upload audio file');
    }
    
    const fileName = `tavus-audio-${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, audioBlob, {
        contentType: 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName);

    const audioUrl = urlData.publicUrl;
    console.log('✅ Audio uploaded to:', audioUrl);
    
    // Update database record with audio URL
    if (audioFileRecord) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          audio_url: audioUrl,
          metadata: {
            ...audioFileRecord.metadata,
            audio_upload_completed: new Date().toISOString(),
            supabase_audio_url: audioUrl,
            supabase_file_path: uploadData.path,
            step: 'creating_video'
          }
        });
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record (non-critical):', dbError);
      }
    }
    
    // Step 2: Send audio URL to Tavus for video generation
    console.log('🎬 Step 2: Creating video with Tavus API...');
    
    const payload = {
      replica_id: REPLICA_ID,
      audio_url: audioUrl,
      video_name: `NeuroHeart_${Date.now()}`
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
      console.error("❌ Tavus Video API Error Response:", errorText);
      
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
          if (errorData.message?.includes("replica")) {
            throw new Error("Invalid replica ID. Please check your VITE_TAVUS_REPLICA_ID configuration.");
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
    console.log("✅ Tavus Video API Response:", data);
    
    // Update database record with video ID
    if (audioFileRecord && data.video_id) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          video_id: data.video_id,
          status: data.status === 'completed' ? 'completed' : 'pending',
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
      video_url: data.video_url || data.hosted_url,
      hosted_url: data.hosted_url,
      download_url: data.download_url,
      duration_seconds: data.duration_seconds,
      file_size_bytes: data.file_size_bytes
    };
  } catch (error) {
    console.error("❌ Error in generateTavusVideoFromAudio:", error);
    
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

export const getTavusVideoStatus = async (
  videoId: string,
  updateDatabase: boolean = true
): Promise<TavusVideoResponse> => {
  const API_KEY = import.meta.env.VITE_TAVUS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('Tavus API key not configured');
  }

  try {
    console.log(`📊 Checking status for video: ${videoId}`);
    
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
      console.error("❌ Error getting Tavus video status:", errorText);
      throw new Error(`Failed to get video status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("📊 Tavus video status response:", data);
    
    // Update database record if video is completed
    if (updateDatabase && data.status === 'completed' && (data.video_url || data.hosted_url)) {
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
    console.error("❌ Error getting Tavus video status:", error);
    
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

// Polling function similar to your original code
export const pollTavusVideoStatus = async (
  videoId: string,
  onStatusUpdate?: (status: string) => void,
  maxAttempts: number = 60 // 10 minutes max (10 second intervals)
): Promise<TavusVideoResponse> => {
  console.log(`🔄 Starting to poll video status for: ${videoId}`);
  const startTime = Date.now();
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📊 Polling attempt ${attempt}/${maxAttempts} for video ${videoId}`);
      
      const statusResponse = await getTavusVideoStatus(videoId);
      console.log(`Status: ${statusResponse.status}`);
      
      // Call status update callback if provided
      if (onStatusUpdate) {
        onStatusUpdate(statusResponse.status);
      }
      
      if (statusResponse.status === 'completed') {
        const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('\n🎬 Video Ready!');
        console.log('Watch it here:\n' + (statusResponse.hosted_url || statusResponse.video_url));
        console.log(`⏱️ Video generation time: ${durationSec} seconds`);
        return statusResponse;
      }
      
      if (statusResponse.status === 'failed') {
        console.error('❌ Video generation failed.');
        throw new Error('Video generation failed on Tavus servers');
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
  
  throw new Error(`Video generation timed out after ${maxAttempts} attempts (${(maxAttempts * 10)/60} minutes)`);
};