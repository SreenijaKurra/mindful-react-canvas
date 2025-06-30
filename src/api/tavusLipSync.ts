import { settingsAtom } from "@/store/settings";
import { getDefaultStore } from "jotai";
import { audioFileService } from "@/lib/supabase";
import { generateElevenLabsAudio } from "./elevenLabsTTS";

interface TavusLipSyncResponse {
  lipsync_id: string;
  lipsync_url?: string;
  status: string;
  download_url?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
}

export const generateTavusLipSyncVideo = async (
  token: string,
  text: string,
  userName?: string
): Promise<TavusLipSyncResponse> => {
  // Validate token before making API call
  if (!token || token.trim() === '') {
    throw new Error("API token is required. Please enter a valid Tavus API key in settings.");
  }
  
  // Get settings from Jotai store
  const settings = getDefaultStore().get(settingsAtom);
  
  console.log('🎬 Creating Tavus lip sync video with text:', text);
  
  // Create initial database record
  let audioFileRecord;
  try {
    audioFileRecord = await audioFileService.create({
      user_name: userName,
      message_text: text,
      audio_type: 'tavus_video',
      status: 'pending',
      metadata: {
        api_endpoint: "https://tavusapi.com/v2/lipsync",
        request_timestamp: new Date().toISOString(),
        text_length: text.length,
        original_text: text,
        step: 'generating_audio'
      }
    });
    console.log('✅ Created Tavus lip sync record:', audioFileRecord.id);
  } catch (dbError) {
    console.warn('⚠️ Failed to create database record (non-critical):', dbError);
  }
  
  try {
    // Step 1: Generate audio using ElevenLabs
    console.log('🎵 Step 1: Generating audio with ElevenLabs...');
    const sourceAudioUrl = await generateElevenLabsAudio(text, userName);
    console.log('✅ Audio generated:', sourceAudioUrl);
    
    // Update database record with audio URL
    if (audioFileRecord) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          audio_url: sourceAudioUrl,
          metadata: {
            ...audioFileRecord.metadata,
            source_audio_url: sourceAudioUrl,
            audio_generation_completed: new Date().toISOString(),
            step: 'creating_lipsync'
          }
        });
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record (non-critical):', dbError);
      }
    }
    
    // Step 2: Create lip sync video using Tavus v2/lipsync API
    console.log('🎬 Step 2: Creating lip sync video...');
    
    const payload = {
      original_video_url: "https://cdn.replica.tavus.io/20283/9de1f64e.mp4", // Default video from your example
      source_audio_url: sourceAudioUrl,
      lipsync_name: `Neuro - ${new Date().toISOString()}`
    };
    
    console.log('📤 Sending payload to Tavus lip sync API:', payload);
    
    const response = await fetch("https://tavusapi.com/v2/lipsync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": token.trim(),
      },
      body: JSON.stringify(payload),
    });

    if (!response?.ok) {
      const errorText = await response.text();
      console.error("❌ Tavus Lip Sync API Error Response:", errorText);
      
      if (response.status === 401) {
        throw new Error("Invalid API token. Please check your Tavus API key in settings and ensure it's correct.");
      } else if (response.status === 403) {
        throw new Error("Access forbidden. Please verify your API key has the necessary permissions.");
      } else if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message?.includes("concurrent") || errorData.message?.includes("maximum")) {
            throw new Error("You have reached the maximum number of active lip sync generations. Please wait for current videos to complete or try again in a few minutes.");
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
    console.log("✅ Tavus Lip Sync API Response:", data);
    
    // Update database record with lip sync ID
    if (audioFileRecord && data.lipsync_id) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          video_id: data.lipsync_id,
          metadata: {
            ...audioFileRecord.metadata,
            lipsync_id: data.lipsync_id,
            api_response: data,
            response_timestamp: new Date().toISOString(),
            lipsync_generation_started: true,
            step: 'processing_lipsync'
          }
        });
        console.log('✅ Updated record with lip sync ID:', data.lipsync_id);
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record (non-critical):', dbError);
      }
    }
    
    return {
      lipsync_id: data.lipsync_id,
      status: data.status || 'processing',
      lipsync_url: data.lipsync_url,
      download_url: data.download_url,
      duration_seconds: data.duration_seconds,
      file_size_bytes: data.file_size_bytes
    };
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
            error_timestamp: new Date().toISOString(),
            step: 'failed'
          }
        });
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record with error (non-critical):', dbError);
      }
    }
    
    // Provide more specific error messages for common network issues
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error("Unable to connect to the Tavus lip sync service. Please check your internet connection and try again.");
    }
    
    throw error;
  }
};

export const getTavusLipSyncStatus = async (
  token: string,
  lipsyncId: string,
  updateDatabase: boolean = true
): Promise<TavusLipSyncResponse> => {
  try {
    const response = await fetch(`https://tavusapi.com/v2/lipsync/${lipsyncId}`, {
      method: "GET",
      headers: {
        "x-api-key": token.trim(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error getting lip sync status:", errorText);
      throw new Error(`Failed to get lip sync status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("📊 Lip sync status response:", data);
    
    // Map the response to our expected format
    const mappedResponse: TavusLipSyncResponse = {
      lipsync_id: data.lipsync_id || lipsyncId,
      status: data.status,
      lipsync_url: data.lipsync_url || data.video_url, // Handle both possible field names
      download_url: data.download_url,
      duration_seconds: data.duration_seconds,
      file_size_bytes: data.file_size_bytes
    };
    
    console.log("📊 Mapped lip sync response:", mappedResponse);
    
    // Update database record if lip sync is completed
    if (updateDatabase && mappedResponse.status === 'completed' && mappedResponse.lipsync_url) {
      try {
        const audioFile = await audioFileService.getByVideoId(lipsyncId);
        if (audioFile) {
          await audioFileService.update(audioFile.id, {
            status: 'completed',
            audio_url: mappedResponse.lipsync_url, // Store the final video URL
            duration_seconds: mappedResponse.duration_seconds,
            file_size_bytes: mappedResponse.file_size_bytes,
            metadata: {
              ...audioFile.metadata,
              completion_timestamp: new Date().toISOString(),
              final_status_response: mappedResponse,
              lipsync_generation_completed: true,
              final_video_url: mappedResponse.lipsync_url,
              download_url: mappedResponse.download_url,
              step: 'completed'
            }
          });
          console.log('✅ Updated record with completion data');
        }
      } catch (dbError) {
        console.warn('⚠️ Failed to update database record with completion data (non-critical):', dbError);
      }
    }
    
    return mappedResponse;
  } catch (error) {
    console.error("❌ Error getting lip sync status:", error);
    throw error;
  }
};