
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

export const AppContextProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionPassword, setSessionPassword] = useState<string | null>(null);
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
    const sessionUserStr = localStorage.getItem('sessionUser');
    const savedPassword = sessionStorage.getItem('sessionPassword');

    if (sessionUserStr && savedPassword) {
      const sessionUser = JSON.parse(sessionUserStr);
      setUser(sessionUser);
      setSessionPassword(savedPassword);
      addAppLog(`Session restored for ${sessionUser.email}`);

      const loadFromStorage = (key: string, setter: React.Dispatch<any>, defaultValue: any) => {
          const savedData = localStorage.getItem(`${sessionUser.email}-${key}`);
          setter(savedData ? JSON.parse(savedData) : defaultValue);
      };
      
      const savedSettings = localStorage.getItem(`${sessionUser.email}-appSettings`);
      const parsedSettings = savedSettings ? JSON.parse(savedSettings) : initialAppSettings;
      const mergedSettings = {
        ...initialAppSettings, ...parsedSettings,
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
        setUser(null);
        setSessionPassword(null);
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

        if (response.ok && data.success) {
            addAppLog(`Login successful for ${email}.`);
            
            const newUser: User = { id: `user-${Date.now()}`, email, name: email.split('@')[0] };
            
            setEmails([]);
            setLabels([]);
            setUserFolders([]);
            setMailboxes([]);
            setContacts([]);
            setContactGroups([]);
            setAppSettings(initialAppSettings);
            setSidebarSectionOrder(['folders', 'labels']);
            setIsSetupComplete(false);
            
            setUser(newUser);
            setSessionPassword(pass);
            sessionStorage.setItem('sessionPassword', pass);
            localStorage.setItem('sessionUser', JSON.stringify(newUser));
            _setCurrentSelection({type: 'folder', id: 'INBOX'});


            // Sync folders first
            addAppLog("Loading mail folders...");
            addToast("Loading mail folders...");
            try {
                const foldersResponse = await fetch('/api/folders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password: pass }),
                });
                const foldersData = await foldersResponse.json();
                if (foldersResponse.ok && foldersData.success) {
                    const fetchedMailboxes = foldersData.mailboxes as Mailbox[];
                    setMailboxes(fetchedMailboxes);
                    addAppLog(`Loaded ${fetchedMailboxes.length} mailboxes from server.`);

                    // Create initial default folder mappings based on server flags
                    const initialMappings: Record<string, string> = {};
                    const systemFolderMap = {
                        sent: { specialUse: '\\Sent', name: 'Sent' },
                        drafts: { specialUse: '\\Drafts', name: 'Drafts' },
                        trash: { specialUse: '\\Trash', name: 'Trash' },
                        spam: { specialUse: '\\Junk', name: 'Spam' },
                        archive: { specialUse: '\\Archive', name: 'Archive' },
                    };

                    fetchedMailboxes.forEach((mailbox) => {
                        for (const [key, value] of Object.entries(systemFolderMap)) {
                            if (mailbox.specialUse === value.specialUse) {
                                initialMappings[key] = mailbox.path;
                            }
                        }
                    });

                    // Fallback to matching by name if specialUse flags are missing
                    for (const [key, value] of Object.entries(systemFolderMap)) {
                        if (!initialMappings[key]) {
                            const fallback = fetchedMailboxes.find((m) => m.name.toLowerCase() === value.name.toLowerCase());
                            if (fallback) {
                                initialMappings[key] = fallback.path;
                            }
                        }
                    }
                    setAppSettings(prev => ({ ...prev, folderMappings: initialMappings }));

                } else {
                    addAppLog(`Mailbox loading failed: ${foldersData.message || "Unknown error"}`, 'error');
                    addToast(foldersData.message || "Failed to load mailboxes.", { duration: 5000 });
                }
            } catch (folderError: any) {
                 addAppLog(`Mailbox loading request failed: ${folderError.message}`, 'error');
                 addToast("Failed to connect to the server for folder sync.", { duration: 5000 });
            }

            // Then sync emails from inbox
            setIsSyncing(true);
            addAppLog("Starting email sync with server...");
            addToast("Syncing your inbox...");
            try {
                const syncResponse = await fetch('/api/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password: pass }),
                });
                const syncData = await syncResponse.json();
                if (syncResponse.ok && syncData.success) {
                    setEmails(syncData.emails);
                    addAppLog(`Sync complete. Synced ${syncData.emails.length} emails.`);
                    addToast(`Synced ${syncData.emails.length} emails from Inbox.`, { duration: 4000 });
                } else {
                    addAppLog(`Email sync failed: ${syncData.message || "Unknown error"}`, 'error');
                    addToast(syncData.message || "Failed to sync emails.", { duration: 5000 });
                }
            } catch (syncError: any) {
                console.error('Email sync request failed:', syncError);
                addAppLog(`Email sync request failed: ${syncError.message}`, 'error');
                addToast("Failed to connect to the server for email sync.", { duration: 5000 });
            } finally {
                setIsSyncing(false);
            }
        } else {
            addAppLog(`Login failed: ${data.message || "Invalid credentials."}`, 'error');
            addToast(data.message || "Invalid credentials.", { duration: 5000 });
            setUser(null);
        }
    } catch (error: any) {
        console.error('Login request failed:', error);
        addAppLog(`Login request failed: ${error.message}`, 'error');
        addToast("Failed to connect to the server. Please try again later.", { duration: 5000 });
        setUser(null);
    } finally {
        setIsLoading(false);
    }
  }, [addToast, addAppLog]);

  const logout = useCallback(() => {
    addAppLog(`User ${user?.email} logged out.`);
    setUser(null);
    setSessionPassword(null);
    localStorage.removeItem('sessionUser');
    sessionStorage.removeItem('sessionPassword'); // Clear password from session storage
    setEmails([]);
    setMailboxes([]);
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

    // Initialize all nodes
    userCreatedFolders.forEach(folder => {
        nodes[folder.path] = { id: folder.path, name: folder.name, children: [], level: 0, order: 0 };
    });

    // Build the tree
    userCreatedFolders.forEach(folder => {
        const pathParts = folder.path.split(delimiter);
        if (pathParts.length > 1) {
            const parentPath = pathParts.slice(0, -1).join(delimiter);
            if (nodes[parentPath]) {
                nodes[parentPath].children.push(nodes[folder.path]);
            } else {
                tree.push(nodes[folder.path]);
            }
        } else {
            tree.push(nodes[folder.path]);
        }
    });
    
    // Set levels recursively
    const setLevels = (nodesToProcess: FolderTreeNode[], level: number) => {
        nodesToProcess.forEach(node => {
            node.level = level;
            setLevels(node.children, level + 1);
        });
    };
    setLevels(tree, 0);

    return tree;
}, [mailboxes]);

