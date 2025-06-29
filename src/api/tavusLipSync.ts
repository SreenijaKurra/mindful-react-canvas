import { settingsAtom } from "@/store/settings";
import { getDefaultStore } from "jotai";

interface TavusVideoResponse {
  video_id: string;
  video_url?: string;
  status: string;
  download_url?: string;
}

export const generateTavusLipSyncVideo = async (
  token: string,
  text: string
): Promise<TavusVideoResponse> => {
  // Validate token before making API call
  if (!token || token.trim() === '') {
    throw new Error("API token is required. Please enter a valid Tavus API key in settings.");
  }
  
  // Get settings from Jotai store
  const settings = getDefaultStore().get(settingsAtom);
  
  console.log('Creating Tavus lip sync video with replica:', settings.replica);
  console.log('Text to synthesize:', text);
  
  // Use the correct Tavus API v2 format for video generation
  const payload = {
    replica_id: settings.replica || "rfb51183fe", // Danny's replica ID
    script: text
    // Remove callback_url and background_url entirely since they're causing the error
    // The API will use defaults when these fields are omitted
  };
  
  console.log('Sending payload to Tavus API:', payload);
  
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
      console.error("Tavus API Error Response:", errorText);
      
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
    console.log("Tavus Video API Response:", data);
    
    return data;
  } catch (error) {
    console.error("Error in generateTavusLipSyncVideo:", error);
    
    // Provide more specific error messages for common network issues
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error("Unable to connect to the Tavus video service. Please check your internet connection and try again.");
    }
    
    throw error;
  }
};

export const getTavusVideoStatus = async (
  token: string,
  videoId: string
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
      console.error("Error getting video status:", errorText);
      throw new Error(`Failed to get video status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Video status response:", data);
    return data;
  } catch (error) {
    console.error("Error getting video status:", error);
    throw error;
  }
};