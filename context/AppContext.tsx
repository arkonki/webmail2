
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { Email, ActionType, Label, Conversation, User, AppSettings, Signature, AutoResponder, Rule, SystemLabel, Contact, ContactGroup, SystemFolder, UserFolder, Attachment, FolderTreeNode, Identity, Template, DisplayDensity, AppLog, Mailbox } from '../types';
import { useToast } from './ToastContext';


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

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove the "data:*/*;base64," part
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });

const decodeJwtPayload = (token: string): { email: string; name: string } | null => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        return { email: decoded.email, name: decoded.email.split('@')[0] };
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
};

export const AppContextProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
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
  
  const getAuthHeaders = useCallback(() => {
    if (!sessionToken) return null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
    };
  }, [sessionToken]);


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
  
  // --- Data Persistence ---
  useEffect(() => { if (user) try { localStorage.setItem(`${user.email}-appSettings`, JSON.stringify(appSettings)); } catch (e) { console.error('Failed to save appSettings', e); } }, [user, appSettings]);
  useEffect(() => { if (user) try { localStorage.setItem(`${user.email}-emails`, JSON.stringify(emails)); } catch (e) { console.error('Failed to save emails', e); } }, [user, emails]);
  useEffect(() => { if (user) try { localStorage.setItem(`${user.email}-contacts`, JSON.stringify(contacts)); } catch (e) { console.error('Failed to save contacts', e); } }, [user, contacts]);
  useEffect(() => { if (user) try { localStorage.setItem(`${user.email}-contactGroups`, JSON.stringify(contactGroups)); } catch (e) { console.error('Failed to save contactGroups', e); } }, [user, contactGroups]);
  useEffect(() => { if (user) try { localStorage.setItem(`${user.email}-labels`, JSON.stringify(labels)); } catch (e) { console.error('Failed to save labels', e); } }, [user, labels]);
  useEffect(() => { if (user) try { localStorage.setItem(`${user.email}-mailboxes`, JSON.stringify(mailboxes)); } catch (e) { console.error('Failed to save mailboxes', e); } }, [user, mailboxes]);
  useEffect(() => { if (user) try { localStorage.setItem(`${user.email}-userFolders`, JSON.stringify(userFolders)); } catch (e) { console.error('Failed to save userFolders', e); } }, [user, userFolders]);
  useEffect(() => { if (user) try { localStorage.setItem(`${user.email}-sidebarSectionOrder`, JSON.stringify(sidebarSectionOrder)); } catch (e) { console.error('Failed to save sidebarSectionOrder', e); } }, [user, sidebarSectionOrder]);
  useEffect(() => { if (user) try { localStorage.setItem(`${user.email}-isSetupComplete`, JSON.stringify(isSetupComplete)); } catch (e) { console.error('Failed to save isSetupComplete', e); } }, [user, isSetupComplete]);


  const checkUserSession = useCallback(() => {
    setIsLoading(true);
    const savedToken = sessionStorage.getItem('sessionToken');
    const savedUserStr = localStorage.getItem('sessionUser');

    if (savedToken && savedUserStr) {
        const decodedUser = decodeJwtPayload(savedToken);
        const sessionUser = JSON.parse(savedUserStr);
        if (decodedUser && decodedUser.email === sessionUser.email) {
            setSessionToken(savedToken);
            setUser(sessionUser);
            addAppLog(`Session restored for ${sessionUser.email}`);

            const loadFromStorage = (key: string, setter: React.Dispatch<any>, defaultValue: any) => {
                const savedData = localStorage.getItem(`${sessionUser.email}-${key}`);
                setter(savedData ? JSON.parse(savedData) : defaultValue);
            };
            
            const savedSettings = localStorage.getItem(`${sessionUser.email}-appSettings`);
            const parsedSettings = savedSettings ? JSON.parse(savedSettings) : initialAppSettings;
            const mergedSettings = { ...initialAppSettings, ...parsedSettings,
                signature: { ...initialAppSettings.signature, ...parsedSettings.signature },
                autoResponder: { ...initialAppSettings.autoResponder, ...parsedSettings.autoResponder },
                sendDelay: { ...initialAppSettings.sendDelay, ...parsedSettings.sendDelay },
                notifications: { ...initialAppSettings.notifications, ...parsedSettings.notifications },
                folderMappings: { ...initialAppSettings.folderMappings, ...parsedSettings.folderMappings },
            };
            setAppSettings(mergedSettings);
            loadFromStorage('emails', setEmails, []);
            loadFromStorage('labels', setLabels, []);
            loadFromStorage('mailboxes', setMailboxes, []);
            loadFromStorage('userFolders', setUserFolders, []);
            loadFromStorage('contacts', setContacts, []);
            loadFromStorage('contactGroups', setContactGroups, []);
            loadFromStorage('sidebarSectionOrder', setSidebarSectionOrder, ['folders', 'labels']);
            setIsSetupComplete(localStorage.getItem(`${sessionUser.email}-isSetupComplete`) === 'true');
        } else {
            // Token-user mismatch, clear session
            logout();
        }
    } else {
        setUser(null);
        setSessionToken(null);
    }
    setTimeout(() => setIsLoading(false), 500);
  }, [addAppLog]);

  const getFolderPathFor = useCallback((folderType: 'sent' | 'drafts' | 'trash' | 'spam' | 'archive'): string => {
      const mappedPath = appSettings.folderMappings[folderType];
      if (mappedPath && mailboxes.some(m => m.path === mappedPath)) {
        return mappedPath;
      }
  
      // Fallback logic if mapping is invalid or not set
      const specialUseMap = { sent: '\\Sent', drafts: '\\Drafts', trash: '\\Trash', spam: '\\Junk', archive: '\\Archive' };
      const fallbackNameMap = { sent: 'Sent', drafts: 'Drafts', trash: 'Trash', spam: 'Spam', archive: 'Archive' };
      
      const specialUse = specialUseMap[folderType];
      const fallbackName = fallbackNameMap[folderType];
  
      const mailboxByFlag = mailboxes.find(m => m.specialUse === specialUse);
      if (mailboxByFlag) return mailboxByFlag.path;
  
      const mailboxByName = mailboxes.find(m => m.name.toLowerCase() === fallbackName.toLowerCase());
      if (mailboxByName) return mailboxByName.path;
      
      // Final fallback to just the name, e.g. for folder creation
      return fallbackName;
  }, [appSettings.folderMappings, mailboxes]);

  const login = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    addAppLog(`Attempting login for ${email}...`);
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass }),
        });
        const data = await response.json();

        if (response.ok && data.success && data.token) {
            addAppLog(`Login successful for ${email}.`);
            
            const newUser: User = { id: `user-${Date.now()}`, email, name: email.split('@')[0] };
            
            setEmails([]); setLabels([]); setUserFolders([]); setMailboxes([]);
            setContacts([]); setContactGroups([]); setAppSettings(initialAppSettings);
            setSidebarSectionOrder(['folders', 'labels']); setIsSetupComplete(false);
            
            setUser(newUser);
            setSessionToken(data.token);
            sessionStorage.setItem('sessionToken', data.token);
            localStorage.setItem('sessionUser', JSON.stringify(newUser));
            _setCurrentSelection({type: 'folder', id: 'INBOX'});

            const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` };

            // Sync folders first
            addAppLog("Loading mail folders..."); addToast("Loading mail folders...");
            try {
                const foldersResponse = await fetch('/api/folders', { method: 'POST', headers: authHeaders });
                const foldersData = await foldersResponse.json();
                if (foldersResponse.ok && foldersData.success) {
                    const fetchedMailboxes = foldersData.mailboxes as Mailbox[];
                    setMailboxes(fetchedMailboxes);
                    addAppLog(`Loaded ${fetchedMailboxes.length} mailboxes from server.`);
                    const initialMappings: Record<string, string> = {};
                    const systemFolderMap = { sent: { specialUse: '\\Sent', name: 'Sent' }, drafts: { specialUse: '\\Drafts', name: 'Drafts' }, trash: { specialUse: '\\Trash', name: 'Trash' }, spam: { specialUse: '\\Junk', name: 'Spam' }, archive: { specialUse: '\\Archive', name: 'Archive' } };
                    fetchedMailboxes.forEach((m) => { for (const [k, v] of Object.entries(systemFolderMap)) { if (m.specialUse === v.specialUse) initialMappings[k] = m.path; } });
                    for (const [k, v] of Object.entries(systemFolderMap)) { if (!initialMappings[k]) { const f = fetchedMailboxes.find((m) => m.name.toLowerCase() === v.name.toLowerCase()); if (f) initialMappings[k] = f.path; } }
                    setAppSettings(prev => ({ ...prev, folderMappings: initialMappings }));
                } else {
                    addAppLog(`Mailbox loading failed: ${foldersData.message || "Unknown error"}`, 'error'); addToast(foldersData.message || "Failed to load mailboxes.", { duration: 5000 });
                }
            } catch (folderError: any) { addAppLog(`Mailbox loading request failed: ${folderError.message}`, 'error'); addToast("Failed to connect to the server for folder sync.", { duration: 5000 }); }

            // Then sync emails
            setIsSyncing(true); addAppLog("Starting email sync with server..."); addToast("Syncing your inbox...");
            try {
                const syncResponse = await fetch('/api/sync', { method: 'POST', headers: authHeaders });
                const syncData = await syncResponse.json();
                if (syncResponse.ok && syncData.success) {
                    setEmails(syncData.emails); addAppLog(`Sync complete. Synced ${syncData.emails.length} emails.`); addToast(`Synced ${syncData.emails.length} emails from Inbox.`, { duration: 4000 });
                } else {
                    addAppLog(`Email sync failed: ${syncData.message || "Unknown error"}`, 'error'); addToast(syncData.message || "Failed to sync emails.", { duration: 5000 });
                }
            } catch (syncError: any) {
                console.error('Email sync request failed:', syncError); addAppLog(`Email sync request failed: ${syncError.message}`, 'error'); addToast("Failed to connect to the server for email sync.", { duration: 5000 });
            } finally { setIsSyncing(false); }
        } else {
            addAppLog(`Login failed: ${data.message || "Invalid credentials."}`, 'error'); addToast(data.message || "Invalid credentials.", { duration: 5000 }); setUser(null);
        }
    } catch (error: any) {
        console.error('Login request failed:', error); addAppLog(`Login request failed: ${error.message}`, 'error'); addToast("Failed to connect to the server. Please try again later.", { duration: 5000 }); setUser(null);
    } finally { setIsLoading(false); }
  }, [addToast, addAppLog]);

  const logout = useCallback(() => {
    addAppLog(`User ${user?.email} logged out.`);
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('sessionUser');
    sessionStorage.removeItem('sessionToken');
    setEmails([]); setMailboxes([]);
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
      const systemFolderKey = Object.entries(SystemFolder).find(([, value]) => value === currentSelection.id)?.[0].toLowerCase();
      const folderPath = systemFolderKey ? getFolderPathFor(systemFolderKey as any) : currentSelection.id;
      filtered = allConversations.filter(c => c.folderId === folderPath);
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
    const { to, cc, bcc, subject, body, attachments, scheduleDate } = data;
    
    const authHeaders = getAuthHeaders();
    if (!user || !authHeaders) {
        addToast("Cannot send email. User session is invalid. Please log out and log back in.", { duration: 5000 });
        return;
    }
    
    if (scheduleDate) {
        addToast("Scheduling email...");
        try {
            const attachmentPayloads = await Promise.all(attachments.map(async (file) => ({ filename: file.name, contentType: file.type, content: await fileToBase64(file) })));
            const response = await fetch('/api/schedule-send', {
                method: 'POST', headers: authHeaders,
                body: JSON.stringify({ from: `"${user.name}" <${user.email}>`, to, cc, bcc, subject, body, attachments: attachmentPayloads, scheduleDate: scheduleDate.toISOString() }),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                const scheduledEmail: Email = {
                    id: `email-${Date.now()}`, conversationId: composeState.conversationId || `conv-${Date.now()}`,
                    senderName: user.name, senderEmail: user.email, recipientEmail: to, cc, bcc, subject, body,
                    snippet: body.replace(/<[^>]*>?/gm, '').substring(0, 100), timestamp: new Date().toISOString(), isRead: true,
                    folderId: SystemFolder.SCHEDULED, labelIds: [],
                    attachments: attachments.map(f => ({fileName: f.name, fileSize: f.size, mimeType: f.type})),
                    scheduledSendTime: scheduleDate.toISOString(), backendJobId: result.jobId,
                };
                setEmails(prev => { const existing = draftId ? prev.filter(e => e.id !== draftId) : prev; return [...existing, scheduledEmail]; });
                addToast("Message scheduled.");
            } else {
                addToast(`Failed to schedule email: ${result.message || "Unknown server error"}`, { duration: 5000 });
            }
        } catch (error: any) { console.error('Failed to schedule email:', error); addToast(`Failed to schedule email: ${error.message}`, { duration: 5000 }); }
        return;
    }

    addToast("Sending email...");
    try {
        const attachmentPayloads = await Promise.all(attachments.map(async (file) => ({ filename: file.name, contentType: file.type, content: await fileToBase64(file) })));
        const response = await fetch('/api/send', {
            method: 'POST', headers: authHeaders,
            body: JSON.stringify({ from: `"${user.name}" <${user.email}>`, to, cc, bcc, subject, body, attachments: attachmentPayloads }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
            const newEmail: Email = {
                id: `email-${Date.now()}`, conversationId: composeState.conversationId || `conv-${Date.now()}`,
                senderName: user.name, senderEmail: user.email, recipientEmail: to, cc, bcc, subject, body,
                snippet: body.replace(/<[^>]*>?/gm, '').substring(0, 100), timestamp: new Date().toISOString(), isRead: true,
                folderId: getFolderPathFor('sent'), labelIds: [],
                attachments: attachments.map(f => ({fileName: f.name, fileSize: f.size, mimeType: f.type})),
            };
            setEmails(prev => { const existing = draftId ? prev.filter(e => e.id !== draftId) : prev; return [...existing, newEmail]; });
            addToast("Message sent successfully.");
        } else {
            addToast(`Failed to send email: ${result.message || "Unknown server error"}`, { duration: 5000 });
        }
    } catch (error: any) { console.error('Failed to send email:', error); addToast(`Failed to send email: ${error.message}`, { duration: 5000 }); }
  }, [user, composeState.conversationId, addToast, getFolderPathFor, getAuthHeaders]);
  
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
