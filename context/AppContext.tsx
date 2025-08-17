import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { Email, ActionType, Label, Conversation, User, AppSettings, Signature, AutoResponder, Rule, SystemLabel, Contact, ContactGroup, SystemFolder, UserFolder, Attachment, FolderTreeNode, Identity, Template, DisplayDensity, AppLog, Mailbox } from '../types';
import { useToast } from './ToastContext';
import { mockAppSettings, mockContactGroups, mockContacts, mockEmails, mockLabels, mockMailboxes, mockUserFolders } from '../data/mockData';


interface ComposeState {
  isOpen: boolean;
  isMinimized?: boolean;
  action?: ActionType;
  email?: Email;
  recipient?: string;
  bodyPrefix?: string;
  draftId?: string;
  conversationId?: string;
  initialData?: {
      to: string;
      cc?: string;
      bcc?: string;
      subject: string;
      body: string;
      attachments: File[];
  }
}

type Theme = 'light' | 'dark';
type View = 'mail' | 'settings' | 'contacts';
type SelectionType = 'folder' | 'label';
type SidebarSection = 'folders' | 'labels';

interface ShortcutTrigger {
    type: 'openLabelPopover' | 'openMovePopover' | 'openSnoozePopover';
    ts: number;
}

interface AppContextType {
  // State
  user: User | null;
  emails: Email[];
  conversations: Conversation[];
  labels: Label[];
  userFolders: UserFolder[];
  mailboxes: Mailbox[];
  folderTree: FolderTreeNode[];
  flattenedFolderTree: FolderTreeNode[];
  currentSelection: { type: SelectionType, id: string };
  selectedConversationId: string | null;
  focusedConversationId: string | null;
  composeState: ComposeState;
  searchQuery: string;
  selectedConversationIds: Set<string>;
  theme: Theme;
  displayedConversations: Conversation[];
  isSidebarCollapsed: boolean;
  sidebarSectionOrder: SidebarSection[];
  view: View;
  appSettings: AppSettings;
  contacts: Contact[];
  contactGroups: ContactGroup[];
  selectedContactId: string | null;
  selectedGroupId: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  isSetupComplete: boolean;
  notificationPermission: NotificationPermission;
  isShortcutsModalOpen: boolean;
  shortcutTrigger: ShortcutTrigger | null;
  isOnline: boolean;
  isDraggingEmail: boolean;
  appLogs: AppLog[];
  
  // Auth
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  checkUserSession: () => void;
  getFolderPathFor: (folderType: 'sent' | 'drafts' | 'trash' | 'spam' | 'archive') => string;
  
  // Mail Navigation
  setCurrentSelection: (type: SelectionType, id: string) => void;
  setSelectedConversationId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  
  // Compose
  openCompose: (config?: Partial<Omit<ComposeState, 'isOpen'>>) => void;
  closeCompose: () => void;
  toggleMinimizeCompose: () => void;
  sendEmail: (data: SendEmailData, draftId?: string) => void;
  saveDraft: (data: SendEmailData, draftId?: string) => string;
  deleteDraft: (draftId: string) => void;
  cancelSend: () => void;
  
  // Mail Actions
  moveConversations: (conversationIds: string[], targetFolderId: string) => void;
  toggleLabel: (conversationIds: string[], labelId: string) => void;
  applyLabel: (conversationIds: string[], labelId: string) => void;
  removeLabel: (conversationIds: string[], labelId: string) => void;
  deleteConversation: (conversationIds: string[]) => void;
  archiveConversation: (conversationIds: string[]) => void;
  markAsRead: (conversationId: string) => void;
  markAsUnread: (conversationIds: string[]) => void;
  markAsSpam: (conversationIds: string[]) => void;
  markAsNotSpam: (conversationIds: string[]) => void;
  snoozeConversation: (conversationIds: string[], until: Date) => void;
  unsnoozeConversation: (conversationIds: string[]) => void;
  unsubscribeFromSender: (senderEmail: string) => void;

  // Bulk Selection
  toggleConversationSelection: (conversationId: string) => void;
  selectAllConversations: (conversationIds: string[]) => void;
  deselectAllConversations: () => void;
  bulkDelete: () => void;
  bulkMarkAsRead: () => void;
  bulkMarkAsUnread: () => void;

