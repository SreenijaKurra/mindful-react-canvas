import { settingsAtom } from "@/store/settings";
import { getDefaultStore } from "jotai";
import { audioFileService } from "@/lib/supabase";
import { secureAudioService } from "./supabaseService";

interface TavusVideoResponse {
  video_id: string;
  video_url?: string;
  status: string;
  download_url?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
}

export const generateTavusLipSyncVideo = async (
  token: string,
  text: string,
  userName?: string
): Promise<TavusVideoResponse> => {
  // Validate token before making API call
  if (!token || token.trim() === '') {
    throw new Error("API token is required. Please enter a valid Tavus API key in settings.");
  }
  
  // Get settings from Jotai store
  const settings = getDefaultStore().get(settingsAtom);
  
  console.log('🎬 Creating Tavus lip sync video with replica:', settings.replica);
  console.log('📝 Text to synthesize:', text);
  
  // Use the correct Tavus API v2 format for video generation
  const payload = {
    replica_id: settings.replica || "rfb51183fe", // Danny's replica ID
    script: text.substring(0, 500) // Limit text length to avoid API limits
  };
  
  console.log('📤 Sending payload to Tavus API:', payload);
  
  // Create initial database record
  let audioFileRecord;
  try {
    audioFileRecord = await audioFileService.create({
      user_name: userName,
      message_text: text,
      audio_type: 'tavus_video',
      status: 'pending',
      metadata: {
        replica_id: settings.replica || "rfb51183fe",
        api_endpoint: "https://tavusapi.com/v2/videos",
        request_timestamp: new Date().toISOString(),
        text_length: text.length,
        truncated_text: text.substring(0, 500),
        original_text_length: text.length,
        text_truncated: text.length > 500
      }
    });
    console.log('✅ Created Tavus video audio file record:', audioFileRecord.id);
  } catch (dbError) {
    console.warn('⚠️ Failed to create database record (non-critical):', dbError);
    // Continue with API call even if database fails
  }
  
  try {
    const response = await fetch("https://tavusapi.com/v2/videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": token.trim(),
      },
      body: JSON.stringify(payload),
    });

    if (!response?.ok) {
      const errorText = await response.text();
      console.error("❌ Tavus API Error Response:", errorText);
      
      if (response.status === 401) {
        throw new Error("Invalid API token. Please check your Tavus API key in settings and ensure it's correct.");
      } else if (response.status === 403) {
        throw new Error("Access forbidden. Please verify your API key has the necessary permissions.");
      } else if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message?.includes("concurrent") || errorData.message?.includes("maximum")) {
            throw new Error("You have reached the maximum number of active video generations. Please wait for current videos to complete or try again in a few minutes.");
          }
          if (errorData.error?.includes("replica_id")) {
            throw new Error("Invalid replica ID. Please check your replica settings.");
          }
        } catch (parseError) {
          // If we can't parse the error, fall through to generic error
        }
        throw new Error(`Request failed: ${errorText}`);
      } else {
        throw new Error(`Failed to generate lip sync video: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log("✅ Tavus Video API Response:", data);
    
    // Update database record with video ID
    if (audioFileRecord && data.video_id) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          video_id: data.video_id,
          metadata: {
            ...audioFileRecord.metadata,
            video_id: data.video_id,
            api_response: data,
            response_timestamp: new Date().toISOString(),
            generation_started: true
          }
        });
        console.log('✅ Updated audio file record with video ID:', data.video_id);
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record (non-critical):', dbError);
      }
    }
    
    return data;
  } catch (error) {
    console.error("❌ Error in generateTavusLipSyncVideo:", error);
    
    // Update database record with error status
    if (audioFileRecord) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          status: 'failed',
          metadata: {
            ...audioFileRecord.metadata,
            error: error instanceof Error ? error.message : 'Unknown error',
            error_timestamp: new Date().toISOString()
          }
        });
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record with error (non-critical):', dbError);
      }
    }
    
    // Provide more specific error messages for common network issues
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error("Unable to connect to the Tavus video service. Please check your internet connection and try again.");
    }
    
    throw error;
  }
};

export const getTavusVideoStatus = async (
  token: string,
  videoId: string,
  updateDatabase: boolean = true
): Promise<TavusVideoResponse> => {
  try {
    const response = await fetch(`https://tavusapi.com/v2/videos/${videoId}`, {
      method: "GET",
      headers: {
        "x-api-key": token.trim(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error getting video status:", errorText);
      throw new Error(`Failed to get video status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("📊 Video status response:", data);
    
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
              video_generation_completed: true
            }
          });
          console.log('✅ Updated audio file record with completion data');
        }
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record with completion data (non-critical):', dbError);
      }
    }
    
    return data;
  } catch (error) {
    console.error("❌ Error getting video status:", error);
    throw error;
  }
};