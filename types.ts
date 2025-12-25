
export interface Enquiry {
  customer_name: string;
  phone_number: string;
  email_address: string;
  product_interest?: string;
  notes?: string;
  timestamp: string;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface TranscriptionItem {
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  feedback?: 'up' | 'down';
}