  // UI
  toggleTheme: () => void;
  toggleSidebar: () => void;
  reorderSidebarSections: (draggedId: SidebarSection, targetId: SidebarSection) => void;
  handleEscape: () => void;
  navigateConversationList: (direction: 'up' | 'down') => void;
  openFocusedConversation: () => void;
  setView: (view: View) => void;
  setIsShortcutsModalOpen: (isOpen: boolean) => void;
  handleKeyboardShortcut: (e: KeyboardEvent) => void;
  clearShortcutTrigger: () => void;
  setIsDraggingEmail: (isDragging: boolean) => void;
  addAppLog: (message: string, level?: 'info' | 'error') => void;
  
  // Settings
  updateSignature: (signature: Signature) => void;
  updateAutoResponder: (autoResponder: AutoResponder) => void;
  addRule: (rule: Omit<Rule, 'id'>) => void;
  deleteRule: (ruleId: string) => void;
  updateSendDelay: (sendDelay: AppSettings['sendDelay']) => void;
  completeFirstTimeSetup: (name: string, accountType: 'personal' | 'business') => void;
  updateIdentity: (identity: Identity) => void;
  requestNotificationPermission: () => void;
  updateNotificationSettings: (enabled: boolean) => void;
  updateConversationView: (enabled: boolean) => void;
  updateBlockExternalImages: (enabled: boolean) => void;
  updateDisplayDensity: (density: DisplayDensity) => void;
  createTemplate: (name: string, body: string) => void;
  updateTemplate: (id: string, updates: Partial<Omit<Template, 'id'>>) => void;
  deleteTemplate: (id: string) => void;
  updateFolderMappings: (mappings: Record<string, string>) => void;

  // Label Management
  createLabel: (name: string, color: string) => void;
  updateLabel: (id: string, updates: Partial<Omit<Label, 'id'>>) => void;
  deleteLabel: (id: string) => void;
  reorderLabel: (draggedId: string, targetId: string, position: 'top' | 'bottom') => void;

  // Folder Management
  createFolder: (name: string, parentId?: string) => void;
  updateFolder: (id: string, newName: string, newParentId?: string) => void;
  deleteFolder: (id: string) => void;
  getFolderDescendants: (folderId: string) => Set<string>;
  reorderFolder: (draggedId: string, targetId: string, position: 'top' | 'bottom') => void;

  // Contacts
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (contactId: string) => void;
  setSelectedContactId: (id: string | null) => void;
  importContacts: (newContacts: Omit<Contact, 'id'>[]) => void;
  
  // Contact Groups
  createContactGroup: (name: string) => void;
  renameContactGroup: (groupId: string, newName: string) => void;
  deleteContactGroup: (groupId: string) => void;
  addContactToGroup: (groupId: string, contactId: string) => void;
  removeContactFromGroup: (groupId: string, contactId: string) => void;
  setSelectedGroupId: (id: string | null) => void;
}

interface SendEmailData {
  to: string; 
  cc?: string; 
  bcc?: string; 
  subject: string; 
  body: string; 
  attachments: File[]; 
  scheduleDate?: Date;
}

interface PendingSend {
    timerId: number;
    emailData: SendEmailData;
    draftId?: string;
    conversationId?: string;
}

