
export enum SystemFolder {
  INBOX = 'Inbox',
  SENT = 'Sent',
  DRAFTS = 'Drafts',
  SPAM = 'Spam',
  TRASH = 'Trash',
  SCHEDULED = 'Scheduled',
  ARCHIVE = 'Archive',
}
export const SYSTEM_FOLDERS = Object.values(SystemFolder);


// Labels are for tagging, Starred is a special tag
export enum SystemLabel {
  STARRED = 'Starred',
  SNOOZED = 'Snoozed',
}
export const SYSTEM_LABELS = Object.values(SystemLabel);


export enum ActionType {
  REPLY = 'reply',
  FORWARD = 'forward',
  DRAFT = 'draft',
}

export interface Attachment {
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  url?: string; // for mock content like base64 data or text URI
}

export interface Label {
  id: string;
  name:string;
  color: string;
  order: number;
}

export interface UserFolder {
  id: string;
  name: string;
  parentId?: string;
  order: number;
}

export interface FolderTreeNode extends UserFolder {
  children: FolderTreeNode[];
  level: number;
}

export interface Mailbox {
  path: string;
  name: string;
  specialUse?: string;
  delimiter: string;
}


export interface Email {
  id: string;
  conversationId: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  snippet: string;
  timestamp: string;
  isRead: boolean;
  folderId: string; // This will now be the mailbox path
  labelIds: string[];
  attachments?: Attachment[];
  scheduledSendTime?: string;
  snoozedUntil?: string;
  messageId?: string;
  backendJobId?: string;
}

export interface Conversation {
    id: string;
    subject: string;
    emails: Email[];
    participants: { name: string, email: string }[];
    lastTimestamp: string;
    isRead: boolean;
    folderId: string;
    labelIds: string[];
    isSnoozed: boolean;
    snoozedUntil?: string;
    hasAttachments: boolean;
    canUnsubscribe?: boolean;
    __originalConversationId?: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    password?: string;
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    notes?: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  contactIds: string[];
}


// Settings Types
export interface Signature {
  isEnabled: boolean;
  body: string;
}

export interface AutoResponder {
  isEnabled: boolean;
  subject: string;
  message: string;
  startDate?: string;
  endDate?: string;
}

export interface Rule {
  id: string;
  condition: {
    field: 'sender' | 'recipient' | 'subject';
    operator: 'contains';
    value: string;
  };
  action: {
    type: 'applyLabel' | 'star' | 'markAsRead' | 'moveToFolder';
    labelId?: string;
    folderId?: string;
  };
}

export interface Identity {
    id: string;
    name: string;
    email: string;
    accountType: 'personal' | 'business';
}

export interface Template {
  id: string;
  name: string;
  body: string; // HTML content
}

export type DisplayDensity = 'comfortable' | 'cozy' | 'compact';

export interface AppSettings {
  identities: Identity[];
  signature: Signature;
  autoResponder: AutoResponder;
  rules: Rule[];
  sendDelay: {
    isEnabled: boolean;
    duration: 5 | 10 | 20 | 30; // seconds
  };
  notifications: {
    enabled: boolean;
  };
  conversationView: boolean;
  blockExternalImages: boolean;
  templates: Template[];
  displayDensity: DisplayDensity;
}

export interface AppLog {
  timestamp: string;
  message: string;
  level: 'info' | 'error';
}
