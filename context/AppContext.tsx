import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { Email, ActionType, Label, Conversation, User, AppSettings, Signature, AutoResponder, Rule, SystemLabel, Contact, ContactGroup, SystemFolder, UserFolder, Attachment, FolderTreeNode, Identity, Template, DisplayDensity, AppLog, Mailbox } from '../types';
import { useToast } from './ToastContext';
import { mockUser, mockEmails, mockLabels, mockUserFolders, mockContacts, mockContactGroups, initialAppSettings as mockAppSettings, mockMailboxes } from '../data/mockData';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Helper for localStorage persistence
function usePersistedState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) return JSON.parse(storedValue);
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
    // If it's an array and it's empty in local storage, use the default
    if (Array.isArray(defaultValue) && defaultValue.length > 0) {
        return defaultValue;
    }
    const fromSession = sessionStorage.getItem(key);
     if (fromSession) {
        try {
            return JSON.parse(fromSession);
        } catch (error) {
            console.error(`Error reading sessionStorage key “${key}”:`, error);
        }
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

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

interface LoginData {
    email: string;
    password: string;
    imap: { host: string; port: number; secure: boolean };
    smtp: { host: string; port: number; secure: boolean };
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
  login: (data: LoginData) => Promise<void>;
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
  sendEmail: (data: SendEmailData, draftId?: string) => Promise<void>;
  saveDraft: (data: SendEmailData, draftId?: string) => Promise<string>;
  deleteDraft: (draftId: string) => Promise<void>;
  
  // Mail Actions
  moveConversations: (conversationIds: string[], targetFolderId: string) => Promise<void>;
  toggleLabel: (conversationIds: string[], labelId: string) => void;
  applyLabel: (conversationIds: string[], labelId: string) => Promise<void>;
  removeLabel: (conversationIds: string[], labelId: string) => Promise<void>;
  deleteConversation: (conversationIds: string[]) => Promise<void>;
  archiveConversation: (conversationIds: string[]) => Promise<void>;
  markAsRead: (conversationId: string) => void;
  markAsUnread: (conversationIds: string[]) => void;
  markAsSpam: (conversationIds: string[]) => Promise<void>;
  markAsNotSpam: (conversationIds: string[]) => Promise<void>;
  snoozeConversation: (conversationIds: string[], until: Date) => Promise<void>;
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
  addRule: (rule: Omit<Rule, 'id'>) => Promise<void>;
  deleteRule: (ruleId: string) => Promise<void>;
  updateSendDelay: (sendDelay: AppSettings['sendDelay']) => void;
  completeFirstTimeSetup: (name: string, accountType: 'personal' | 'business') => Promise<void>;
  updateIdentity: (identity: Identity) => Promise<void>;
  requestNotificationPermission: () => void;
  updateNotificationSettings: (enabled: boolean) => void;
  updateConversationView: (enabled: boolean) => void;
  updateBlockExternalImages: (enabled: boolean) => void;
  updateDisplayDensity: (density: DisplayDensity) => void;
  createTemplate: (name: string, body: string) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<Omit<Template, 'id'>>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  updateFolderMappings: (mappings: Record<string, string>) => void;

  // Label Management
  createLabel: (name: string, color: string) => Promise<void>;
  updateLabel: (id: string, updates: Partial<Omit<Label, 'id'>>) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  reorderLabel: (draggedId: string, targetId: string, position: 'top' | 'bottom') => Promise<void>;

  // Folder Management
  createFolder: (name: string, parentId?: string) => Promise<void>;
  updateFolder: (id: string, newName: string, newParentId?: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  getFolderDescendants: (folderId: string) => Set<string>;
  reorderFolder: (draggedId: string, targetId: string, position: 'top' | 'bottom') => Promise<void>;

  // Contacts
  addContact: (contact: Omit<Contact, 'id'>) => Promise<void>;
  updateContact: (contact: Contact) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  setSelectedContactId: (id: string | null) => void;
  importContacts: (newContacts: Omit<Contact, 'id'>[]) => Promise<void>;
  
  // Contact Groups
  createContactGroup: (name: string) => Promise<void>;
  renameContactGroup: (groupId: string, newName: string) => Promise<void>;
  deleteContactGroup: (groupId: string) => Promise<void>;
  addContactToGroup: (groupId: string, contactId: string) => Promise<void>;
  removeContactFromGroup: (groupId: string, contactId: string) => Promise<void>;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
  const [user, setUser] = usePersistedState<User | null>('user', null);
  const [emails, setEmails] = usePersistedState<Email[]>('emails', mockEmails);
  const [labels, setLabels] = usePersistedState<Label[]>('labels', mockLabels);
  const [userFolders, setUserFolders] = usePersistedState<UserFolder[]>('userFolders', mockUserFolders);
  const [mailboxes, setMailboxes] = usePersistedState<Mailbox[]>('mailboxes', mockMailboxes);
  const [contacts, setContacts] = usePersistedState<Contact[]>('contacts', mockContacts);
  const [contactGroups, setContactGroups] = usePersistedState<ContactGroup[]>('contactGroups', mockContactGroups);
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
    if (savedTheme) return savedTheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistedState<boolean>('isSidebarCollapsed', false);
  const [sidebarSectionOrder, setSidebarSectionOrder] = usePersistedState<SidebarSection[]>( 'sidebarSectionOrder', ['folders', 'labels']);
  const [view, setView] = useState<View>('mail');
  const [appSettings, setAppSettings] = usePersistedState<AppSettings>('appSettings', mockAppSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = usePersistedState<boolean>('isSetupComplete', false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [shortcutTrigger, setShortcutTrigger] = useState<ShortcutTrigger | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDraggingEmail, setIsDraggingEmail] = useState(false);
  const [appLogs, setAppLogs] = usePersistedState<AppLog[]>('appLogs', []);

  const addAppLog = useCallback((message: string, level: 'info' | 'error' = 'info') => {
    const newLog: AppLog = { timestamp: new Date().toISOString(), message, level };
    setAppLogs(prev => [newLog, ...prev.slice(0, 99)]);
  }, [setAppLogs]);
  
  const logout = useCallback(() => {
    addAppLog(`User ${user?.email} logged out.`);
    setUser(null);
    localStorage.removeItem('user');
    addToast("You have been logged out.");
  }, [addToast, user, addAppLog, setUser]);
  
  const checkUserSession = useCallback(async () => {
    setIsLoading(true);
    // In a real app, you'd verify a token. Here we just check if the user object exists.
    const sessionUserStr = localStorage.getItem('user');
    if (sessionUserStr) {
      setUser(JSON.parse(sessionUserStr));
    }
    setIsLoading(false);
  }, [setUser]);
  
  // Simulate new email arrival
  useEffect(() => {
    if(!user) return;
    const interval = setInterval(() => {
        const newEmail = {
            id: generateId(),
            conversationId: `conv-${generateId()}`,
            senderName: 'Automated System',
            senderEmail: 'system@example.com',
            recipientEmail: user.email,
            subject: 'System Health Check',
            body: `<div><p>System is running normally at ${new Date().toLocaleTimeString()}.</p></div>`,
            snippet: 'System is running normally...',
            timestamp: new Date().toISOString(),
            isRead: false,
            folderId: SystemFolder.INBOX,
            labelIds: [],
        };
        setEmails(prev => [newEmail, ...prev]);
        addToast(`New email from ${newEmail.senderName}`);
        addAppLog(`New email received: ${newEmail.subject}`);
    }, 1000 * 60 * 5); // every 5 minutes
    return () => clearInterval(interval);
  }, [user, setEmails, addToast, addAppLog]);


  const login = useCallback(async (data: LoginData) => {
    setIsLoading(true);
    addAppLog(`Attempting login for ${data.email}...`);
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Login failed');
        }
        setUser(result.user);
        setIsSetupComplete(localStorage.getItem('isSetupComplete') === 'true');
        addToast(`Welcome back!`);
        addAppLog(`Login successful for ${data.email}.`);
    } catch (err: any) {
        addToast(`Login failed: ${err.message}`, { duration: 5000 });
        addAppLog(`Login failed: ${err.message}`, 'error');
        throw err;
    } finally {
        setIsLoading(false);
    }
  }, [addToast, addAppLog, setUser, setIsSetupComplete]);
  
  const deselectAllConversations = useCallback(() => setSelectedConversationIds(new Set()), []);

  const setCurrentSelection = useCallback(async (type: SelectionType, id: string) => {
    _setCurrentSelection({ type, id });
    setSelectedConversationId(null);
    deselectAllConversations();
    // No API call needed, filtering is handled in useMemo
    addAppLog(`Navigated to ${type}: ${id}`);
  }, [addAppLog, deselectAllConversations]);
  
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

  const displayedConversations = useMemo<Conversation[]>(() => {
    let filtered = allConversations;

    // Filter by selection (folder/label)
    if (currentSelection.type === 'folder') {
      filtered = filtered.filter(c => c.folderId === currentSelection.id);
    } else if (currentSelection.type === 'label') {
      filtered = filtered.filter(c => c.labelIds.includes(currentSelection.id));
    }

    // Filter by search query
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.subject.toLowerCase().includes(lowercasedQuery) ||
        c.participants.some(p => p.name.toLowerCase().includes(lowercasedQuery) || p.email.toLowerCase().includes(lowercasedQuery)) ||
        c.emails.some(e => e.snippet.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    if (currentSelection.type !== 'label' || currentSelection.id !== SystemLabel.SNOOZED) {
      filtered = filtered.filter(c => !c.isSnoozed);
    } else {
      filtered = filtered.filter(c => c.isSnoozed);
    }

    return filtered;
  }, [allConversations, currentSelection, searchQuery]);
  
  const getFolderPathFor = useCallback((folderType: 'sent' | 'drafts' | 'trash' | 'spam' | 'archive'): string => {
    const key = folderType as keyof typeof appSettings.folderMappings;
    return appSettings.folderMappings[key] || SystemFolder[folderType.toUpperCase() as keyof typeof SystemFolder];
  }, [appSettings.folderMappings]);

  // --- Compose ---
  const openCompose = useCallback((config?: Partial<Omit<ComposeState, 'isOpen'>>) => setComposeState({ isOpen: true, ...config }), []);
  const closeCompose = useCallback(() => setComposeState({ isOpen: false, isMinimized: false }), []);
  const toggleMinimizeCompose = useCallback(() => setComposeState(prev => ({ ...prev, isMinimized: !prev.isMinimized })), []);
  
  const sendEmail = useCallback(async (data: SendEmailData, draftId?: string) => {
      const sentFolder = getFolderPathFor('sent');
      const newEmail: Email = {
        id: generateId(),
        conversationId: `conv-${generateId()}`,
        senderName: user!.name,
        senderEmail: user!.email,
        recipientEmail: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        body: data.body,
        snippet: data.body.replace(/<[^>]+>/g, '').substring(0, 100),
        timestamp: new Date().toISOString(),
        isRead: true,
        folderId: data.scheduleDate ? SystemFolder.SCHEDULED : sentFolder,
        labelIds: [],
        attachments: data.attachments.map(f => ({ fileName: f.name, fileSize: f.size, mimeType: f.type })),
        scheduledSendTime: data.scheduleDate?.toISOString(),
      };
      
      let updatedEmails = [...emails, newEmail];
      if (draftId) {
          updatedEmails = updatedEmails.filter(e => e.id !== draftId);
      }
      setEmails(updatedEmails);
      
      addToast(data.scheduleDate ? "Message scheduled." : "Message sent.");
      closeCompose();
  }, [addToast, closeCompose, user, emails, setEmails, getFolderPathFor]);

  const saveDraft = useCallback(async (data: SendEmailData, draftId?: string): Promise<string> => {
    let newDraftId = draftId || generateId();
    const draftsFolder = getFolderPathFor('drafts');
    const draftEmail: Email = {
        id: newDraftId,
        conversationId: `conv-${newDraftId}`,
        senderName: user!.name,
        senderEmail: user!.email,
        recipientEmail: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        body: data.body,
        snippet: data.body.replace(/<[^>]+>/g, '').substring(0, 100),
        timestamp: new Date().toISOString(),
        isRead: true,
        folderId: draftsFolder,
        labelIds: [],
        attachments: data.attachments.map(f => ({ fileName: f.name, fileSize: f.size, mimeType: f.type }))
    };
    
    setEmails(prev => {
        const existing = prev.find(e => e.id === newDraftId);
        if (existing) {
            return prev.map(e => e.id === newDraftId ? draftEmail : e);
        }
        return [draftEmail, ...prev];
    });
    addToast('Draft saved.');
    return newDraftId;
  }, [addToast, user, setEmails, getFolderPathFor]);

  const deleteDraft = useCallback(async (draftId: string) => {
    if (!draftId) return;
    setEmails(prev => prev.filter(e => e.id !== draftId));
    addToast('Draft discarded.');
  }, [addToast, setEmails]);
  
  // --- Mail Actions ---
  const moveConversations = useCallback(async (conversationIds: string[], targetFolderId: string) => {
    setEmails(prev => prev.map(e => {
        if (conversationIds.includes(e.conversationId)) {
            return { ...e, folderId: targetFolderId };
        }
        return e;
    }));
    if (selectedConversationId && conversationIds.includes(selectedConversationId)) {
        setSelectedConversationId(null);
    }
    deselectAllConversations();
    const folderName = userFolders.find(f => f.id === targetFolderId)?.name || targetFolderId;
    addToast(`${conversationIds.length} conversation(s) moved to "${folderName}".`);
  }, [addToast, userFolders, selectedConversationId, deselectAllConversations, setEmails]);
  
  const applyLabel = useCallback(async (conversationIds: string[], labelId: string) => {
    setEmails(prev => prev.map(e => {
      if (conversationIds.includes(e.conversationId) && !e.labelIds.includes(labelId)) {
        return { ...e, labelIds: [...e.labelIds, labelId] };
      }
      return e;
    }));
    const labelName = labels.find(l => l.id === labelId)?.name || labelId;
    addToast(`Applied label "${labelName}" to ${conversationIds.length} conversation(s).`);
  }, [setEmails, labels, addToast]);

  const removeLabel = useCallback(async (conversationIds: string[], labelId: string) => {
     setEmails(prev => prev.map(e => {
      if (conversationIds.includes(e.conversationId)) {
        return { ...e, labelIds: e.labelIds.filter(id => id !== labelId) };
      }
      return e;
    }));
    addToast(`Label removed.`);
  }, [setEmails, addToast]);
  
  const toggleLabel = useCallback((conversationIds: string[], labelId: string) => {
      const firstConv = allConversations.find(c => c.id === conversationIds[0]);
      if (firstConv?.labelIds.includes(labelId)) {
          removeLabel(conversationIds, labelId);
      } else {
          applyLabel(conversationIds, labelId);
      }
  }, [allConversations, applyLabel, removeLabel]);
  
  const deleteConversation = useCallback(async (conversationIds: string[]) => {
      moveConversations(conversationIds, getFolderPathFor('trash'));
      addToast(`${conversationIds.length} conversation(s) moved to Trash.`);
  }, [moveConversations, getFolderPathFor, addToast]);
  
  const archiveConversation = useCallback(async (conversationIds: string[]) => {
    const archiveFolderId = getFolderPathFor('archive');
    if (archiveFolderId) {
        moveConversations(conversationIds, archiveFolderId);
    } else {
        // Fallback for mock data if Archive isn't standard
        setEmails(prev => prev.filter(e => !conversationIds.includes(e.conversationId)))
        addToast('Archived. (Note: No archive folder configured, removed from view)');
    }
  }, [moveConversations, getFolderPathFor, addToast, setEmails]);

  const markAsRead = useCallback((conversationId: string) => {
    setEmails(prev => prev.map(e => e.conversationId === conversationId ? { ...e, isRead: true } : e));
  }, [setEmails]);

  const markAsUnread = useCallback((conversationIds: string[]) => {
    setEmails(prev => prev.map(e => conversationIds.includes(e.conversationId) ? { ...e, isRead: false } : e));
    if (conversationIds.length > 0) addToast(`Marked ${conversationIds.length} item(s) as unread.`);
  }, [setEmails, addToast]);
  
  const markAsSpam = useCallback(async (conversationIds: string[]) => {
    moveConversations(conversationIds, getFolderPathFor('spam'));
    addToast(`${conversationIds.length} conversation(s) moved to Spam.`);
  }, [moveConversations, getFolderPathFor, addToast]);
  
  const markAsNotSpam = useCallback(async (conversationIds: string[]) => {
    moveConversations(conversationIds, SystemFolder.INBOX);
    addToast(`${conversationIds.length} conversation(s) moved to Inbox.`);
  }, [moveConversations, addToast]);
  
  const snoozeConversation = useCallback(async (conversationIds: string[], until: Date) => {
    setEmails(prev => prev.map(e => {
        if (conversationIds.includes(e.conversationId)) {
            return { ...e, snoozedUntil: until.toISOString() };
        }
        return e;
    }));
    deselectAllConversations();
    addToast(`${conversationIds.length} conversation(s) snoozed.`);
  }, [setEmails, addToast, deselectAllConversations]);
  
  const addRule = useCallback(async (rule: Omit<Rule, 'id'>) => {
      const newRule = { id: generateId(), ...rule };
      setAppSettings(prev => ({ ...prev, rules: [...prev.rules, newRule] }));
      addToast("Rule added.");
  }, [addToast, setAppSettings]);

  const unsubscribeFromSender = useCallback((senderEmail: string) => {
    const newRule: Omit<Rule, 'id'> = {
        condition: { field: 'sender', operator: 'contains', value: senderEmail },
        action: { type: 'moveToFolder', folderId: SystemFolder.TRASH }
    };
    addRule(newRule);
    addToast(`Unsubscribed from ${senderEmail}. Future messages will be moved to Trash.`);
  }, [addRule, addToast]);
  
  // --- Bulk Selection ---
  const toggleConversationSelection = useCallback((conversationId: string) => {
    setSelectedConversationIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(conversationId)) {
            newSet.delete(conversationId);
        } else {
            newSet.add(conversationId);
        }
        return newSet;
    });
  }, []);
  const selectAllConversations = useCallback((conversationIds: string[]) => setSelectedConversationIds(new Set(conversationIds)), []);
  const bulkDelete = useCallback(() => deleteConversation(Array.from(selectedConversationIds)), [selectedConversationIds, deleteConversation]);
  const bulkMarkAsRead = useCallback(() => {
    const ids = Array.from(selectedConversationIds);
    setEmails(prev => prev.map(e => ids.includes(e.conversationId) ? { ...e, isRead: true } : e));
    addToast(`Marked ${ids.length} item(s) as read.`);
  }, [selectedConversationIds, setEmails, addToast]);
  const bulkMarkAsUnread = useCallback(() => markAsUnread(Array.from(selectedConversationIds)), [selectedConversationIds, markAsUnread]);
  
  // --- UI ---
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
        const newTheme = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        return newTheme;
    });
  }, [setTheme]);
  const toggleSidebar = useCallback(() => setIsSidebarCollapsed(prev => !prev), [setIsSidebarCollapsed]);
  const reorderSidebarSections = useCallback((draggedId: SidebarSection, targetId: SidebarSection) => {
    setSidebarSectionOrder(prev => {
        const newOrder = [...prev];
        const draggedIndex = newOrder.indexOf(draggedId);
        const targetIndex = newOrder.indexOf(targetId);
        if (draggedIndex > -1 && targetIndex > -1) {
            const [item] = newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, item);
        }
        return newOrder;
    });
  }, [setSidebarSectionOrder]);
  const handleEscape = useCallback(() => {
    if (composeState.isOpen && !composeState.isMinimized) closeCompose();
    else if (selectedConversationId) setSelectedConversationId(null);
    else if (searchQuery) setSearchQuery('');
    else if (selectedConversationIds.size > 0) deselectAllConversations();
  }, [composeState, closeCompose, selectedConversationId, searchQuery, selectedConversationIds.size, deselectAllConversations]);
  
  const navigateConversationList = useCallback((direction: 'up' | 'down') => {
    if (displayedConversations.length === 0) return;
    const currentIndex = displayedConversations.findIndex(c => c.id === focusedConversationId);
    let nextIndex = (currentIndex === -1) 
        ? (direction === 'down' ? 0 : displayedConversations.length - 1) 
        : (direction === 'down' ? currentIndex + 1 : currentIndex - 1);
    if (nextIndex >= 0 && nextIndex < displayedConversations.length) {
        setFocusedConversationId(displayedConversations[nextIndex].id);
    }
  }, [displayedConversations, focusedConversationId]);

  const openFocusedConversation = useCallback(() => {
    if (focusedConversationId) {
        const conv = allConversations.find(c => c.id === focusedConversationId);
        if (conv) {
            setSelectedConversationId(conv.__originalConversationId || conv.id);
            if (!conv.isRead) markAsRead(conv.id);
        }
    }
  }, [focusedConversationId, allConversations, markAsRead]);
  
  const clearShortcutTrigger = useCallback(() => setShortcutTrigger(null), []);

  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (target.closest('.compose-editor') && (e.metaKey || e.ctrlKey) && e.key === 'Enter') return;
        return;
    }
    if (e.key === 'c') { e.preventDefault(); openCompose(); } 
    else if (e.key === '/') { e.preventDefault(); (document.querySelector('input[type="search"]') as HTMLInputElement)?.focus(); } 
    else if (e.key === '?') { e.preventDefault(); setIsShortcutsModalOpen(true); }
    if (e.key === 'i' && e.metaKey) { e.preventDefault(); setCurrentSelection('folder', SystemFolder.INBOX); }
    if (view === 'mail' && !selectedConversationId) {
        if (e.key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); navigateConversationList('down'); } 
        else if (e.key === 'k' || e.key === 'ArrowUp') { e.preventDefault(); navigateConversationList('up'); } 
        else if (e.key === 'Enter' && focusedConversationId) { e.preventDefault(); openFocusedConversation(); } 
        else if (e.key === 'x' && focusedConversationId) { e.preventDefault(); toggleConversationSelection(focusedConversationId); } 
        else if (e.key === 'l') { e.preventDefault(); if (selectedConversationIds.size > 0 || focusedConversationId) { setShortcutTrigger({ type: 'openLabelPopover', ts: Date.now() }); }}
    }
  }, [openCompose, setIsShortcutsModalOpen, setCurrentSelection, view, selectedConversationId, navigateConversationList, focusedConversationId, openFocusedConversation, toggleConversationSelection, selectedConversationIds.size]);
  
  // --- Settings ---
  const updateSignature = (signature: Signature) => { setAppSettings(p => ({...p, signature})); addToast("Signature settings updated."); };
  const updateAutoResponder = (autoResponder: AutoResponder) => { setAppSettings(p => ({...p, autoResponder})); addToast("Auto-responder settings updated."); };
  const updateSendDelay = (sendDelay: AppSettings['sendDelay']) => { setAppSettings(p => ({...p, sendDelay})); addToast("Send delay settings updated."); };
  const updateNotificationSettings = (enabled: boolean) => { setAppSettings(p => ({...p, notifications: { enabled } })); addToast(enabled ? "Desktop notifications enabled." : "Desktop notifications disabled."); };
  const updateConversationView = (enabled: boolean) => { setAppSettings(p => ({...p, conversationView: enabled })); addToast(enabled ? "Conversation view enabled." : "Conversation view disabled."); };
  const updateBlockExternalImages = (enabled: boolean) => { setAppSettings(p => ({...p, blockExternalImages: enabled })); addToast(enabled ? "External images will be blocked by default." : "External images will be shown by default."); };
  const updateDisplayDensity = (density: DisplayDensity) => { setAppSettings(p => ({...p, displayDensity: density})); addToast(`Display density set to ${density}.`); };
  const updateFolderMappings = (mappings: Record<string, string>) => setAppSettings(p => ({...p, folderMappings: mappings}));

  const deleteRule = useCallback(async (ruleId: string) => {
      setAppSettings(prev => ({ ...prev, rules: prev.rules.filter(r => r.id !== ruleId) }));
      addToast("Rule deleted.");
  }, [addToast, setAppSettings]);
  
  const completeFirstTimeSetup = useCallback(async (name: string, accountType: 'personal' | 'business') => {
      if(user) {
          const newIdentity: Identity = { id: generateId(), name, email: user.email, accountType };
          setUser(prev => prev ? {...prev, name} : null);
          setAppSettings(prev => ({ ...prev, identities: [newIdentity] }));
          setIsSetupComplete(true);
          addToast('Welcome! Your settings have been saved.');
      }
  }, [addToast, user, setUser, setAppSettings, setIsSetupComplete]);

  const updateIdentity = useCallback(async (identity: Identity) => {
    setAppSettings(prev => ({ ...prev, identities: prev.identities.map(i => i.id === identity.id ? identity : i) }));
    addToast('Identity updated.');
  }, [addToast, setAppSettings]);
  
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) { addToast("This browser does not support desktop notification"); return; }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') { updateNotificationSettings(true); addToast("Desktop notifications enabled!"); } 
    else { addToast("Notifications permission not granted."); }
  }, [addToast, updateNotificationSettings]);

  const createTemplate = useCallback(async (name: string, body: string) => {
      const newTemplate = { id: generateId(), name, body };
      setAppSettings(prev => ({ ...prev, templates: [...prev.templates, newTemplate] }));
      addToast(`Template "${name}" created.`);
  }, [addToast, setAppSettings]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<Omit<Template, 'id'>>) => {
      setAppSettings(prev => ({...prev, templates: prev.templates.map(t => t.id === id ? { ...t, ...updates } as Template : t)}));
      addToast(`Template updated.`);
  }, [addToast, setAppSettings]);

  const deleteTemplate = useCallback(async (id: string) => {
      setAppSettings(prev => ({...prev, templates: prev.templates.filter(t => t.id !== id)}));
      addToast('Template deleted.');
  }, [addToast, setAppSettings]);

  // Label Management
  const createLabel = useCallback(async (name: string, color: string) => {
      const newLabel: Label = { id: generateId(), name, color, order: labels.length };
      setLabels(prev => [...prev, newLabel]);
      addToast(`Label "${name}" created.`);
  }, [addToast, labels.length, setLabels]);

  const updateLabel = useCallback(async (id: string, updates: Partial<Omit<Label, 'id'>>) => {
      setLabels(prev => prev.map(l => l.id === id ? { ...l, ...updates } as Label : l));
      addToast('Label updated.');
  }, [addToast, setLabels]);

  const deleteLabel = useCallback(async (id: string) => {
      const labelToDelete = labels.find(l => l.id === id);
      setLabels(prev => prev.filter(l => l.id !== id));
      addToast(`Label "${labelToDelete?.name}" deleted.`);
  }, [labels, addToast, setLabels]);
  
  const reorderLabel = useCallback(async (draggedId: string, targetId: string, position: 'top' | 'bottom') => {
      setLabels(prev => {
          const newLabels = [...prev];
          const draggedItem = newLabels.find(l => l.id === draggedId);
          if (!draggedItem) return prev;
          const targetIndex = newLabels.findIndex(l => l.id === targetId);
          const draggedIndex = newLabels.findIndex(l => l.id === draggedId);
          newLabels.splice(draggedIndex, 1);
          newLabels.splice(targetIndex + (position === 'bottom' ? 1 : 0), 0, draggedItem);
          return newLabels.map((l, i) => ({...l, order: i}));
      });
  }, [setLabels]);
  
  // Folder Management
  const { folderTree, flattenedFolderTree } = useMemo(() => {
      const buildTree = (parentId: string | null = null, level = 0): FolderTreeNode[] => {
          return userFolders
              .filter(folder => (folder.parentId || null) === parentId)
              .sort((a,b) => a.order - b.order)
              .map(folder => ({ ...folder, children: buildTree(folder.id, level + 1), level }));
      };
      const flattenTree = (nodes: FolderTreeNode[]): FolderTreeNode[] => {
          return nodes.flatMap(node => [node, ...flattenTree(node.children)]);
      };
      const tree = buildTree();
      const flattened = flattenTree(tree);
      return { folderTree: tree, flattenedFolderTree: flattened };
  }, [userFolders]);
  
  const getFolderDescendants = useCallback((folderId: string): Set<string> => {
      const descendants = new Set<string>();
      const findChildren = (id: string) => {
          userFolders.forEach(f => {
              if (f.parentId === id) {
                  descendants.add(f.id);
                  findChildren(f.id);
              }
          });
      };
      findChildren(folderId);
      return descendants;
  }, [userFolders]);

  const createFolder = useCallback(async (name: string, parentId?: string) => {
      const newFolder: UserFolder = { id: generateId(), name, parentId, order: userFolders.length };
      setUserFolders(prev => [...prev, newFolder]);
      addToast(`Folder "${name}" created.`);
  }, [addToast, userFolders.length, setUserFolders]);

  const updateFolder = useCallback(async (id: string, newName: string, newParentId?: string) => {
      setUserFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName, parentId: newParentId } : f));
      addToast('Folder updated.');
  }, [addToast, setUserFolders]);

  const deleteFolder = useCallback(async (id: string) => {
      const folderToDelete = userFolders.find(f => f.id === id);
      const descendants = getFolderDescendants(id);
      descendants.add(id);
      
      setUserFolders(prev => prev.filter(f => !descendants.has(f.id)));
      
      const archiveFolder = getFolderPathFor('archive');
      setEmails(prev => prev.map(e => descendants.has(e.folderId) ? {...e, folderId: archiveFolder} : e));
      
      addToast(`Folder "${folderToDelete?.name}" deleted.`);
  }, [userFolders, addToast, setUserFolders, getFolderDescendants, getFolderPathFor, setEmails]);

  const reorderFolder = useCallback(async (draggedId: string, targetId: string, position: 'top' | 'bottom') => {
      setUserFolders(prev => {
          // This is a simplified reorder, a full implementation would need to handle parent changes.
           const newFolders = [...prev];
          const draggedItem = newFolders.find(f => f.id === draggedId);
          if (!draggedItem) return prev;
          const targetIndex = newFolders.findIndex(f => f.id === targetId);
          const draggedIndex = newFolders.findIndex(f => f.id === draggedId);
          newFolders.splice(draggedIndex, 1);
          newFolders.splice(targetIndex + (position === 'bottom' ? 1 : 0), 0, draggedItem);
          return newFolders.map((f, i) => ({...f, order: i}));
      });
  }, [setUserFolders]);

  // Contacts
  const addContact = useCallback(async (contact: Omit<Contact, 'id'>) => {
    const newContact = { id: generateId(), ...contact };
    setContacts(prev => [newContact, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    addToast("Contact added.");
  }, [addToast, setContacts]);

  const updateContact = useCallback(async (contact: Contact) => {
    setContacts(prev => prev.map(c => c.id === contact.id ? contact : c));
    addToast("Contact updated.");
  }, [addToast, setContacts]);

  const deleteContact = useCallback(async (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
    if (selectedContactId === contactId) setSelectedContactId(null);
    addToast("Contact deleted.");
  }, [selectedContactId, addToast, setContacts]);

  const importContacts = useCallback(async (newContacts: Omit<Contact, 'id'>[]) => {
      const existingEmails = new Set(contacts.map(c => c.email));
      const toAdd = newContacts.filter(nc => !existingEmails.has(nc.email));
      const skipped = newContacts.length - toAdd.length;
      const imported = toAdd.map(nc => ({ ...nc, id: generateId() }));

      setContacts(prev => [...prev, ...imported].sort((a,b) => a.name.localeCompare(b.name)));
      let message = `Imported ${imported.length} new contact(s).`;
      if (skipped > 0) message += ` Skipped ${skipped} duplicate(s).`;
      addToast(message);
  }, [addToast, contacts, setContacts]);
  
  // Contact Groups
  const createContactGroup = useCallback(async (name: string) => {
    const newGroup = { id: generateId(), name, contactIds: [] };
    setContactGroups(prev => [...prev, newGroup]);
    addToast(`Group "${name}" created.`);
  }, [addToast, setContactGroups]);

  const renameContactGroup = useCallback(async (groupId: string, newName: string) => {
    setContactGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
    addToast("Group renamed.");
  }, [addToast, setContactGroups]);

  const deleteContactGroup = useCallback(async (groupId: string) => {
    setContactGroups(prev => prev.filter(g => g.id !== groupId));
    if(selectedGroupId === groupId) setSelectedGroupId(null);
    addToast("Group deleted.");
  }, [selectedGroupId, addToast, setContactGroups]);

  const addContactToGroup = useCallback(async (groupId: string, contactId: string) => {
    setContactGroups(prev => prev.map(g => {
        if (g.id === groupId && !g.contactIds.includes(contactId)) {
            return { ...g, contactIds: [...g.contactIds, contactId] };
        }
        return g;
    }));
    const contactName = contacts.find(c => c.id === contactId)?.name || 'Contact';
    const groupName = contactGroups.find(g => g.id === groupId)?.name || 'group';
    addToast(`${contactName} added to ${groupName}.`);
  }, [contacts, contactGroups, addToast, setContactGroups]);

  const removeContactFromGroup = useCallback(async (groupId: string, contactId: string) => {
    setContactGroups(prev => prev.map(g => {
        if (g.id === groupId) {
            return { ...g, contactIds: g.contactIds.filter(id => id !== contactId) };
        }
        return g;
    }));
  }, [setContactGroups]);

  const contextValue = useMemo(() => ({
    user, emails, conversations: allConversations, labels, userFolders, mailboxes, folderTree, flattenedFolderTree, currentSelection, selectedConversationId, focusedConversationId, composeState, searchQuery, selectedConversationIds, theme, displayedConversations, isSidebarCollapsed, sidebarSectionOrder, view, appSettings, contacts, contactGroups, selectedContactId, selectedGroupId, isLoading, isSyncing, isSetupComplete, notificationPermission, isShortcutsModalOpen, shortcutTrigger, isOnline, isDraggingEmail, appLogs,
    login, logout, checkUserSession, getFolderPathFor, setCurrentSelection, setSelectedConversationId, setSearchQuery, openCompose, closeCompose, toggleMinimizeCompose, sendEmail, saveDraft, deleteDraft, moveConversations, toggleLabel, applyLabel, removeLabel, deleteConversation, archiveConversation, markAsRead, markAsUnread, markAsSpam, markAsNotSpam, snoozeConversation, unsubscribeFromSender, toggleConversationSelection, selectAllConversations, deselectAllConversations, bulkDelete, bulkMarkAsRead, bulkMarkAsUnread, toggleTheme, toggleSidebar, reorderSidebarSections, handleEscape, navigateConversationList, openFocusedConversation, setView, setIsShortcutsModalOpen, handleKeyboardShortcut, clearShortcutTrigger, setIsDraggingEmail, addAppLog, updateSignature, updateAutoResponder, addRule, deleteRule, updateSendDelay, completeFirstTimeSetup, updateIdentity, requestNotificationPermission, updateNotificationSettings, updateConversationView, updateBlockExternalImages, updateDisplayDensity, createTemplate, updateTemplate, deleteTemplate, updateFolderMappings, createLabel, updateLabel, deleteLabel, reorderLabel, createFolder, updateFolder, deleteFolder, getFolderDescendants, reorderFolder, addContact, updateContact, deleteContact, setSelectedContactId, importContacts, createContactGroup, renameContactGroup, deleteContactGroup, addContactToGroup, removeContactFromGroup, setSelectedGroupId,
  }), [
    user, emails, allConversations, labels, userFolders, mailboxes, folderTree, flattenedFolderTree, currentSelection, selectedConversationId, focusedConversationId, composeState, searchQuery, selectedConversationIds, theme, displayedConversations, isSidebarCollapsed, sidebarSectionOrder, view, appSettings, contacts, contactGroups, selectedContactId, selectedGroupId, isLoading, isSyncing, isSetupComplete, notificationPermission, isShortcutsModalOpen, shortcutTrigger, isOnline, isDraggingEmail, appLogs, login, logout, checkUserSession, getFolderPathFor, setCurrentSelection, setSelectedConversationId, setSearchQuery, sendEmail, saveDraft, deleteDraft, moveConversations, toggleLabel, applyLabel, removeLabel, deleteConversation, archiveConversation, markAsRead, markAsUnread, markAsSpam, markAsNotSpam, snoozeConversation, unsubscribeFromSender, toggleConversationSelection, selectAllConversations, deselectAllConversations, bulkDelete, bulkMarkAsRead, bulkMarkAsUnread, toggleTheme, toggleSidebar, reorderSidebarSections, handleEscape, navigateConversationList, openFocusedConversation, setView, setIsShortcutsModalOpen, handleKeyboardShortcut, clearShortcutTrigger, setIsDraggingEmail, addAppLog, updateSignature, updateAutoResponder, addRule, deleteRule, updateSendDelay, completeFirstTimeSetup, updateIdentity, requestNotificationPermission, updateNotificationSettings, updateConversationView, updateBlockExternalImages, updateDisplayDensity, createTemplate, updateTemplate, deleteTemplate, updateFolderMappings, createLabel, updateLabel, deleteLabel, reorderLabel, createFolder, updateFolder, deleteFolder, getFolderDescendants, reorderFolder, addContact, updateContact, deleteContact, setSelectedContactId, importContacts, createContactGroup, renameContactGroup, deleteContactGroup, addContactToGroup, removeContactFromGroup, setSelectedGroupId, openCompose, closeCompose, toggleMinimizeCompose
  ]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppContextProvider');
  }
  return context;
};
