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
  const nameMatch = response.match(/\*\*(.*?)\*\*/);
  const iconMatch = response.match(/\*-(.*?)-\*/);
  const descriptionMatch = response.match(/\*\+(.*?)\+\*/);

  return {
    conversation_name: nameMatch ? nameMatch[1] : '',
    icon: iconMatch ? iconMatch[1] : '',
    description: descriptionMatch ? descriptionMatch[1] : '',
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
    console.log('data', data);
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
1. A short, relevant conversation name
2. An appropriate emoji icon
3. A brief description of the conversation topic

Format your response exactly like this:
**Conversation Name**
*-🔍-*
*+Description+*`;

    const parts: Part[] = [{ text: greetingPrompt }];
    const requestBody: GeminiRequest = { contents: [{ parts }] };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    console.log('response AAA', responseData);
    console.log('message', message);
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
