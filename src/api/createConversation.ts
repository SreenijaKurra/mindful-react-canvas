import { IConversation } from "@/types";
import { settingsAtom } from "@/store/settings";
import { getDefaultStore } from "jotai";
import { sendWebhookData } from "./webhook";

export const createConversation = async (
  token: string,
): Promise<IConversation> => {
  // Validate token before making API call
  if (!token || token.trim() === '') {
    throw new Error("API token is required. Please enter a valid Tavus API key in settings.");
  }
  
  // Get settings from Jotai store
  const settings = getDefaultStore().get(settingsAtom);
  
  // Add debug logs
  console.log('Creating conversation with settings:', settings);
  console.log('Token length:', token.length);
  console.log('Token starts with:', token.substring(0, 10) + '...');
  console.log('Greeting value:', settings.greeting);
  console.log('Context value:', settings.context);
  
  // Build the context string
  let contextString = "";
  if (settings.name) {
    contextString = `You are talking with the user, ${settings.name}. Additional context: `;
  }
  contextString += settings.context || "";
  
  const payload = {
    persona_id: settings.persona || "pd43ffef",
    custom_greeting: settings.greeting !== undefined && settings.greeting !== null 
      ? settings.greeting 
      : "Hello, and welcome to your personal meditation space. I'm here as your meditation guide and wellness coach. How are you feeling today, and what would you like to explore in your practice?",
    conversational_context: contextString
  };
  
  console.log('Sending payload to API:', payload);
  
  try {
    const response = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": token.trim(),
      },
      body: JSON.stringify(payload),
    });

    if (!response?.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      
      if (response.status === 401) {
        throw new Error("Invalid API token. Please check your Tavus API key in settings and ensure it's correct.");
      } else if (response.status === 403) {
        throw new Error("Access forbidden. Please verify your API key has the necessary permissions.");
      } else {
        throw new Error(`Failed to create conversation: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log("API Response:", data);
  
    // Send session start data to webhook
    try {
      await sendWebhookData({
        event_type: "meditation_session_started",
        conversation_id: data.conversation_id,
        user_name: settings.name,
        timestamp: new Date().toISOString(),
        session_type: "guided_meditation"
      });
    } catch (webhookError) {
      console.error("Failed to send webhook data:", webhookError);
      // Don't fail the conversation creation if webhook fails
    }
    
    return data;
  } catch (error) {
    console.error("Error in createConversation:", error);
    throw error;
  }
};
