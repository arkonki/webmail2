
import { Contact, Email, User, Label, SystemLabel, ContactGroup, SystemFolder, UserFolder } from '../types';

export const mockUser: User = {
    id: 'user-self',
    email: 'test.user@example.com',
    name: 'Test User',
};

export const mockLabels: Label[] = [
    { id: 'label-1', name: 'Travel', color: '#3498db', order: 0 }, // Blue
    { id: 'label-2', name: 'Receipts', color: '#2ecc71', order: 1 }, // Green
    { id: 'label-3', name: 'Work', color: '#e74c3c', order: 2 }, // Red
    { id: 'label-4', name: 'Personal', color: '#f1c40f', order: 3 }, // Yellow
];

export const mockUserFolders: UserFolder[] = [
    { id: 'folder-1', name: 'Project Phoenix', order: 0 },
    { id: 'folder-3', name: 'Designs', parentId: 'folder-1', order: 0 },
    { id: 'folder-4', name: 'Reports', parentId: 'folder-1', order: 1 },
    { id: 'folder-6', name: 'Final', parentId: 'folder-4', order: 0 },
    { id: 'folder-2', name: 'Conference 2024', order: 1 },
    { id: 'folder-5', name: 'Receipts.2024', order: 2 },
    { id: 'folder-7', name: 'Travel', parentId: 'folder-5', order: 0 }
];

export const mockContacts: Contact[] = [
  { id: 'contact-1', name: 'Alex Johnson', email: 'alex.j@example.com', phone: '123-456-7890', company: 'Innovate Inc.', notes: 'Lead developer on Project Alpha.' },
  { id: 'contact-2', name: 'Jane Doe', email: 'jane.d@example.com', phone: '987-654-3210', company: 'Solutions Co.', notes: 'Met at the 2023 tech conference.' },
  { id: 'contact-3', name: 'Sarah Lee', email: 'sarah.k@example.com', company: 'Innovate Inc.' },
  { id: 'contact-4', name: 'GitHub', email: 'noreply@github.com', notes: 'Automated notifications.' },
  { id: 'contact-5', name: 'Vercel', email: 'notifications@vercel.com' },
  { id: 'contact-6', name: 'Figma', email: 'team@figma.com', company: 'Figma' },
  { id: 'contact-7', name: 'Mom', email: 'mom@example.com', phone: '555-123-4567', notes: 'Call on weekends!' },
  { id: 'user', name: mockUser.name, email: mockUser.email},
  { id: 'contact-8', name: 'Tech Weekly', email: 'newsletter@techweekly.com' },
  { id: 'contact-9', name: 'SocialNet', email: 'notification@social.net' },
  { id: 'contact-10', name: 'OnlineStore', email: 'orders@estore.com' },
  { id: 'contact-11', name: 'Chris Green', email: 'chris.g@example.com', company: 'Solutions Co.' },
  { id: 'contact-12', name: 'Marketing Team', email: 'marketing-updates@example.com' },
];

export const mockContactGroups: ContactGroup[] = [
    { id: 'group-1', name: 'Work Team', contactIds: ['contact-1', 'contact-3', 'contact-11'] },
    { id: 'group-2', name: 'Family', contactIds: ['contact-7'] },
];


const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);
const twoDaysAgo = new Date(now);
twoDaysAgo.setDate(now.getDate() - 2);
const threeDaysAgo = new Date(now);
threeDaysAgo.setDate(now.getDate() - 3);
const fourDaysAgo = new Date(now);
fourDaysAgo.setDate(now.getDate() - 4);
const fiveDaysAgo = new Date(now);
fiveDaysAgo.setDate(now.getDate() - 5);
const nextWeek = new Date(now);
nextWeek.setDate(now.getDate() + 7);


