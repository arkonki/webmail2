import { Email, Label, UserFolder, Conversation, User, AppSettings, Contact, ContactGroup, SystemFolder, SystemLabel, Mailbox } from '../types';

export const mockUser: User = {
    id: 'user-1',
    email: 'dev@example.com',
    name: 'Dev User'
};

export const mockLabels: Label[] = [
    { id: 'label-1', name: 'Work', color: '#3498db', order: 0 },
    { id: 'label-2', name: 'Personal', color: '#2ecc71', order: 1 },
    { id: 'label-3', name: 'Receipts', color: '#f1c40f', order: 2 },
    { id: 'label-4', name: 'Travel', color: '#e67e22', order: 3 },
];

export const mockUserFolders: UserFolder[] = [
    { id: 'folder-1', name: 'Projects', order: 0 },
    { id: 'folder-2', name: 'Project Alpha', parentId: 'folder-1', order: 0 },
    { id: 'folder-3', name: 'Project Beta', parentId: 'folder-1', order: 1 },
    { id: 'folder-4', name: 'Family', order: 1 },
];

export const mockMailboxes: Mailbox[] = [
    { path: 'INBOX', name: 'Inbox', specialUse: '\\Inbox', delimiter: '/' },
    { path: 'Sent', name: 'Sent', specialUse: '\\Sent', delimiter: '/' },
    { path: 'Drafts', name: 'Drafts', specialUse: '\\Drafts', delimiter: '/' },
    { path: 'Spam', name: 'Spam', specialUse: '\\Junk', delimiter: '/' },
    { path: 'Trash', name: 'Trash', specialUse: '\\Trash', delimiter: '/' },
    { path: 'Archive', name: 'Archive', specialUse: '\\Archive', delimiter: '/' },
    { path: 'Projects', name: 'Projects', delimiter: '/' },
    { path: 'Projects/Project Alpha', name: 'Project Alpha', delimiter: '/' },
    { path: 'Projects/Project Beta', name: 'Project Beta', delimiter: '/' },
    { path: 'Family', name: 'Family', delimiter: '/' },
];