const flattenedFolderTree = useMemo<FolderTreeNode[]>(() => {
    const result: FolderTreeNode[] = [];
    const traverse = (nodes: FolderTreeNode[]) => {
        nodes.forEach(node => {
            result.push(node);
            traverse(node.children);
        });
    };
    traverse(folderTree);
    return result;
}, [folderTree]);
  
  // --- Mail Actions ---
  const openCompose = useCallback((config: Partial<Omit<ComposeState, 'isOpen'>> = {}) => { setComposeState({ isOpen: true, ...config }); }, []);
  const closeCompose = useCallback(() => { setComposeState({ isOpen: false }); }, []);
  const toggleMinimizeCompose = useCallback(() => { setComposeState(prev => ({...prev, isMinimized: !prev.isMinimized}))}, []);

  const sendEmail = useCallback((data: SendEmailData, draftId?: string) => {
    if (appSettings.sendDelay.isEnabled && !data.scheduleDate) {
        addToast("Sending...", { 
            duration: appSettings.sendDelay.duration * 1000, 
            action: { label: "Undo", onClick: cancelSend }
        });
        const timerId = window.setTimeout(() => {
            actuallySendEmail(data, draftId);
            setPendingSend(null);
        }, appSettings.sendDelay.duration * 1000);
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
    
    if (!user || !sessionPassword) {
        addToast("Cannot send email. User session is invalid. Please log out and log back in.", { duration: 5000 });
        return;
    }
    
    if (scheduleDate) {
        addToast("Scheduling email...");
        try {
            const attachmentPayloads = await Promise.all(
                attachments.map(async (file) => ({
                    filename: file.name,
                    contentType: file.type,
                    content: await fileToBase64(file),
                }))
            );

            const response = await fetch('/api/schedule-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    password: sessionPassword,
                    from: `"${user.name}" <${user.email}>`,
                    to, cc, bcc, subject, body,
                    attachments: attachmentPayloads,
                    scheduleDate: scheduleDate.toISOString(),
                }),
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                const scheduledEmail: Email = {
                    id: `email-${Date.now()}`,
                    conversationId: composeState.conversationId || `conv-${Date.now()}`,
                    senderName: user.name, senderEmail: user.email, recipientEmail: to, cc, bcc, subject, body,
                    snippet: body.replace(/<[^>]*>?/gm, '').substring(0, 100),
                    timestamp: new Date().toISOString(), isRead: true,
                    folderId: SystemFolder.SCHEDULED, // This is a client-side only folder concept
                    labelIds: [],
                    attachments: attachments.map(f => ({fileName: f.name, fileSize: f.size, mimeType: f.type})),
                    scheduledSendTime: scheduleDate.toISOString(),
                    backendJobId: result.jobId,
                };
                setEmails(prev => {
                    const existing = draftId ? prev.filter(e => e.id !== draftId) : prev;
                    return [...existing, scheduledEmail];
                });
                addToast("Message scheduled.");
            } else {
                addToast(`Failed to schedule email: ${result.message || "Unknown server error"}`, { duration: 5000 });
            }
        } catch (error: any) {
            console.error('Failed to schedule email:', error);
            addToast(`Failed to schedule email: ${error.message}`, { duration: 5000 });
        }
        return;
    }

    addToast("Sending email...");
    try {
        const attachmentPayloads = await Promise.all(
            attachments.map(async (file) => ({
                filename: file.name,
                contentType: file.type,
                content: await fileToBase64(file),
            }))
        );

        const response = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email, password: sessionPassword,
                from: `"${user.name}" <${user.email}>`,
                to, cc, bcc, subject, body,
                attachments: attachmentPayloads,
            }),
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            const newEmail: Email = {
                id: `email-${Date.now()}`,
                conversationId: composeState.conversationId || `conv-${Date.now()}`,
                senderName: user.name, senderEmail: user.email, recipientEmail: to, cc, bcc, subject, body,
                snippet: body.replace(/<[^>]*>?/gm, '').substring(0, 100),
                timestamp: new Date().toISOString(), isRead: true,
                folderId: getFolderPathFor('sent'),
                labelIds: [],
                attachments: attachments.map(f => ({fileName: f.name, fileSize: f.size, mimeType: f.type})),
            };
            
            setEmails(prev => {
                const existing = draftId ? prev.filter(e => e.id !== draftId) : prev;
                return [...existing, newEmail];
            });
            addToast("Message sent successfully.");
        } else {
            addToast(`Failed to send email: ${result.message || "Unknown server error"}`, { duration: 5000 });
        }
    } catch (error: any) {
        console.error('Failed to send email:', error);
        addToast(`Failed to send email: ${error.message}`, { duration: 5000 });
    }

  }, [user, sessionPassword, composeState.conversationId, addToast, getFolderPathFor]);
  
  const saveDraft = useCallback((data: SendEmailData, draftId?: string): string => {
      const draft: Email = {
        id: draftId || `email-${Date.now()}`,
        conversationId: composeState.conversationId || `conv-${Date.now()}`,
        senderName: user?.name || '', senderEmail: user?.email || '', recipientEmail: data.to,
        cc: data.cc, bcc: data.bcc, subject: data.subject, body: data.body,
        snippet: data.body.replace(/<[^>]*>?/gm, '').substring(0, 100),
        timestamp: new Date().toISOString(), isRead: true,
        folderId: getFolderPathFor('drafts'),
        labelIds: [],
      };
      
      setEmails(prev => {
          const withoutOld = draftId ? prev.filter(e => e.id !== draftId) : prev;
          return [...withoutOld, draft];
      });
      addToast(draftId ? "Draft updated." : "Draft saved.");
      return draft.id;
  }, [user, composeState.conversationId, addToast, getFolderPathFor]);

  const deleteDraft = useCallback((draftId: string) => {
      setEmails(prev => prev.filter(e => e.id !== draftId));
      addToast("Draft discarded.");
  }, [addToast]);
  
  const moveConversations = useCallback((conversationIds: string[], targetFolderId: string) => {
    setEmails(prevEmails => 
        prevEmails.map(email => 
            conversationIds.includes(email.conversationId) 
            ? { ...email, folderId: targetFolderId, labelIds: email.labelIds.filter(l => l !== SystemLabel.SNOOZED), snoozedUntil: undefined } 
            : email
        )
    );
    const folderName = mailboxes.find(f => f.path === targetFolderId)?.name || targetFolderId;
    addToast(`${conversationIds.length} conversation(s) moved to "${folderName}".`);
    deselectAllConversations();
    if (conversationIds.includes(selectedConversationId || '')) setSelectedConversationId(null);
  }, [mailboxes, addToast, deselectAllConversations, selectedConversationId]);

  const applyLabel = useCallback((conversationIds: string[], labelId: string) => {
    setEmails(prevEmails =>
      prevEmails.map(email =>
        conversationIds.includes(email.conversationId) && !email.labelIds.includes(labelId)
          ? { ...email, labelIds: [...email.labelIds, labelId] }
          : email
      )
    );
    addToast(`Applied label "${labels.find(l=>l.id===labelId)?.name || ''}" to ${conversationIds.length} conversation(s).`);
  }, [labels, addToast]);

  const removeLabel = useCallback((conversationIds: string[], labelId: string) => {
    setEmails(prevEmails =>
      prevEmails.map(email =>
        conversationIds.includes(email.conversationId)
          ? { ...email, labelIds: email.labelIds.filter(id => id !== labelId) }
          : email
      )
    );
    addToast("Label removed.");
  }, [addToast]);

  const toggleLabel = useCallback((conversationIds: string[], labelId: string) => {
    const isAdding = !allConversations.find(c => c.id === conversationIds[0])?.labelIds.includes(labelId);
    if(isAdding) applyLabel(conversationIds, labelId);
    else removeLabel(conversationIds, labelId);
  }, [allConversations, applyLabel, removeLabel]);

  const deleteConversation = useCallback((conversationIds: string[]) => {
    const emailsToProcess = emails.filter(e => conversationIds.includes(e.conversationId));
    const scheduledEmailsToDelete = emailsToProcess.filter(e => e.backendJobId);

    if (scheduledEmailsToDelete.length > 0) {
        scheduledEmailsToDelete.forEach(async (email) => {
            if (email.backendJobId) {
                try {
                    await fetch('/api/cancel-scheduled-send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ jobId: email.backendJobId }),
                    });
                } catch (error) {
                    console.error(`Failed to cancel scheduled send for job: ${email.backendJobId}`, error);
                }
            }
        });
    }
      
    const isCurrentlyInTrashView = currentSelection.type === 'folder' && currentSelection.id === SystemFolder.TRASH;

    if (isCurrentlyInTrashView) {
      setEmails(prev => prev.filter(e => !conversationIds.includes(e.conversationId)));
      addToast(`${conversationIds.length} conversation(s) permanently deleted.`);
    } else {
      moveConversations(conversationIds, getFolderPathFor('trash'));
    }
  }, [currentSelection, moveConversations, addToast, emails, getFolderPathFor]);

  const archiveConversation = useCallback((conversationIds: string[]) => {
      const archivePath = getFolderPathFor('archive');
      if (mailboxes.some(m => m.path === archivePath)) {
        moveConversations(conversationIds, archivePath)
      } else {
        addToast("Please create an 'Archive' folder first to use this feature.", {duration: 4000});
      }
  }, [moveConversations, mailboxes, addToast, getFolderPathFor]);

  const markAsRead = useCallback((conversationId: string) => { setEmails(prev => prev.map(e => e.conversationId === conversationId ? { ...e, isRead: true } : e)); }, []);
  const markAsUnread = useCallback((conversationIds: string[]) => { setEmails(prev => prev.map(e => conversationIds.includes(e.conversationId) ? { ...e, isRead: false } : e)); addToast(`Marked ${conversationIds.length} item(s) as unread.`); if (conversationIds.includes(selectedConversationId || '')) setSelectedConversationId(null); }, [addToast, selectedConversationId]);
  
  const markAsSpam = useCallback((conversationIds: string[]) => {
    moveConversations(conversationIds, getFolderPathFor('spam'));
  }, [moveConversations, getFolderPathFor]);
  
  const markAsNotSpam = useCallback((conversationIds: string[]) => {
    moveConversations(conversationIds, 'INBOX');
  }, [moveConversations]);

  // Settings actions
  const updateSignature = useCallback((signature: Signature) => { setAppSettings(prev => ({...prev, signature})); addToast("Signature settings updated."); }, [addToast]);
  const updateAutoResponder = useCallback((autoResponder: AutoResponder) => { setAppSettings(prev => ({...prev, autoResponder})); addToast("Auto-responder settings updated."); }, [addToast]);
  const addRule = useCallback((rule: Omit<Rule, 'id'>) => { setAppSettings(prev => ({...prev, rules: [...prev.rules, {...rule, id: `rule-${Date.now()}`}]})); addToast("Rule added."); }, [addToast]);
  const deleteRule = useCallback((ruleId: string) => { setAppSettings(prev => ({...prev, rules: prev.rules.filter(r => r.id !== ruleId)})); addToast("Rule deleted."); }, [addToast]);
  const updateSendDelay = useCallback((sendDelay: AppSettings['sendDelay']) => { setAppSettings(prev => ({...prev, sendDelay})); addToast("Send delay settings updated."); }, [addToast]);
  const updateConversationView = useCallback((enabled: boolean) => { setAppSettings(prev => ({...prev, conversationView: enabled })); addToast(enabled ? "Conversation view enabled." : "Conversation view disabled."); }, [addToast]);
  const updateBlockExternalImages = useCallback((enabled: boolean) => { setAppSettings(prev => ({...prev, blockExternalImages: enabled })); addToast(enabled ? "External images will be blocked by default." : "External images will be shown by default."); }, [addToast]);
  const updateDisplayDensity = useCallback((density: DisplayDensity) => { setAppSettings(prev => ({...prev, displayDensity: density})); addToast(`Display density set to ${density}.`); }, [addToast]);
  const createTemplate = useCallback((name: string, body: string) => { const newTemplate = { id: `template-${Date.now()}`, name, body }; setAppSettings(prev => ({ ...prev, templates: [...prev.templates, newTemplate] })); addToast(`Template "${name}" created.`); }, [addToast]);
  const updateTemplate = useCallback((id: string, updates: Partial<Omit<Template, 'id'>>) => { setAppSettings(prev => ({ ...prev, templates: prev.templates.map(t => t.id === id ? {...t, ...updates} : t) })); addToast("Template updated."); }, [addToast]);
  const deleteTemplate = useCallback((id: string) => { setAppSettings(prev => ({ ...prev, templates: prev.templates.filter(t => t.id !== id) })); addToast("Template deleted."); }, [addToast]);
  const updateFolderMappings = useCallback((mappings: Record<string, string>) => { setAppSettings(prev => ({...prev, folderMappings: mappings})); addToast("System folder mappings updated."); }, [addToast]);

  const snoozeConversation = useCallback((conversationIds: string[], until: Date) => {
    let archiveFolder = getFolderPathFor('archive');
    setEmails(prev => prev.map(e => {
        if(conversationIds.includes(e.conversationId)) {
            const newLabelIds = [...new Set([...e.labelIds, SystemLabel.SNOOZED])];
            return {...e, snoozedUntil: until.toISOString(), folderId: archiveFolder || 'INBOX', labelIds: newLabelIds};
        }
        return e;
    }));
    addToast(`${conversationIds.length} conversation(s) snoozed.`);
    deselectAllConversations();
    if (conversationIds.includes(selectedConversationId || '')) setSelectedConversationId(null);
  }, [addToast, deselectAllConversations, selectedConversationId, getFolderPathFor]);
  
  const unsubscribeFromSender = useCallback((senderEmail: string) => {
    addRule({
        condition: { field: 'sender', operator: 'contains', value: senderEmail },
        action: { type: 'moveToFolder', folderId: getFolderPathFor('trash') }
    });
    addToast(`Unsubscribed from ${senderEmail}. Future messages will be moved to Trash.`);
  }, [addRule, addToast, getFolderPathFor]);

  // Bulk selection actions
  const toggleConversationSelection = useCallback((conversationId: string) => { setSelectedConversationIds(prev => { const next = new Set(prev); if (next.has(conversationId)) { next.delete(conversationId); } else { next.add(conversationId); } return next; }); }, []);
  const selectAllConversations = useCallback((conversationIds: string[]) => setSelectedConversationIds(new Set(conversationIds)), []);
  const bulkDelete = useCallback(() => { deleteConversation(Array.from(selectedConversationIds)); deselectAllConversations(); }, [selectedConversationIds, deleteConversation, deselectAllConversations]);
  const bulkMarkAsRead = useCallback(() => { const ids = Array.from(selectedConversationIds); setEmails(prev => prev.map(e => ids.includes(e.conversationId) ? { ...e, isRead: true } : e)); addToast(`Marked ${ids.length} item(s) as read.`); deselectAllConversations(); }, [selectedConversationIds, deselectAllConversations, addToast]);
  const bulkMarkAsUnread = useCallback(() => { markAsUnread(Array.from(selectedConversationIds)); deselectAllConversations(); }, [selectedConversationIds, markAsUnread, deselectAllConversations]);
  
  // UI actions
  const toggleTheme = useCallback(() => { setTheme(prev => { const newTheme = prev === 'light' ? 'dark' : 'light'; localStorage.setItem('theme', newTheme); return newTheme; }); }, []);
  const toggleSidebar = useCallback(() => { setIsSidebarCollapsed(prev => { const newState = !prev; localStorage.setItem('isSidebarCollapsed', String(newState)); return newState; }); }, []);
  const reorderSidebarSections = useCallback((draggedId: SidebarSection, targetId: SidebarSection) => {
      setSidebarSectionOrder(prev => {
          const draggedIndex = prev.indexOf(draggedId);
          const targetIndex = prev.indexOf(targetId);
          const newOrder = [...prev];
          newOrder.splice(draggedIndex, 1);
          newOrder.splice(targetIndex, 0, draggedId);
          return newOrder;
      });
  }, []);
  const handleEscape = useCallback(() => {
      if(composeState.isOpen && !composeState.isMinimized) closeCompose();
      else if(selectedConversationId) setSelectedConversationId(null);
      else if(selectedConversationIds.size > 0) deselectAllConversations();
  }, [composeState, selectedConversationId, selectedConversationIds, closeCompose, deselectAllConversations]);

  const navigateConversationList = useCallback((direction: 'up' | 'down') => {
    const ids = displayedConversations.map(c => c.id);
    if(ids.length === 0) return;
    const currentIndex = focusedConversationId ? ids.indexOf(focusedConversationId) : -1;
    let nextIndex;
    if(direction === 'down') {
        nextIndex = currentIndex < ids.length - 1 ? currentIndex + 1 : 0;
    } else { // up
        nextIndex = currentIndex > 0 ? currentIndex - 1 : ids.length - 1;
    }
    setFocusedConversationId(ids[nextIndex]);
  }, [displayedConversations, focusedConversationId]);

  const openFocusedConversation = useCallback(() => {
    if(focusedConversationId) {
        setSelectedConversationId(focusedConversationId);
        markAsRead(focusedConversationId);
    }
  }, [focusedConversationId, markAsRead]);
  
  const clearShortcutTrigger = useCallback(() => setShortcutTrigger(null), []);

  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLDivElement && e.target.isContentEditable) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const newKeySequence = [...keySequence, e.key];
    const sequenceStr = newKeySequence.join('');
    if (sequenceStr === 'gi') { _setCurrentSelection({type: 'folder', id: SystemFolder.INBOX}); setKeySequence([]); return; }
    if (sequenceStr === 'gs') { _setCurrentSelection({type: 'folder', id: SystemFolder.SENT}); setKeySequence([]); return; }
    
    if ('gs'.startsWith(sequenceStr)) { setKeySequence(newKeySequence); } else { setKeySequence([]); }

    switch (e.key) {
      case 'c': openCompose(); break;
      case '/': e.preventDefault(); setSearchQuery(''); break;
      case 'Escape': handleEscape(); break;
      case 'j': case 'ArrowDown': e.preventDefault(); navigateConversationList('down'); break;
      case 'k': case 'ArrowUp': e.preventDefault(); navigateConversationList('up'); break;
      case 'Enter': e.preventDefault(); openFocusedConversation(); break;
      case 'x': if(focusedConversationId) toggleConversationSelection(focusedConversationId); break;
      case '#':
          const idsToDelete = selectedConversationIds.size > 0 ? Array.from(selectedConversationIds) : (focusedConversationId ? [focusedConversationId] : []);
          if(idsToDelete.length > 0) deleteConversation(idsToDelete);
          break;
       case 'e':
          const idsToArchive = selectedConversationIds.size > 0 ? Array.from(selectedConversationIds) : (focusedConversationId ? [focusedConversationId] : []);
          if(idsToArchive.length > 0) archiveConversation(idsToArchive);
          break;
       case '_':
            const idsToMarkUnread = selectedConversationIds.size > 0 ? Array.from(selectedConversationIds) : (focusedConversationId ? [focusedConversationId] : []);
            if (idsToMarkUnread.length > 0) markAsUnread(idsToMarkUnread);
            break;
       case 'l':
             const idsForLabel = selectedConversationIds.size > 0 ? Array.from(selectedConversationIds) : (focusedConversationId ? [focusedConversationId] : []);
            if (idsForLabel.length > 0) setShortcutTrigger({ type: 'openLabelPopover', ts: Date.now() });
            break;
       case '?':
            setIsShortcutsModalOpen(true);
            break;
    }
  }, [keySequence, openCompose, handleEscape, navigateConversationList, openFocusedConversation, focusedConversationId, toggleConversationSelection, deleteConversation, selectedConversationIds, archiveConversation, markAsUnread, getFolderPathFor]);
  
  const completeFirstTimeSetup = useCallback((name: string, accountType: 'personal' | 'business') => {
    if(!user) return;
    const newIdentity: Identity = { id: `identity-${Date.now()}`, name: name, email: user.email, accountType: accountType };
    setAppSettings(prev => ({...prev, identities: [newIdentity]}));
    setIsSetupComplete(true);
    addToast("Welcome! Your settings have been saved.");
  }, [user, addToast]);
  
  const updateIdentity = useCallback((identity: Identity) => {
    setAppSettings(prev => ({...prev, identities: prev.identities.map(id => id.id === identity.id ? identity : id)}));
    addToast("Identity updated.");
  }, [addToast]);

  const updateNotificationSettings = useCallback((enabled: boolean) => {
    if(enabled && notificationPermission !== 'granted') { addToast("Please enable notification permissions in your browser first."); return; }
    setAppSettings(prev => ({...prev, notifications: { enabled }}));
    addToast(enabled ? "Desktop notifications enabled." : "Desktop notifications disabled.");
  }, [notificationPermission, addToast]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) { addToast("This browser does not support desktop notification"); return; }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') { updateNotificationSettings(true); addToast("Desktop notifications enabled!");
    } else { updateNotificationSettings(false); addToast("Notifications permission not granted."); }
  }, [addToast, updateNotificationSettings]);

  // Label Management
  const createLabel = useCallback((name: string, color: string) => { const newLabel: Label = { id: `label-${Date.now()}`, name, color, order: labels.length }; setLabels(prev => [...prev, newLabel]); addToast(`Label "${name}" created.`); }, [labels.length, addToast]);
  const updateLabel = useCallback((id: string, updates: Partial<Omit<Label, 'id'>>) => { setLabels(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l)); addToast("Label updated."); }, [addToast]);
  const deleteLabel = useCallback((id: string) => { setEmails(prev => prev.map(e => ({...e, labelIds: e.labelIds.filter(lId => lId !== id)}))); setLabels(prev => prev.filter(l => l.id !== id)); addToast(`Label "${labels.find(l=>l.id===id)?.name || ''}" deleted.`); }, [labels, addToast]);
  
  const reorderLabel = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {
      setLabels(prevLabels => {
          const draggedIndex = prevLabels.findIndex(l => l.id === draggedId);
          const targetIndex = prevLabels.findIndex(l => l.id === targetId);
          if (draggedIndex === -1 || targetIndex === -1) return prevLabels;
          const newLabels = [...prevLabels];
          const [draggedItem] = newLabels.splice(draggedIndex, 1);
          let insertIndex = targetIndex;
          if (position === 'bottom') insertIndex += 1;
          if (draggedIndex < targetIndex && position === 'bottom') insertIndex -=1;
          newLabels.splice(insertIndex, 0, draggedItem);
          return newLabels.map((label, index) => ({ ...label, order: index }));
      });
  }, []);
  
  // Folder Management
  const createFolder = useCallback((name: string, parentId?: string) => { const newFolder: UserFolder = { id: `folder-${Date.now()}`, name, parentId, order: userFolders.filter(f => f.parentId === parentId).length }; setUserFolders(prev => [...prev, newFolder]); addToast(`Folder "${name}" created.`); }, [userFolders, addToast]);
  const updateFolder = useCallback((id: string, newName: string, newParentId?: string) => { setUserFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName, parentId: newParentId } : f)); addToast("Folder updated."); }, [addToast]);
  
  const getFolderDescendants = useCallback((folderId: string): Set<string> => {
    const descendants = new Set<string>();
    const toProcess = [folderId];
    while(toProcess.length > 0) {
        const currentId = toProcess.pop()!;
        const children = userFolders.filter(f => f.parentId === currentId);
        children.forEach(child => { descendants.add(child.id); toProcess.push(child.id); });
    }
    return descendants;
  }, [userFolders]);

  const deleteFolder = useCallback((id: string) => {
    const folderToDelete = userFolders.find(f => f.id === id);
    if (!folderToDelete) return;
    const descendantIds = getFolderDescendants(id);
    const idsToDelete = new Set([id, ...descendantIds]);
    
    setEmails(prev => prev.map(e => idsToDelete.has(e.folderId) ? { ...e, folderId: SystemFolder.ARCHIVE } : e));
    setUserFolders(prev => prev.filter(f => !idsToDelete.has(f.id)));
    addToast(`Folder "${folderToDelete.name}" and its subfolders deleted. Contents moved to Archive.`);
  }, [userFolders, getFolderDescendants, addToast]);

  const reorderFolder = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {
      setUserFolders(prevFolders => {
          const draggedFolder = prevFolders.find(f => f.id === draggedId);
          const targetFolder = prevFolders.find(f => f.id === targetId);
          if (!draggedFolder || !targetFolder || draggedFolder.parentId !== targetFolder.parentId) {
              addToast("Folders can only be reordered within the same level.");
              return prevFolders;
          }
          const siblings = prevFolders.filter(f => f.parentId === draggedFolder.parentId).sort((a,b) => a.order - b.order);
          const draggedIndex = siblings.findIndex(f => f.id === draggedId);
          const targetIndex = siblings.findIndex(f => f.id === targetId);
          const newSiblings = [...siblings];
          const [movedItem] = newSiblings.splice(draggedIndex, 1);
          let insertIndex = targetIndex;
          if (position === 'bottom') insertIndex += 1;
           if (draggedIndex < targetIndex && position === 'bottom') insertIndex -=1;
          newSiblings.splice(insertIndex, 0, movedItem);
          const updatedOrders = new Map<string, number>();
          newSiblings.forEach((f, index) => updatedOrders.set(f.id, index));
          return prevFolders.map(f => updatedOrders.has(f.id) ? { ...f, order: updatedOrders.get(f.id)! } : f);
      });
  }, [addToast]);

  // Contacts
  const addContact = useCallback((contactData: Omit<Contact, 'id'>) => {
      const newContact: Contact = { id: `contact-${Date.now()}`, ...contactData };
      setContacts(prev => [newContact, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
      addToast("Contact added.");
  }, [addToast]);
  const updateContact = useCallback((updatedContact: Contact) => {
      setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
      addToast("Contact updated.");
  }, [addToast]);
  const deleteContact = useCallback((contactId: string) => {
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setContactGroups(prev => prev.map(g => ({...g, contactIds: g.contactIds.filter(id => id !== contactId)})));
      setSelectedContactId(null);
      addToast("Contact deleted.");
  }, [addToast]);
  
  const importContacts = useCallback((newContacts: Omit<Contact, 'id'>[]) => {
      let addedCount = 0; let skippedCount = 0;
      setContacts(prev => {
          const existingEmails = new Set(prev.map(c => c.email.toLowerCase()));
          const contactsToAdd: Contact[] = [];
          newContacts.forEach(newContact => {
              if(!existingEmails.has(newContact.email.toLowerCase())) {
                  contactsToAdd.push({ id: `contact-${Date.now()}-${addedCount}`, ...newContact });
                  existingEmails.add(newContact.email.toLowerCase());
                  addedCount++;
              } else { skippedCount++; }
          });
          return [...prev, ...contactsToAdd].sort((a,b) => a.name.localeCompare(b.name));
      });
      if(addedCount > 0) addToast(`Imported ${addedCount} new contact(s).`);
      if(skippedCount > 0) addToast(`Skipped ${skippedCount} duplicate(s).`);
      if(addedCount === 0 && skippedCount > 0) addToast("No new contacts to import.");
  }, [addToast]);
  
  // Contact Groups
  const createContactGroup = useCallback((name: string) => { const newGroup = {id: `group-${Date.now()}`, name, contactIds: []}; setContactGroups(prev => [...prev, newGroup]); addToast(`Group "${name}" created.`); }, [addToast]);
  const renameContactGroup = useCallback((groupId: string, newName: string) => { setContactGroups(prev => prev.map(g => g.id === groupId ? {...g, name: newName} : g)); addToast("Group renamed."); }, [addToast]);
  const deleteContactGroup = useCallback((groupId: string) => { setContactGroups(prev => prev.filter(g => g.id !== groupId)); addToast("Group deleted."); }, [addToast]);
  const addContactToGroup = useCallback((groupId: string, contactId: string) => { setContactGroups(prev => prev.map(g => g.id === groupId ? {...g, contactIds: [...new Set([...g.contactIds, contactId])]} : g)); const gName = contactGroups.find(g=>g.id===groupId)?.name || ''; const cName = contacts.find(c=>c.id===contactId)?.name || ''; addToast(`${cName} added to ${gName}.`); }, [contactGroups, contacts, addToast]);
  const removeContactFromGroup = useCallback((groupId: string, contactId: string) => { setContactGroups(prev => prev.map(g => g.id === groupId ? {...g, contactIds: g.contactIds.filter(id => id !== contactId)} : g)); }, []);
  

  const value = {
    user, emails, labels, userFolders, mailboxes, conversations: allConversations, currentSelection, selectedConversationId, composeState, searchQuery, selectedConversationIds, theme, displayedConversations, isSidebarCollapsed, sidebarSectionOrder, view, appSettings, contacts, contactGroups, selectedContactId, selectedGroupId, isLoading, isSyncing, isSetupComplete, notificationPermission, isShortcutsModalOpen, shortcutTrigger, focusedConversationId, isOnline, isDraggingEmail, appLogs,
    login, logout, checkUserSession, getFolderPathFor,
    setCurrentSelection, setSelectedConversationId, setSearchQuery, 
    openCompose, closeCompose, toggleMinimizeCompose, sendEmail, saveDraft, deleteDraft, cancelSend,
    moveConversations, toggleLabel, applyLabel, removeLabel, deleteConversation, archiveConversation, markAsRead, markAsUnread, markAsSpam, markAsNotSpam, snoozeConversation, unsnoozeConversation, unsubscribeFromSender,
    toggleConversationSelection, selectAllConversations, deselectAllConversations, bulkDelete, bulkMarkAsRead, bulkMarkAsUnread,
    toggleTheme, toggleSidebar, reorderSidebarSections, handleEscape, navigateConversationList, openFocusedConversation, setView, setIsShortcutsModalOpen, handleKeyboardShortcut, clearShortcutTrigger, setIsDraggingEmail, addAppLog,
    updateSignature, updateAutoResponder, addRule, deleteRule, updateSendDelay, completeFirstTimeSetup, updateIdentity, requestNotificationPermission, updateNotificationSettings, updateConversationView, updateBlockExternalImages, updateDisplayDensity, createTemplate, updateTemplate, deleteTemplate, updateFolderMappings,
    createLabel, updateLabel, deleteLabel, reorderLabel,
    createFolder, updateFolder, deleteFolder, getFolderDescendants, folderTree, flattenedFolderTree, reorderFolder,
    addContact, updateContact, deleteContact, setSelectedContactId, importContacts,
    createContactGroup, renameContactGroup, deleteContactGroup, addContactToGroup, removeContactFromGroup, setSelectedGroupId,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};