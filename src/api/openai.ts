import { audioFileService } from "@/lib/supabase";

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
  };
}

export const generateAIResponse = async (userMessage: string, userName?: string): Promise<string> => {
  const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!API_KEY || API_KEY === 'your-openai-api-key' || API_KEY === 'sk-your-openai-api-key' || API_KEY.includes('*') || API_KEY.length < 20) {
    console.error('❌ OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file');
    throw new Error('OpenAI API key not configured or invalid. Please add a valid API key to your .env file.\n\nSteps to fix:\n1. Go to https://platform.openai.com/api-keys\n2. Create a new API key\n3. Copy the key to your .env file as VITE_OPENAI_API_KEY=sk-proj-your-actual-key\n4. Restart your development server');
  }

  // Validate API key format
  if (!API_KEY.startsWith('sk-') || API_KEY.includes('*')) {
    console.error('❌ Invalid OpenAI API key format. Key should start with "sk-"');
    throw new Error('Invalid OpenAI API key format. Please ensure your key:\n1. Starts with "sk-"\n2. Does not contain asterisks (*)\n3. Is a real key from https://platform.openai.com/api-keys\n4. Has been copied completely without truncation');
  }
  
  // Create initial database record for AI text generation
  let audioFileRecord;
  try {
    audioFileRecord = await audioFileService.create({
      user_name: userName,
      message_text: userMessage,
      audio_type: 'ai_text_generation',
      status: 'pending',
      metadata: {
        api_endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-3.5-turbo",
        request_timestamp: new Date().toISOString(),
        user_message: userMessage,
        system_prompt_used: true
      }
    });
    console.log('✅ Created AI text generation record:', audioFileRecord.id);
  } catch (dbError) {
    console.warn('⚠️ Failed to create AI text generation database record (non-critical):', dbError);
  }
  
  const systemPrompt = `You are a compassionate AI meditation guide and wellness coach named Danny. Your role is to:

1. Provide personalized meditation guidance and mindfulness techniques
2. Offer emotional support and stress relief strategies  
3. Suggest breathing exercises, body scans, and relaxation methods
4. Help users develop a consistent meditation practice
5. Address anxiety, stress, sleep issues, and emotional challenges with empathy

Keep responses:
- Warm, supportive, and non-judgmental
- Practical with actionable advice
- Concise but thorough (2-4 sentences typically)
- Focused on mindfulness and wellness
- Encouraging without being overly enthusiastic

${userName ? `The user's name is ${userName}.` : ''}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      
      if (response.status === 401) {
        throw new Error(`OpenAI API authentication failed (401). Please check your API key is valid and has sufficient credits. Get a new key from: https://platform.openai.com/api-keys`);
      } else if (response.status === 429) {
        throw new Error(`OpenAI API rate limit exceeded (429). Please wait a moment and try again, or upgrade your plan.`);
      } else if (response.status === 403) {
        throw new Error(`OpenAI API access forbidden (403). Please check your API key permissions and billing status.`);
      } else {
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }
    }

    const data: OpenAIResponse = await response.json();
    const responseText = data.choices[0]?.message?.content || "I'm here to help with your meditation practice. Could you tell me more about what you're looking for today?";
    
    // Update database record with successful response
    if (audioFileRecord) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          status: 'completed',
          metadata: {
            ...audioFileRecord.metadata,
            response_text: responseText,
            completion_timestamp: new Date().toISOString(),
            tokens_used: data.usage?.total_tokens || 0,
            response_length: responseText.length,
            model_used: 'gpt-3.5-turbo'
          }
        });
        console.log('✅ Updated AI text generation record with completion');
      } catch (dbError) {
        console.warn('⚠️ Failed to update AI text generation database record (non-critical):', dbError);
      }
    }
    
    return responseText;
    
  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error);
    
    // Update database record with error
    if (audioFileRecord) {
      try {
        await audioFileService.update(audioFileRecord.id, {
          status: 'failed',
          metadata: {
            ...audioFileRecord.metadata,
            error: error instanceof Error ? error.message : 'Unknown error',
            error_timestamp: new Date().toISOString(),
            fallback_used: true
          }
        });
      } catch (dbError) {
        console.warn('⚠️ Failed to update AI text generation database record with error (non-critical):', dbError);
      }
    }
    
    // Fallback responses for common topics
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
      return "I understand you're feeling stressed. Let's try a simple breathing exercise: breathe in for 4 counts, hold for 4, then breathe out for 6. This can help activate your body's relaxation response.";
    }
    
    if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired')) {
      return "Sleep challenges can be really difficult. Try a body scan meditation before bed - start at your toes and slowly relax each part of your body as you work your way up. This helps signal to your mind that it's time to rest.";
    }
    
    if (lowerMessage.includes('meditation') || lowerMessage.includes('mindfulness')) {
      return "Meditation is a wonderful practice! Start with just 5 minutes a day focusing on your breath. When your mind wanders (and it will), gently bring your attention back to breathing. Consistency matters more than duration.";
    }
    
    return "I'm here to support your wellness journey. What aspect of meditation or mindfulness would you like to explore today?";
  }
};