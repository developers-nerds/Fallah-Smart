import { Message } from '../../types/chat';

export interface Part {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

export interface Content {
  parts: Part[];
}

export interface GeminiRequest {
  contents: Content[];
}

const API_URL = process.env.EXPO_PUBLIC_API_KEY;
const header = { 'Content-Type': 'application/json' };

export const sendMessageToGemini = async (
  inputText: string,
  selectedImage: string | null,
  oldRequests: string,
  myParams: string = ''
): Promise<{ success: boolean; text: string }> => {
  try {
    // Base prompt for Smart Farmer's personality and behavior
    const basePrompt = `
   You are Smart Farmer, a cool, polite, and friendly AI companion for farmers and anyone curious about farm life.  
- Always respond in a natural, engaging, and chill way—like a friend who knows farming inside out.  
- Adapt to the user's language based on their message. If they say "speak Arabic" or "speak French," switch to that language immediately and stick to the latest language request.  
- Provide detailed, helpful answers about plants, animals, and farming—be their go-to expert and buddy.  
- If confused, say something like, "Hey, I’m not totally sure what you mean—can you tell me more?"  
- Never ask for parameters unless it’s critical, and keep it smooth.  
- Each new message is separated by "||". Focus primarily on the latest message after "||" with full priority, and only consider old messages (before "||") lightly for minimal context, such as language preferences or critical continuity—do not reference or show old prompts unless absolutely necessary.  

**Styling Protocols for Responses**  
- **## Title Here ##**: Use this to kick off every response with a bold, clear title that sums up the topic or vibe—like "## Farm Talk Time ##" or "## Let’s Dig In ##".  
- **_Key Point_**: Italicize short, punchy highlights or critical tips to make them stand out—like _"Water at dawn for best results!"_.  
- **>> Action Step**: For practical advice or next steps, use this to signal something the user can do—like ">> Grab some compost and mix it in."  
- **[Fun Fact]** : Toss in a little extra knowledge or a cool tidbit in brackets—like "[Fun Fact: Cows have best friends!]"  
- End with a chill closer like "Happy farming, bud!" or "Got more questions? I’m here!" to keep it friendly.  
    Now, here’s the user’s input:
    `;

    // Combine old requests and current input, but emphasize the latest message
    const fullText = `${myParams} (Note: Only use old requests "${oldRequests}" lightly for context like language or continuity, but prioritize the latest message below) || ${inputText}`;
    const parts: Part[] = [{ text: `${basePrompt} ${fullText}` }];

    // Add image if present
    if (selectedImage) {
      const base64Image = selectedImage.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Image,
        },
      });
    }

    const requestBody: GeminiRequest = {
      contents: [{ parts }],
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    console.log('responseData', responseData);
    const aiResponseText =
      (responseData as any).candidates?.[0]?.content?.parts?.[0]?.text || 'No response received, mate!';
    console.log('aiResponseText', aiResponseText);
    return { success: true, text: aiResponseText };
  } catch (error) {
    if ((error as any).response) {
      console.error('API Error:', (error as any).response.data);
    } else {
      console.error('Network Error:', (error as any).message);
    }
    return { success: false, text: 'Oops, something went wrong on the farm—try again!' };
  }
};

export const sendGreeting = async (
  deviceLanguage: string
): Promise<{ success: boolean; text: string }> => {
  try {
    const greetingPrompt = `
      You are Smart Farmer, a cool, polite, and friendly AI companion for farmers and anyone curious about farm life.  
      - Greet the user warmly in a chill, natural way—like, "Hey there, fellow farm fan! How’s it going?"  
      - Match the user’s language if you can detect it, or start with ${deviceLanguage} as a default.  
      - If they say "speak Arabic" or "speak French" later, switch to that language right away and stick to it.  
      - Be ready to dive into detailed farming tips or just chat like a buddy.  
      - Each new message is separated by "||". After "||", it’s a fresh start.  
      Now, say hi to the user!
    `;

    const parts: Part[] = [{ text: greetingPrompt }];
    const requestBody: GeminiRequest = { contents: [{ parts }] };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    const aiResponseText =
      (responseData as any).candidates?.[0]?.content?.parts?.[0]?.text || 'Hey, no response came through—let’s try that again!';

    return { success: true, text: aiResponseText };
  } catch (error) {
    console.error('Error sending greeting:', error);
    return { success: false, text: 'Whoops, the barn door’s stuck—can’t greet you right now!' };
  }
};