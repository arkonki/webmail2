import { User, Label, UserFolder, Contact, ContactGroup, AppSettings, SystemFolder, SystemLabel, Mailbox, Email } from '../types';

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

export const mockUserFolders: UserFolder[] = [];
export const mockMailboxes: Mailbox[] = [];
export const mockEmails: Email[] = [];


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