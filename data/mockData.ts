import { User, Label, UserFolder, Email, Contact, ContactGroup, AppSettings, SystemFolder, SystemLabel, Mailbox } from '../types';

export const mockUser: User = {
  id: 'user-1',
  email: 'jane.doe@example.com',
  name: 'Jane Doe',
};

export const mockLabels: Label[] = [
  { id: 'label-1', name: 'Receipts', color: '#3498db', order: 0 },
  { id: 'label-2', name: 'Travel', color: '#2ecc71', order: 1 },
  { id: 'label-3', name: 'Work', color: '#e74c3c', order: 2 },
];

export const mockUserFolders: UserFolder[] = [
  { id: 'folder-1', name: 'Project Alpha', order: 0 },
  { id: 'folder-2', name: 'Project Beta', parentId: 'folder-1', order: 0 },
  { id: 'folder-3', name: 'Family', order: 1 },
];

export const mockMailboxes: Mailbox[] = [
    { path: SystemFolder.INBOX, name: 'Inbox', specialUse: '\\Inbox', delimiter: '/' },
    { path: SystemFolder.SENT, name: 'Sent', specialUse: '\\Sent', delimiter: '/' },
    { path: SystemFolder.DRAFTS, name: 'Drafts', specialUse: '\\Drafts', delimiter: '/' },
    { path: SystemFolder.TRASH, name: 'Trash', specialUse: '\\Trash', delimiter: '/' },
    { path: SystemFolder.SPAM, name: 'Spam', specialUse: '\\Junk', delimiter: '/' },
    ...mockUserFolders.map(f => ({ path: f.id, name: f.name, delimiter: '/' }))
];

export const mockEmails: Email[] = [
  // Conversation 1
  {
    id: 'email-1',
    conversationId: 'conv-1',
    senderName: 'GitHub',
    senderEmail: 'noreply@github.com',
    recipientEmail: 'jane.doe@example.com',
    subject: '[github] A new vulnerability has been found',
    body: '<div><p>A new high-severity vulnerability has been found in one of your dependencies. Please review your repository security alerts.</p></div>',
    snippet: 'A new high-severity vulnerability has been found...',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isRead: false,
    folderId: SystemFolder.INBOX,
    labelIds: ['label-3'],
  },
  // Conversation 2
  {
    id: 'email-2',
    conversationId: 'conv-2',
    senderName: 'Alex Johnson',
    senderEmail: 'alex.j@example.com',
    recipientEmail: 'jane.doe@example.com',
    subject: 'Project Alpha Planning',
    body: '<div><p>Hi Jane, let\'s sync up about the Project Alpha timeline tomorrow at 10 AM. I\'ve attached the draft proposal.</p></div>',
    snippet: 'Hi Jane, let\'s sync up about the Project Alpha...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isRead: true,
    folderId: SystemFolder.INBOX,
    labelIds: [SystemLabel.STARRED, 'label-3'],
    attachments: [{ fileName: 'proposal_draft.pdf', fileSize: 1200000, mimeType: 'application/pdf' }]
  },
  {
    id: 'email-3',
    conversationId: 'conv-2',
    senderName: 'Jane Doe',
    senderEmail: 'jane.doe@example.com',
    recipientEmail: 'alex.j@example.com',
    subject: 'Re: Project Alpha Planning',
    body: '<div><p>Sounds good, Alex. I\'ll review the proposal tonight.</p><blockquote>On Tue, 23 Jul 2024 at 14:30, Alex Johnson wrote: ...</blockquote></div>',
    snippet: 'Sounds good, Alex. I\'ll review the proposal tonight.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    isRead: true,
    folderId: SystemFolder.SENT,
    labelIds: ['label-3'],
  },
  // Conversation 3
  {
    id: 'email-4',
    conversationId: 'conv-3',
    senderName: 'Vercel',
    senderEmail: 'noreply@vercel.com',
    recipientEmail: 'jane.doe@example.com',
    subject: 'Deployment successful!',
    body: '<div><p>Your latest deployment for `personal-website` is now live.</p></div>',
    snippet: 'Your latest deployment for `personal-website` is now live.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    isRead: true,
    folderId: SystemFolder.INBOX,
    labelIds: [],
  },
  // Conversation 4 (Draft)
  {
    id: 'email-5',
    conversationId: 'conv-4',
    senderName: 'Jane Doe',
    senderEmail: 'jane.doe@example.com',
    recipientEmail: 'mom@example.com',
    subject: 'Vacation Photos',
    body: '<div><p>Hi Mom, here are some photos from our trip! I\'ll upload the rest later tonight.</p></div>',
    snippet: 'Hi Mom, here are some photos from our trip!',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isRead: true,
    folderId: SystemFolder.DRAFTS,
    labelIds: [],
  },
  // Conversation 5 (Archived)
  {
    id: 'email-6',
    conversationId: 'conv-5',
    senderName: 'Amazon',
    senderEmail: 'orders@amazon.com',
    recipientEmail: 'jane.doe@example.com',
    subject: 'Your Amazon.com order of "Smart Home Hub" has shipped!',
    body: '<div><p>Your order is on its way. Estimated delivery: July 28, 2024.</p></div>',
    snippet: 'Your order is on its way. Estimated delivery: July 28, 2024.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    isRead: true,
    folderId: SystemFolder.ARCHIVE,
    labelIds: ['label-1'],
  },
   // Conversation 6 (Snoozed)
  {
    id: 'email-7',
    conversationId: 'conv-6',
    senderName: 'Airline Tickets',
    senderEmail: 'confirm@airline.com',
    recipientEmail: 'jane.doe@example.com',
    subject: 'Your flight confirmation for next week',
    body: '<div><p>Your flight to San Francisco is confirmed for August 5th.</p></div>',
    snippet: 'Your flight to San Francisco is confirmed for August 5th.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    isRead: true,
    folderId: SystemFolder.INBOX,
    labelIds: ['label-2'],
    snoozedUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString()
  },
];

export const mockContacts: Contact[] = [
  { id: 'contact-1', name: 'Alex Johnson', email: 'alex.j@example.com', phone: '555-1234', company: 'Innovate Inc.' },
  { id: 'contact-2', name: 'Maria Garcia', email: 'maria.g@example.com', phone: '555-5678', company: 'Solutions Co.' },
  { id: 'contact-3', name: 'Mom', email: 'mom@example.com', phone: '555-8765' },
];

export const mockContactGroups: ContactGroup[] = [
    { id: 'group-1', name: 'Work Colleagues', contactIds: ['contact-1', 'contact-2'] },
    { id: 'group-2', name: 'Family', contactIds: ['contact-3'] },
];

export const initialAppSettings: AppSettings = {
  identities: [],
  signature: { isEnabled: true, body: '<p>--<br><b>Jane Doe</b><br>Frontend Engineer</p>' },
  autoResponder: { isEnabled: false, subject: '', message: '' },
  rules: [],
  sendDelay: { isEnabled: true, duration: 5 },
  notifications: { enabled: false },
  conversationView: true,
  blockExternalImages: true,
  templates: [
    { id: 'template-1', name: 'Follow-up', body: '<p>Hi there,</p><p>Just following up on our previous conversation. Let me know if you have any updates!</p><p>Thanks,</p>' }
  ],
  displayDensity: 'comfortable',
  folderMappings: {},
};
