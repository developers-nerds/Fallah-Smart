interface Part {
  text: string;
}

interface GeminiRequest {
  contents: { parts: Part[] }[];
}

interface ConversationData {
  conversation_name: string;
  icon: string;
  description: string;
}
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = process.env.EXPO_PUBLIC_API_KEY;
const header = { 'Content-Type': 'application/json' };

const parseAIResponse = (response: string): ConversationData => {
  // Primary extraction patterns
  const nameMatch = response.match(/\*\*(.*?)\*\*/);
  const iconMatch = response.match(/\*-(.*?)-\*/);
  let descriptionMatch = response.match(/\*\+(.*?)\+\*/s);

  // Fallback methods if primary patterns don't match
  if (!descriptionMatch) {
    // Try multiple alternative patterns that might appear in responses
    const patterns = [
      /Description:\s*(.*?)(?:\n|$)/s,
      /\d+\.\s*Description:\s*(.*?)(?:\n|$)/s,
      /description:\s*(.*?)(?:\n|$)/s,
      /\+\*(.*?)\*\+/s, // Reversed format that might occur
    ];

    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match) {
        descriptionMatch = match;
        break;
      }
    }
  }

  // Extract content from the first message if no description is found
  if (!descriptionMatch && response.length > 0) {
    // Use the first sentence (up to 100 chars) as a fallback description
    const firstSentence = response.split(/[.!?]/, 1)[0];
    if (firstSentence && firstSentence.length > 0) {
      descriptionMatch = [firstSentence, firstSentence.substring(0, 100)];
    }
  }

  return {
    conversation_name: nameMatch ? nameMatch[1].trim() : 'New Conversation',
    icon: iconMatch ? iconMatch[1].trim() : '💬',
    description: descriptionMatch ? descriptionMatch[1].trim() : 'A new conversation',
  };
};

export const createConversationInDB = async (conversationData: ConversationData, token: string) => {
  try {
    const response = await fetch(`${BASE_URL}/conversations/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(conversationData),
    });

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error };
  }
};

export const GetConversationName = async (
  message: string
): Promise<{ success: boolean; text: string; parsedData?: ConversationData }> => {
  try {
    const greetingPrompt = `You are a conversation naming assistant. Your task is to analyze the following user message and create a conversation name and description.

User Message: "${message}"

Please generate:
1. A short, relevant conversation name (max 30 characters)
2. An appropriate emoji icon
3. A brief description of the conversation topic (max 100 characters)

Format your response EXACTLY like this example:
**Health Advice**
*-🩺-*
*+Questions about maintaining a healthy lifestyle+*

Make sure to include the exact formatting with asterisks as shown above:
- Name between double asterisks: **Name**
- Icon between asterisks and hyphens: *-Icon-*
- Description between asterisks and plus signs: *+Description+*`;

    const parts: Part[] = [{ text: greetingPrompt }];
    const requestBody: GeminiRequest = { contents: [{ parts }] };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    const aiResponseText =
      responseData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Hey, no response came through—let's try that again!";

    const parsedData = parseAIResponse(aiResponseText);

    return { success: true, text: aiResponseText, parsedData };
  } catch (error) {
    console.error('Error sending greeting:', error);
    return { success: false, text: "Whoops, the barn door's stuck—can't greet you right now!" };
  }
};