export const mockEmails: Email[] = [
    // --- Conversation 1: Design Feedback ---
    {
        id: 'email-1',
        conversationId: 'conv-1',
        senderName: 'Sarah Lee',
        senderEmail: 'sarah.k@example.com',
        recipientEmail: mockUser.email,
        subject: 'Re: Design Feedback',
        body: `<p>Thanks, ${mockUser.name}!</p><p>I've attached the updated mockups with the changes we discussed. Let me know your thoughts!</p><p>Best,<br>Sarah</p>`,
        snippet: "Thanks, Test! I've attached the updated mockups...",
        timestamp: now.toISOString(),
        isRead: false,
        folderId: 'folder-3', // Project Phoenix/Designs
        labelIds: [SystemLabel.STARRED, 'label-3'],
        attachments: [{ fileName: 'dashboard-mockup.png', fileSize: 120000, mimeType: 'image/png', url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADTSURBVHhe7c1BDQAgDMAwcs9/yE4GR4s3I+Q8fD2AABAIEEAgAQSCRwAAgkAEAgQQSCABAIEAEggQQSCABBIJEAAACiQAQCBBBIIGAAAQCBBBIIGAkAQCABBIIMEAEAgAQSCCAgAEAkgAQSCCBAIAAIAgAQSCCBAAAEAggQQSCABAIEAEggQQSCABBIJAIAAIAgkAEAgQQSAABAIEAEAgQQCCQSAAAAEggAQSCCAAABAIEEAggQSCAgAEAkgAQSCCBAIAAIAgAQSCCBAAAEAggQQSCABAIEAEggQQSCACQ1gBVCwJgjzL8AAAAAElFTkSuQmCC' }],
        messageId: '<conv-1-email-1-sarah@mail.example.com>',
    },
    {
        id: 'email-2',
        conversationId: 'conv-1',
        senderName: mockUser.name,
        senderEmail: mockUser.email,
        recipientEmail: 'sarah.k@example.com',
        subject: 'Re: Design Feedback',
        body: `<p>Hi Sarah,</p><p>Looks great! Just one minor suggestion: can we try a slightly darker shade for the primary button?</p><p>Thanks,<br>${mockUser.name}</p>`,
        snippet: 'Looks great! Just one minor suggestion...',
        timestamp: new Date(now.getTime() - 10 * 60000).toISOString(),
        isRead: true,
        folderId: SystemFolder.SENT,
        labelIds: ['label-3'],
        messageId: '<conv-1-email-2-user@mail.example.com>',
    },
     {
        id: 'email-3',
        conversationId: 'conv-1',
        senderName: 'Sarah Lee',
        senderEmail: 'sarah.k@example.com',
        recipientEmail: mockUser.email,
        subject: 'Design Feedback',
        body: `<p>Hi team,</p><p>Here are the initial designs for the new dashboard. Please send any feedback by EOD tomorrow.</p>`,
        snippet: 'Here are the initial designs for the new dashboard...',
        timestamp: new Date(now.getTime() - 20 * 60000).toISOString(),
        isRead: true,
        folderId: 'folder-3', // Project Phoenix/Designs
        labelIds: ['label-3'],
        messageId: '<conv-1-email-3-sarah-initial@mail.example.com>',
    },

    // --- Conversation 2: GitHub Notification ---
    {
        id: 'email-4',
        conversationId: 'conv-2',
        senderName: 'GitHub',
        senderEmail: 'noreply@github.com',
        recipientEmail: mockUser.email,
        subject: '[GitHub] Your build has failed',
        body: `<p>The build for your repository <strong>'webmail-client'</strong> has failed.</p><p>Please check the logs for more details.</p>`,
        snippet: 'The build for your repository has failed...',
        timestamp: yesterday.toISOString(),
        isRead: false,
        folderId: SystemFolder.INBOX,
        labelIds: [],
        messageId: '<github-build-failed-12345@github.com>',
    },
    
    // --- Conversation 3: Travel Plans (in a user folder) ---
    {
        id: 'email-5',
        conversationId: 'conv-3',
        senderName: 'Alex Johnson',
        senderEmail: 'alex.j@example.com',
        recipientEmail: mockUser.email,
        subject: 'Travel Plans',
        body: `<p>Hey!</p><p>Just confirming my flight details for the conference. I land at 10:30 AM on the 15th.</p><p>I've attached the itinerary.</p><p>See you there!</p>`,
        snippet: 'Just confirming my flight details for the conference...',
        timestamp: twoDaysAgo.toISOString(),
        isRead: true,
        folderId: 'folder-2', // In "Conference 2024" folder
        labelIds: ['label-1'],
        attachments: [{ fileName: 'itinerary.txt', fileSize: 120, mimeType: 'text/plain', url: `data:text/plain;charset=utf-8,** Travel Itinerary for Conference 2024 **%0A%0AFlight: AC789%0ADeparture: 8:00 AM%0AArrival: 10:30 AM%0A%0AHotel: Downtown Convention Hotel%0ACheck-in: After 3:00 PM` }],
        messageId: '<travel-plans-alex-5678@example.com>',
    },

    // --- Sent Email (No Reply Yet) ---
    {
        id: 'email-6',
        conversationId: 'conv-4',
        senderName: mockUser.name,
        senderEmail: mockUser.email,
        recipientEmail: 'jane.d@example.com',
        subject: 'Project Alpha Update',
        body: `<p>Hi Jane,</p><p>Just wanted to give you a quick update on Project Alpha. We are on track to meet the Q3 deadline.</p><p>I'll send a more detailed report next week.</p>`,
        snippet: "Just wanted to give you a quick update on Project Alpha...",
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60000).toISOString(),
        isRead: true,
        folderId: SystemFolder.SENT,
        labelIds: [],
        messageId: '<project-alpha-update-91011@example.com>',
    },

    // --- Spam Email ---
    {
        id: 'email-7',
        conversationId: 'conv-5',
        senderName: 'Super Deals',
        senderEmail: 'deals@spam-central.com',
        recipientEmail: mockUser.email,
        subject: 'You have won a prize!',
        body: `<p>Click here to claim your exclusive prize! Limited time offer!</p><p><small>No longer interested? <a href="#">Unsubscribe</a>.</small></p>`,
        snippet: 'Click here to claim your exclusive prize!',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60000).toISOString(),
        isRead: true,
        folderId: SystemFolder.SPAM,
        labelIds: [],
        messageId: '<spam-deal-121314@spam-central.com>',
    },

     // --- Draft Email ---
    {
        id: 'email-8',
        conversationId: 'conv-6',
        senderName: mockUser.name,
        senderEmail: mockUser.email,
        recipientEmail: 'mom@example.com',
        subject: 'Weekend plans',
        body: `<p>Hi Mom,</p><p>Are we still on for dinner this Saturday?`,
        snippet: 'Are we still on for dinner this Saturday?',
        timestamp: new Date().toISOString(),
        isRead: true,
        folderId: SystemFolder.DRAFTS,
        labelIds: [],
        messageId: '<draft-weekend-plans-151617@example.com>',
    },
     // --- Archived Email ---
    {
        id: 'email-9',
        conversationId: 'conv-7',
        senderName: 'Vercel',
        senderEmail: 'notifications@vercel.com',
        recipientEmail: mockUser.email,
        subject: 'Deployment Successful: webmail-client',
        body: `<p>Your deployment is ready!</p><p><small>If you don't want to receive these notifications, you can adjust your settings or unsubscribe.</small></p>`,
        snippet: 'Your deployment is ready!',
        timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60000).toISOString(),
        isRead: true,
        folderId: SystemFolder.ARCHIVE,
        labelIds: [],
        messageId: '<vercel-deploy-success-181920@vercel.com>',
    },
     // --- Conversation 8: Project Phoenix thread ---
    {
        id: 'email-10',
        conversationId: 'conv-8',
        senderName: 'Chris Green',
        senderEmail: 'chris.g@example.com',
        recipientEmail: mockUser.email,
        subject: 'Project Phoenix Kick-off',
        body: `<p>Hi team,</p><p>Excited to kick off Project Phoenix! The initial project brief is attached. Let's schedule a meeting for early next week to discuss.</p><p>Best,</p><p>Chris</p>`,
        snippet: 'Excited to kick off Project Phoenix! The initial project brief is attached...',
        timestamp: threeDaysAgo.toISOString(),
        isRead: true,
        folderId: 'folder-1', // Project Phoenix folder
        labelIds: ['label-3'], // Work label
        attachments: [{ fileName: 'Project-Phoenix-Brief.pdf', fileSize: 1200000, mimeType: 'application/pdf' }],
        messageId: '<phoenix-kickoff-chris-212223@example.com>',
    },
    {
        id: 'email-11',
        conversationId: 'conv-8',
        senderName: mockUser.name,
        senderEmail: mockUser.email,
        recipientEmail: 'chris.g@example.com',
        cc: 'alex.j@example.com',
        subject: 'Re: Project Phoenix Kick-off',
        body: `<p>Thanks, Chris. Looks good.</p><p>I've looped in Alex who will be helping out on this. I'm free on Monday or Tuesday morning.</p>`,
        snippet: "Thanks, Chris. Looks good. I've looped in Alex...",
        timestamp: new Date(threeDaysAgo.getTime() + 5 * 60000).toISOString(),
        isRead: true,
        folderId: SystemFolder.SENT,
        labelIds: ['label-3'],
        messageId: '<re-phoenix-kickoff-user-242526@example.com>',
    },
    {
        id: 'email-12',
        conversationId: 'conv-8',
        senderName: 'Chris Green',
        senderEmail: 'chris.g@example.com',
        recipientEmail: mockUser.email,
        subject: 'Re: Project Phoenix Kick-off',
        body: `<p>Perfect, let's aim for Monday at 10 AM. I'll send out an invite.</p>`,
        snippet: 'Perfect, let\'s aim for Monday at 10 AM...',
        timestamp: new Date(threeDaysAgo.getTime() + 10 * 60000).toISOString(),
        isRead: false,
        folderId: 'folder-1',
        labelIds: ['label-3'],
        messageId: '<re-phoenix-kickoff-chris-272829@example.com>',
    },

    // --- Conversation 9: Newsletter ---
    {
        id: 'email-13',
        conversationId: 'conv-9',
        senderName: 'Tech Weekly',
        senderEmail: 'newsletter@techweekly.com',
        recipientEmail: mockUser.email,
        subject: 'Your weekly dose of tech news!',
        body: `<p>This week in tech: The rise of AI assistants, the future of quantum computing, and a deep dive into the latest framework updates. Click here to read more.</p><p><small>To stop receiving these emails, you can <a href="#">unsubscribe</a>.</small></p>`,
        snippet: 'This week in tech: The rise of AI assistants...',
        timestamp: yesterday.toISOString(),
        isRead: true,
        folderId: SystemFolder.INBOX,
        labelIds: [],
        messageId: '<newsletter-tech-weekly-303132@techweekly.com>',
    },

    // --- Conversation 10: Receipt ---
    {
        id: 'email-14',
        conversationId: 'conv-10',
        senderName: 'OnlineStore',
        senderEmail: 'orders@estore.com',
        recipientEmail: mockUser.email,
        subject: 'Your OnlineStore Order #123-4567890 is confirmed',
        body: `<p>Thank you for your order! We'll notify you when it ships.</p>`,
        snippet: 'Thank you for your order! We\'ll notify you when it ships.',
        timestamp: twoDaysAgo.toISOString(),
        isRead: true,
        folderId: 'folder-5', // Receipts.2024
        labelIds: ['label-2'], // Receipts label
        messageId: '<order-confirmation-123456@estore.com>',
    },

    // --- Conversation 11: Social Notification ---
    {
        id: 'email-15',
        conversationId: 'conv-11',
        senderName: 'SocialNet',
        senderEmail: 'notification@social.net',
        recipientEmail: mockUser.email,
        subject: 'Jane Doe mentioned you in a comment',
        body: `<p><strong>Jane Doe:</strong> "@${mockUser.name} what are your thoughts on this?"</p>`,
        snippet: 'Jane Doe mentioned you in a comment',
        timestamp: now.toISOString(),
        isRead: false,
        folderId: SystemFolder.INBOX,
        labelIds: [],
        messageId: '<socialnet-mention-789012@social.net>',
    },

    // --- Conversation 12: Another starred email ---
    {
        id: 'email-16',
        conversationId: 'conv-12',
        senderName: 'Figma',
        senderEmail: 'team@figma.com',
        recipientEmail: mockUser.email,
        subject: 'New features in Figma this month',
        body: `<p>Check out the new features we've launched to improve your design workflow.</p>`,
        snippet: 'Check out the new features we\'ve launched...',
        timestamp: fourDaysAgo.toISOString(),
        isRead: true,
        folderId: SystemFolder.INBOX,
        labelIds: [SystemLabel.STARRED],
        messageId: '<figma-features-update-345678@figma.com>',
    },

    // --- Conversation 13: Scheduled email ---
    {
        id: 'email-17',
        conversationId: 'conv-13',
        senderName: mockUser.name,
        senderEmail: mockUser.email,
        recipientEmail: 'chris.g@example.com',
        subject: 'Follow up on Phoenix',
        body: `<p>Hi Chris,</p><p>Just a reminder about our meeting on Monday.</p>`,
        snippet: 'Just a reminder about our meeting on Monday.',
        timestamp: now.toISOString(),
        isRead: true,
        folderId: SystemFolder.SCHEDULED,
        labelIds: [],
        scheduledSendTime: nextWeek.toISOString(),
        messageId: '<scheduled-phoenix-followup-901234@example.com>',
    },

    // --- Conversation 14: Long subject line ---
    {
        id: 'email-18',
        conversationId: 'conv-14',
        senderName: 'Jane Doe',
        senderEmail: 'jane.d@example.com',
        recipientEmail: mockUser.email,
        subject: 'A very long subject line to test how the UI handles overflow and wrapping behavior in different screen sizes and contexts',
        body: `<p>Just testing the subject line truncation. How does it look?</p>`,
        snippet: 'Just testing the subject line truncation. How does it look?',
        timestamp: fiveDaysAgo.toISOString(),
        isRead: true,
        folderId: SystemFolder.INBOX,
        labelIds: ['label-4'], // Personal
        messageId: '<long-subject-test-jane-567890@example.com>',
    },

    // --- Conversation 15: Another archived item ---
    {
        id: 'email-19',
        conversationId: 'conv-15',
        senderName: 'Alex Johnson',
        senderEmail: 'alex.j@example.com',
        recipientEmail: mockUser.email,
        subject: 'Re: Quick Question',
        body: `<p>Nevermind, figured it out!</p>`,
        snippet: 'Nevermind, figured it out!',
        timestamp: fiveDaysAgo.toISOString(),
        isRead: true,
        folderId: SystemFolder.ARCHIVE,
        labelIds: [],
        messageId: '<quick-question-reply-alex-123450@example.com>',
    },
];