export const mockEmails: Email[] = [
    {
        id: 'email-1',
        conversationId: 'conv-1',
        senderName: 'GitHub',
        senderEmail: 'noreply@github.com',
        recipientEmail: 'dev@example.com',
        subject: '[Webmail] Your build has succeeded',
        body: `<p>Hey Dev User,</p><p>Great news! Your recent push to the main branch of <strong>webmail-client</strong> has passed all checks and the build was successful.</p><p>You can view the deployment preview <a href="#">here</a>.</p><p>Thanks,<br>The GitHub Team</p>`,
        snippet: 'Great news! Your recent push to the main branch of webmail-client has passed all checks...',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        isRead: false,
        folderId: 'INBOX',
        labelIds: ['label-1'],
    },
    {
        id: 'email-2',
        conversationId: 'conv-2',
        senderName: 'Jane Doe',
        senderEmail: 'jane.doe@example.com',
        recipientEmail: 'dev@example.com',
        subject: 'Lunch tomorrow?',
        body: `<p>Hi there,</p><p>Are you free for lunch tomorrow around 12:30? There's a new taco place I'd love to try out.</p><p>Let me know!</p><p>Best,<br>Jane</p>`,
        snippet: 'Are you free for lunch tomorrow around 12:30? There\'s a new taco place...',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        isRead: true,
        folderId: 'INBOX',
        labelIds: [SystemLabel.STARRED, 'label-2'],
    },
    {
        id: 'email-3',
        conversationId: 'conv-2',
        senderName: 'Dev User',
        senderEmail: 'dev@example.com',
        recipientEmail: 'jane.doe@example.com',
        subject: 'Re: Lunch tomorrow?',
        body: `<p>That sounds great! 12:30 works for me. See you then!</p>`,
        snippet: 'That sounds great! 12:30 works for me. See you then!',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        isRead: true,
        folderId: 'INBOX',
        labelIds: [SystemLabel.STARRED, 'label-2'],
    },
     {
        id: 'email-4',
        conversationId: 'conv-3',
        senderName: 'Amazon',
        senderEmail: 'orders@amazon.com',
        recipientEmail: 'dev@example.com',
        subject: 'Your Amazon.com order of "Pro Git" has shipped!',
        body: `<p>Hello Dev User,</p><p>We're happy to let you know that your order has shipped.</p><p><strong>Order Details:</strong><br>Order #123-4567890-1234567</p><p>You can track your package <a href="#">here</a>.</p>`,
        snippet: 'We\'re happy to let you know that your order has shipped.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        isRead: true,
        folderId: 'INBOX',
        labelIds: ['label-3'],
        attachments: [
            { fileName: 'invoice.pdf', fileSize: 124000, mimeType: 'application/pdf' }
        ]
    },
    {
        id: 'email-5',
        conversationId: 'conv-4',
        senderName: 'Project Alpha Team',
        senderEmail: 'alpha@example.com',
        recipientEmail: 'dev@example.com',
        subject: 'Weekly Sync Notes',
        body: `<p>Team,</p><p>Attached are the notes from our weekly sync meeting. Please review the action items and update your progress by EOD Friday.</p>`,
        snippet: 'Attached are the notes from our weekly sync meeting. Please review the action items...',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        isRead: true,
        folderId: 'Projects/Project Alpha',
        labelIds: ['label-1'],
    },
    {
        id: 'email-6',
        conversationId: 'conv-5',
        senderName: 'Dev User',
        senderEmail: 'dev@example.com',
        recipientEmail: 'mom@example.com',
        subject: 'Trip photos',
        body: `<p>Hi Mom,</p><p>Here are some photos from my recent trip. Hope you enjoy them!</p><p>Love,<br>Dev</p>`,
        snippet: 'Here are some photos from my recent trip. Hope you enjoy them!',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        isRead: true,
        folderId: 'Sent',
        labelIds: [],
    },
    {
        id: 'email-7',
        conversationId: 'conv-6',
        senderName: 'Marketing Newsletter',
        senderEmail: 'newsletter@example.com',
        recipientEmail: 'dev@example.com',
        subject: '🔥 Don\'t Miss Out on Our Summer Sale!',
        body: `<p>Our biggest sale of the year is here! Get up to 50% off on all items. <a href="#">Shop now!</a></p><p>To unsubscribe, <a href="#">click here</a>.</p>`,
        snippet: 'Our biggest sale of the year is here! Get up to 50% off on all items.',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        isRead: true,
        folderId: 'INBOX',
        labelIds: [],
    },
];

export const mockContacts: Contact[] = [
    { id: 'contact-1', name: 'Jane Doe', email: 'jane.doe@example.com', phone: '123-456-7890', company: 'Example Inc.' },
    { id: 'contact-2', name: 'John Smith', email: 'john.smith@example.com', phone: '098-765-4321', company: 'Example Inc.' },
    { id: 'contact-3', name: 'Mom', email: 'mom@example.com' },
];

export const mockContactGroups: ContactGroup[] = [
    { id: 'group-1', name: 'Coworkers', contactIds: ['contact-1', 'contact-2'] },
    { id: 'group-2', name: 'Family', contactIds: ['contact-3'] },
];

export const mockAppSettings: AppSettings = {
  identities: [
      { id: 'identity-1', name: 'Dev User', email: 'dev@example.com', accountType: 'personal' }
  ],
  signature: { isEnabled: true, body: '--<br><b>Dev User</b><br>Frontend Engineer' },
  autoResponder: { isEnabled: false, subject: '', message: '' },
  rules: [],
  sendDelay: { isEnabled: true, duration: 5 },
  notifications: { enabled: false },
  conversationView: true,
  blockExternalImages: true,
  templates: [
      { id: 'template-1', name: 'Bug Report', body: '<p><b>Issue:</b></p><p><br></p><p><b>Steps to Reproduce:</b></p>' }
  ],
  displayDensity: 'comfortable',
  folderMappings: {},
};
