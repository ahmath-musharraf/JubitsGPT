export type Role = 'user' | 'model';

export type GenerationMode = 'chat' | 'image' | 'video' | 'code';

export interface Attachment {
  type: 'image' | 'file' | 'video';
  mimeType: string;
  data: string; // base64 string
  name: string;
  url?: string; // object URL for preview
  size?: number;
  lastModified?: number;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  isError?: boolean;
  attachments?: Attachment[];
  isSummarizing?: boolean;
  summary?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface ThemeConfig {
  primary: string;
  background: string;
}