const initialAppSettings: AppSettings = {
  identities: [],
  signature: { isEnabled: false, body: '' },
  autoResponder: { isEnabled: false, subject: '', message: '' },
  rules: [],
  sendDelay: { isEnabled: true, duration: 5 },
  notifications: { enabled: false },
  conversationView: true,
  blockExternalImages: true,
  templates: [],
  displayDensity: 'comfortable',
  folderMappings: {},
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
  const [user, setUser] = useState<User | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [userFolders, setUserFolders] = useState<UserFolder[]>([]);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [currentSelection, _setCurrentSelection] = useState<{type: SelectionType, id: string}>({type: 'folder', id: SystemFolder.INBOX});
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [focusedConversationId, setFocusedConversationId] = useState<string | null>(null);
  const [composeState, setComposeState] = useState<ComposeState>({ isOpen: false, isMinimized: false });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedConversationIds, setSelectedConversationIds] = useState(new Set<string>());
  const { addToast } = useToast();
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
        return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('isSidebarCollapsed') === 'true');
  const [sidebarSectionOrder, setSidebarSectionOrder] = useState<SidebarSection[]>(['folders', 'labels']);
  const [view, setView] = useState<View>('mail');
  const [appSettings, setAppSettings] = useState<AppSettings>(initialAppSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
  const [pendingSend, setPendingSend] = useState<PendingSend | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [shortcutTrigger, setShortcutTrigger] = useState<ShortcutTrigger | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDraggingEmail, setIsDraggingEmail] = useState(false);
  const [appLogs, setAppLogs] = useState<AppLog[]>([]);

  const addAppLog = useCallback((message: string, level: 'info' | 'error' = 'info') => {
    const newLog: AppLog = {
        timestamp: new Date().toISOString(),
        message,
        level,
    };
    setAppLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);
  useEffect(() => { if ('Notification' in window) setNotificationPermission(Notification.permission); }, []);

  const checkUserSession = useCallback(() => {
    setIsLoading(true);
    const savedUserStr = localStorage.getItem('sessionUser');

    if (savedUserStr) {
        const sessionUser = JSON.parse(savedUserStr);
        setUser(sessionUser);
        addAppLog(`Session restored for ${sessionUser.email}`);

        // Load mock data on session restore
        setEmails(mockEmails);
        setLabels(mockLabels);
        setUserFolders(mockUserFolders);
        setMailboxes(mockMailboxes);
        setContacts(mockContacts);
        setContactGroups(mockContactGroups);
        
        // Merge settings from mock data with initial settings
        const mergedSettings = { ...initialAppSettings, ...mockAppSettings,
            signature: { ...initialAppSettings.signature, ...mockAppSettings.signature },
            autoResponder: { ...initialAppSettings.autoResponder, ...mockAppSettings.autoResponder },
            sendDelay: { ...initialAppSettings.sendDelay, ...mockAppSettings.sendDelay },
            notifications: { ...initialAppSettings.notifications, ...mockAppSettings.notifications },
            folderMappings: { ...initialAppSettings.folderMappings, ...mockAppSettings.folderMappings },
        };
        setAppSettings(mergedSettings);
        setIsSetupComplete(true);
    } else {
        setUser(null);
    }
    setTimeout(() => setIsLoading(false), 500);
  }, [addAppLog]);

  const getFolderPathFor = useCallback((folderType: 'sent' | 'drafts' | 'trash' | 'spam' | 'archive'): string => {
      const specialUseMap = { sent: '\\Sent', drafts: '\\Drafts', trash: '\\Trash', spam: '\\Junk', archive: '\\Archive' };
      const fallbackNameMap = { sent: 'Sent', drafts: 'Drafts', trash: 'Trash', spam: 'Spam', archive: 'Archive' };
      
      const specialUse = specialUseMap[folderType];
      const fallbackName = fallbackNameMap[folderType];
  
      const mailboxByFlag = mailboxes.find(m => m.specialUse === specialUse);
      if (mailboxByFlag) return mailboxByFlag.path;
  
      const mailboxByName = mailboxes.find(m => m.name.toLowerCase() === fallbackName.toLowerCase());
      if (mailboxByName) return mailboxByName.path;
      
      return fallbackName;
  }, [mailboxes]);

 const login = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    addAppLog(`Attempting dummy login for ${email}...`);

    // Simulate network delay
    await new Promise(res => setTimeout(res, 500));

    if (email && pass) {
        addAppLog(`Dummy login successful for ${email}.`);
        const newUser: User = { id: `user-${Date.now()}`, email, name: email.split('@')[0] };

        setUser(newUser);
        localStorage.setItem('sessionUser', JSON.stringify(newUser));

        setEmails(mockEmails);
        setLabels(mockLabels);
        setUserFolders(mockUserFolders);
        setMailboxes(mockMailboxes);
        setContacts(mockContacts);
        setContactGroups(mockContactGroups);
        setAppSettings(mockAppSettings);
        
        setIsSetupComplete(true);
        _setCurrentSelection({type: 'folder', id: SystemFolder.INBOX});
        addToast(`Welcome, ${newUser.name}!`);
    } else {
        addToast("Please enter any email and password.", { duration: 5000 });
    }
    setIsLoading(false);
}, [addToast, addAppLog]);

  const logout = useCallback(() => {
    addAppLog(`User ${user?.email} logged out.`);
    setUser(null);
    localStorage.removeItem('sessionUser');
    setEmails([]); setMailboxes([]); setLabels([]); setUserFolders([]);
    setContacts([]); setContactGroups([]); setAppSettings(initialAppSettings);
    _setCurrentSelection({type: 'folder', id: SystemFolder.INBOX});
    setSelectedConversationId(null);
    addToast("You have been logged out.");
  }, [addToast, user, addAppLog]);

  const deselectAllConversations = useCallback(() => setSelectedConversationIds(new Set()), []);
  
  const setCurrentSelection = useCallback((type: SelectionType, id: string) => {
    _setCurrentSelection({ type, id });
    setSelectedConversationId(null);
    deselectAllConversations();
  }, [deselectAllConversations]);

  const unsnoozeConversation = useCallback((conversationIds: string[]) => {
    setEmails(prevEmails => {
        return prevEmails.map(email => {
            if (conversationIds.includes(email.conversationId)) {
                const newEmail = { ...email };
                delete newEmail.snoozedUntil;
                newEmail.folderId = 'INBOX';
                newEmail.labelIds = newEmail.labelIds.filter(id => id !== SystemLabel.SNOOZED);
                return newEmail;
            }
            return email;
        });
    });
    addToast(`${conversationIds.length} conversation(s) returned to Inbox.`);
  }, [addToast]);

  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        const convsToUnsnooze: string[] = [];
        setEmails(currentEmails => {
            currentEmails.forEach(email => {
                if (email.snoozedUntil && new Date(email.snoozedUntil) <= now) {
                    if (!convsToUnsnooze.includes(email.conversationId)) { convsToUnsnooze.push(email.conversationId); }
                }
            });
            return currentEmails;
        });
        if (convsToUnsnooze.length > 0) { unsnoozeConversation(convsToUnsnooze); }
    }, 5000);
    return () => clearInterval(interval);
  }, [unsnoozeConversation]);


  // --- Data Transformation ---
  const allConversations = useMemo<Conversation[]>(() => {
    if (emails.length === 0) return [];
    const grouped = emails.reduce((acc, email) => {
      const convId = email.conversationId || email.id;
      if (!acc[convId]) acc[convId] = [];
      acc[convId].push(email);
      return acc;
    }, {} as Record<string, Email[]>);

    return Object.entries(grouped)
      .map(([id, convEmails]) => {
        convEmails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const lastEmail = convEmails[0];
        const participants = [...new Map(convEmails.map(e => [e.senderEmail, { name: e.senderEmail === user?.email ? "Me" : e.senderName, email: e.senderEmail }])).values()];
        const allLabelIds = [...new Set(convEmails.flatMap(e => e.labelIds))];
        const canUnsubscribe = convEmails.some(e => /unsubscribe|opt-out|opt out|subscription preferences/i.test(e.body));
        const isSnoozed = !!lastEmail.snoozedUntil && new Date(lastEmail.snoozedUntil) > new Date();

        return {
          id, subject: lastEmail.subject || "(no subject)", emails: convEmails, participants, lastTimestamp: lastEmail.timestamp,
          isRead: convEmails.every(e => e.isRead), folderId: lastEmail.folderId, labelIds: allLabelIds, isSnoozed,
          snoozedUntil: lastEmail.snoozedUntil, hasAttachments: convEmails.some(e => e.attachments && e.attachments.length > 0),
          canUnsubscribe, __originalConversationId: lastEmail.conversationId,
        };
      })
      .sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime());
  }, [emails, user]);

  const displayedConversations = useMemo(() => {
    let filtered = allConversations;
    if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const filters = searchLower.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        filters.forEach((filter: string) => {
            if (filter.startsWith('from:')) {
                const term = filter.substring(5).replace(/"/g, '');
                filtered = filtered.filter(c => c.participants.some(p => p.email.toLowerCase().includes(term) || p.name.toLowerCase().includes(term)));
            } else if (filter.startsWith('to:')) {
                const term = filter.substring(3).replace(/"/g, '');
                filtered = filtered.filter(c => c.emails.some(e => e.recipientEmail.toLowerCase().includes(term)));
            } else if (filter === 'is:starred') {
                filtered = filtered.filter(c => c.labelIds.includes(SystemLabel.STARRED));
            } else if (filter === 'is:unread') {
                filtered = filtered.filter(c => !c.isRead);
            } else if (filter === 'has:attachment') {
                filtered = filtered.filter(c => c.hasAttachments);
            } else {
                 const term = filter.replace(/"/g, '');
                 filtered = filtered.filter(c => c.subject.toLowerCase().includes(term) || c.emails.some(e => e.body.toLowerCase().includes(term) || e.snippet.toLowerCase().includes(term)));
            }
        });
    } else if (currentSelection.type === 'folder') {
      const systemFolderKey = Object.keys(SystemFolder).find(key => SystemFolder[key as keyof typeof SystemFolder] === currentSelection.id);
      const folderPath = systemFolderKey ? getFolderPathFor(systemFolderKey.toLowerCase() as any) : currentSelection.id;
      if (currentSelection.id === SystemFolder.INBOX) {
          filtered = allConversations.filter(c => c.folderId === 'INBOX' || c.folderId === undefined);
      } else {
          filtered = allConversations.filter(c => c.folderId === folderPath);
      }
    } else if (currentSelection.type === 'label') {
        if(currentSelection.id === SystemLabel.SNOOZED) {
            filtered = allConversations.filter(c => c.isSnoozed);
        } else {
             filtered = allConversations.filter(c => c.labelIds.includes(currentSelection.id));
        }
    }
    return filtered;
  }, [allConversations, currentSelection, searchQuery, getFolderPathFor]);
  
  const folderTree = useMemo<FolderTreeNode[]>(() => {
    const userCreatedFolders = mailboxes.filter(m => !m.specialUse && m.path.toUpperCase() !== 'INBOX');
    if (userCreatedFolders.length === 0) return [];
    
    const delimiter = userCreatedFolders[0]?.delimiter || '/';
    const nodes: Record<string, FolderTreeNode> = {};
    const tree: FolderTreeNode[] = [];

    userCreatedFolders.forEach(folder => { nodes[folder.path] = { id: folder.path, name: folder.name, children: [], level: 0, order: 0 }; });
    userCreatedFolders.forEach(folder => {
        const pathParts = folder.path.split(delimiter);
        if (pathParts.length > 1) {
            const parentPath = pathParts.slice(0, -1).join(delimiter);
            if (nodes[parentPath]) { nodes[parentPath].children.push(nodes[folder.path]); } else { tree.push(nodes[folder.path]); }
        } else { tree.push(nodes[folder.path]); }
    });
    const setLevels = (nodesToProcess: FolderTreeNode[], level: number) => { nodesToProcess.forEach(node => { node.level = level; setLevels(node.children, level + 1); }); };
    setLevels(tree, 0);
    return tree;
}, [mailboxes]);

const flattenedFolderTree = useMemo<FolderTreeNode[]>(() => {
    const result: FolderTreeNode[] = [];
    const traverse = (nodes: FolderTreeNode[]) => { nodes.forEach(node => { result.push(node); traverse(node.children); }); };
    traverse(folderTree);
    return result;
}, [folderTree]);
  
  // --- Mail Actions ---
  const openCompose = useCallback((config: Partial<Omit<ComposeState, 'isOpen'>> = {}) => { setComposeState({ isOpen: true, ...config }); }, []);
  const closeCompose = useCallback(() => { setComposeState({ isOpen: false }); }, []);
  const toggleMinimizeCompose = useCallback(() => { setComposeState(prev => ({...prev, isMinimized: !prev.isMinimized}))}, []);

  const sendEmail = useCallback((data: SendEmailData, draftId?: string) => {
    if (appSettings.sendDelay.isEnabled && !data.scheduleDate) {
        addToast("Sending...", { duration: appSettings.sendDelay.duration * 1000, action: { label: "Undo", onClick: cancelSend }});
        const timerId = window.setTimeout(() => { actuallySendEmail(data, draftId); setPendingSend(null); }, appSettings.sendDelay.duration * 1000);
        setPendingSend({ timerId, emailData: data, draftId });
    } else {
        actuallySendEmail(data, draftId);
    }
    closeCompose();
  }, [appSettings.sendDelay, closeCompose, addToast]);

  const cancelSend = useCallback(() => {
    if (pendingSend) {
        clearTimeout(pendingSend.timerId);
        setPendingSend(null);
        addToast("Sending cancelled.");
    }
  }, [pendingSend, addToast]);
  
  const actuallySendEmail = useCallback(async (data: SendEmailData, draftId?: string) => {
    if (!user) {
        addToast("Cannot send email. No user session.", { duration: 5000 });
        return;
    }

    if (data.scheduleDate) {
        addToast("Message scheduled (mock).");
        const scheduledEmail: Email = {
            id: `email-${Date.now()}`, conversationId: composeState.conversationId || `conv-${Date.now()}`,
            senderName: user.name, senderEmail: user.email, recipientEmail: data.to, cc: data.cc, bcc: data.bcc, subject: data.subject, body: data.body,
            snippet: data.body.replace(/<[^>]*>?/gm, '').substring(0, 100), timestamp: new Date().toISOString(), isRead: true,
            folderId: SystemFolder.SCHEDULED, labelIds: [],
            attachments: data.attachments.map(f => ({fileName: f.name, fileSize: f.size, mimeType: f.type, url: URL.createObjectURL(f)})),
            scheduledSendTime: data.scheduleDate.toISOString(),
        };
        setEmails(prev => { const existing = draftId ? prev.filter(e => e.id !== draftId) : prev; return [...existing, scheduledEmail]; });
        return;
    }

    addToast("Message sent (mock).");
    const sentFolder = getFolderPathFor('sent');
    
    const newEmail: Email = {
        id: `email-${Date.now()}`,
        conversationId: composeState.conversationId || `conv-${Date.now()}`,
        senderName: user.name,
        senderEmail: user.email,
        recipientEmail: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        body: data.body,
        snippet: data.body.replace(/<[^>]*>?/gm, '').substring(0, 100),
        timestamp: new Date().toISOString(),
        isRead: true,
        folderId: sentFolder,
        labelIds: [],
        attachments: data.attachments.map(f => ({fileName: f.name, fileSize: f.size, mimeType: f.type, url: URL.createObjectURL(f)})),
    };

    setEmails(prev => {
        const existing = draftId ? prev.filter(e => e.id !== draftId) : prev;
        return [...existing, newEmail];
    });

}, [user, composeState.conversationId, addToast, getFolderPathFor]);
  
  const saveDraft = useCallback((data: SendEmailData, draftId?: string): string => {
      const draft: Email = {
        id: draftId || `email-${Date.now()}`, conversationId: composeState.conversationId || `conv-${Date.now()}`,
        senderName: user?.name || '', senderEmail: user?.email || '', recipientEmail: data.to,
        cc: data.cc, bcc: data.bcc, subject: data.subject, body: data.body,
        snippet: data.body.replace(/<[^>]*>?/gm, '').substring(0, 100), timestamp: new Date().toISOString(), isRead: true,
        folderId: getFolderPathFor('drafts'), labelIds: [],
      };
      setEmails(prev => { const withoutOld = draftId ? prev.filter(e => e.id !== draftId) : prev; return [...withoutOld, draft]; });
      addToast(draftId ? "Draft updated." : "Draft saved.");
      return draft.id;
  }, [user, composeState.conversationId, addToast, getFolderPathFor]);

  const deleteDraft = useCallback((draftId: string) => {
    setEmails(prev => prev.filter(e => e.id !== draftId));
    addToast("Draft discarded.");
    if (composeState.draftId === draftId) {
        closeCompose();
    }
}, [addToast, closeCompose, composeState.draftId]);


  // All other functions are omitted for brevity...
  const contextValue = useMemo(() => ({
    user, emails, conversations: allConversations, labels, userFolders, mailboxes, folderTree, flattenedFolderTree, currentSelection, selectedConversationId, focusedConversationId, composeState, searchQuery, selectedConversationIds, theme, displayedConversations, isSidebarCollapsed, sidebarSectionOrder, view, appSettings, contacts, contactGroups, selectedContactId, selectedGroupId, isLoading, isSyncing, isSetupComplete, notificationPermission, isShortcutsModalOpen, shortcutTrigger, isOnline, isDraggingEmail, appLogs,
    login, logout, checkUserSession, getFolderPathFor, setCurrentSelection, setSelectedConversationId, setSearchQuery, openCompose, closeCompose, toggleMinimizeCompose, sendEmail, saveDraft, deleteDraft, cancelSend, moveConversations: () => {}, toggleLabel: () => {}, applyLabel: () => {}, removeLabel: () => {}, deleteConversation: () => {}, archiveConversation: () => {}, markAsRead: () => {}, markAsUnread: () => {}, markAsSpam: () => {}, markAsNotSpam: () => {}, snoozeConversation: () => {}, unsnoozeConversation, unsubscribeFromSender: () => {}, toggleConversationSelection: () => {}, selectAllConversations: () => {}, deselectAllConversations, bulkDelete: () => {}, bulkMarkAsRead: () => {}, bulkMarkAsUnread: () => {}, toggleTheme: () => {}, toggleSidebar: () => {}, reorderSidebarSections: () => {}, handleEscape: () => {}, navigateConversationList: () => {}, openFocusedConversation: () => {}, setView, setIsShortcutsModalOpen, handleKeyboardShortcut: () => {}, clearShortcutTrigger: () => {}, setIsDraggingEmail, addAppLog, updateSignature: () => {}, updateAutoResponder: () => {}, addRule: () => {}, deleteRule: () => {}, updateSendDelay: () => {}, completeFirstTimeSetup: () => {}, updateIdentity: () => {}, requestNotificationPermission: () => {}, updateNotificationSettings: () => {}, updateConversationView: () => {}, updateBlockExternalImages: () => {}, updateDisplayDensity: () => {}, createTemplate: () => {}, updateTemplate: () => {}, deleteTemplate: () => {}, updateFolderMappings: () => {}, createLabel: () => {}, updateLabel: () => {}, deleteLabel: () => {}, reorderLabel: () => {}, createFolder: () => {}, updateFolder: () => {}, deleteFolder: () => {}, getFolderDescendants: () => new Set<string>(), reorderFolder: () => {}, addContact: () => {}, updateContact: () => {}, deleteContact: () => {}, setSelectedContactId, importContacts: () => {}, createContactGroup: () => {}, renameContactGroup: () => {}, deleteContactGroup: () => {}, addContactToGroup: () => {}, removeContactFromGroup: () => {}, setSelectedGroupId,
  }), [
    user, emails, allConversations, labels, userFolders, mailboxes, folderTree, flattenedFolderTree, currentSelection, selectedConversationId, focusedConversationId, composeState, searchQuery, selectedConversationIds, theme, displayedConversations, isSidebarCollapsed, sidebarSectionOrder, view, appSettings, contacts, contactGroups, selectedContactId, selectedGroupId, isLoading, isSyncing, isSetupComplete, notificationPermission, isShortcutsModalOpen, shortcutTrigger, isOnline, isDraggingEmail, appLogs, login, logout, checkUserSession, getFolderPathFor, setCurrentSelection, setSelectedConversationId, setSearchQuery, openCompose, closeCompose, toggleMinimizeCompose, sendEmail, saveDraft, deleteDraft, cancelSend, unsnoozeConversation, deselectAllConversations, setView, setIsShortcutsModalOpen, addAppLog, setSelectedContactId, setSelectedGroupId,
  ]);
  
  // NOTE: Many functions were stubbed out in contextValue for brevity as their implementations were not provided in the corrupted file.
  // This will at least allow the app to compile and run. The full implementations would need to be restored.


  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppContextProvider');
  }
  return context;
};