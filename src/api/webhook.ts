interface WebhookData {
  event_type: string;
  conversation_id?: string;
  user_name?: string;
  timestamp: string;
  session_type?: string;
  emotional_state?: string;
  meditation_type?: string;
  session_duration?: number;
  user_feedback?: string;
  conversation_summary?: string;
  recommendations?: string[];
  stress_level?: number;
  [key: string]: any;
}

export const sendWebhookData = async (data: WebhookData): Promise<void> => {
  const webhookUrl = "https://sreenijakurra.app.n8n.cloud/webhook/9e463f8f-0e47-41de-9373-80eabd70cd3a";
  
  try {
    const response = await Promise.race([
      fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          source: "meditation_video_interface",
          app_version: "1.0.0"
        }),
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Webhook timeout')), 5000)
      )
    ]) as Response;

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    console.log("Webhook data sent successfully:", data);
  } catch (error) {
    // Log the error but don't throw it to avoid breaking the main flow
    if (error instanceof Error && error.message === 'Webhook timeout') {
      console.warn("Webhook request timed out after 5 seconds");
    } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.warn("Webhook service unavailable - this is non-critical");
    } else {
      console.warn("Webhook notification failed:", error);
    }
    
    // Re-throw the error so the caller can decide how to handle it
    throw error;
  }
};