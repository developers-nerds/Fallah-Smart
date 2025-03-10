/**
 * Utility functions for handling conversations in the chat interface
 */

/**
 * Interface representing a conversation in the chat
 */
export interface Conversation {
  id: string;
  title: string;
  date: string;
  preview: string;
  unread: boolean;
  icon: string;
  messages: Message[];
}

/**
 * Interface representing a message in a conversation
 */
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

/**
 * Generates a random emoji icon for a new conversation
 */
const generateRandomIcon = (): string => {
  const farmingIcons = [
    '🌱',
    '🌾',
    '🍅',
    '🥕',
    '🌽',
    '🥬',
    '🍎',
    '🚜',
    '💧',
    '☀️',
    '🌿',
    '🐄',
    '🐑',
    '🐓',
  ];
  return farmingIcons[Math.floor(Math.random() * farmingIcons.length)];
};

/**
 * Generates a new conversation object with default values
 * @returns A new Conversation object
 */
export const generateNewConversation = (): Conversation => {
  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  return {
    id: `conv_${now.getTime()}`,
    title: 'New Conversation',
    date: dateString,
    preview: 'How can I help with your farming needs today?',
    unread: false,
    icon: generateRandomIcon(),
    messages: [
      {
        id: `msg_${now.getTime()}`,
        text: 'How can I help with your farming needs today?',
        sender: 'assistant',
        timestamp: now.toISOString(),
      },
    ],
  };
};

/**
 * Creates a new conversation and performs any necessary setup
 * @param callback Optional callback function to execute after creating the conversation
 * @returns The newly created conversation
 */
export const createNewConversation = (callback?: () => void): Conversation => {
  // Create a new conversation object
  const newConversation = generateNewConversation();

  // Here you would typically:
  // 1. Save the conversation to your state management or database
  // 2. Reset the current conversation state
  // 3. Navigate to the new conversation if needed

  // Execute the callback if provided
  if (callback) {
    callback();
  }

  return newConversation;
};

/**
 * Standardized function to handle creating a new conversation across components
 * @param onNewConversation Callback to handle the new conversation in parent component
 * @param additionalCallback Optional additional callback (e.g., closing sidebar)
 */
export const handleNewConversation = (
  onNewConversation?: (conversation: Conversation) => void,
  additionalCallback?: () => void
): void => {
  // Create the new conversation
  const newConversation = createNewConversation(() => {
    // Execute the additional callback if provided (e.g., closing sidebar)
    if (additionalCallback) {
      additionalCallback();
    }
  });

  // If onNewConversation callback is provided, call it with the new conversation
  if (onNewConversation) {
    onNewConversation(newConversation);
  }
};
