export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  imageUrl?: string;
  sender: 'user' | 'assistant';
}
