
export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  image?: string | null;
  isLoading?: boolean;
  isError?: boolean;
  retryRequest?: () => void;
  feedback?: 'up' | 'down';
  suggestions?: string[];
  sources?: { uri: string; title: string; }[];
}
