import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { Email, ActionType, Label, Conversation, User, AppSettings, Signature, AutoResponder, Rule, SystemLabel, Contact, ContactGroup, SystemFolder, UserFolder, Attachment, FolderTreeNode, Identity, Template, DisplayDensity, AppLog, Mailbox } from '../types';
import { useToast } from './ToastContext';

// API call helper
const api = {
  async request(method: string, endpoint: string, body?: any) {
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
      }
    };
    if (body) {
      options.headers = { ...options.headers, 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    const res = await fetch(endpoint, options);
    if (!res.ok) {
        const responseText = await res.text();
        let errorData;
        try {
            // Try to parse as JSON, but use the raw text if it fails
            errorData = JSON.parse(responseText);
        } catch (e) {
            errorData = { message: responseText || 'API request failed' };
        }
        throw new Error(errorData.message);
    }
    if (res.status === 204) {
      return null;
    }
    return res.json();
  },
  async get(endpoint: string) {
    return this.request('GET', endpoint);
  },
  async post(endpoint: string, body: any) {
    return this.request('POST', endpoint, body);
  },
  async put(endpoint: string, body: any) {
    return this.request('PUT', endpoint, body);
  },
  async delete(endpoint: string) {
    return this.request('DELETE', endpoint);
  }
};


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
    if (savedTheme) return savedTheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('isSidebarCollapsed') === 'true');
  const [sidebarSectionOrder, setSidebarSectionOrder] = useState<SidebarSection[]>(['folders', 'labels']);
  const [view, setView] = useState<View>('mail');
  const [appSettings, setAppSettings] = useState<AppSettings>(initialAppSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [shortcutTrigger, setShortcutTrigger] = useState<ShortcutTrigger | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDraggingEmail, setIsDraggingEmail] = useState(false);
  const [appLogs, setAppLogs] = useState<AppLog[]>([]);

  const addAppLog = useCallback((message: string, level: 'info' | 'error' = 'info') => {
    const newLog: AppLog = { timestamp: new Date().toISOString(), message, level };
    setAppLogs(prev => [newLog, ...prev.slice(0, 99)]);
  }, []);
  
  const logout = useCallback(() => {
    addAppLog(`User ${user?.email} logged out.`);
    setUser(null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('sessionUser');
    setEmails([]); setMailboxes([]); setLabels([]); setUserFolders([]);
    setContacts([]); setContactGroups([]); setAppSettings(initialAppSettings);
    _setCurrentSelection({type: 'folder', id: SystemFolder.INBOX});
    setSelectedConversationId(null);
    addToast("You have been logged out.");
  }, [addToast, user, addAppLog]);

  const fetchData = useCallback(async (userEmail: string) => {
    try {
        setIsSyncing(true);
        addAppLog('Fetching initial data from server...');
        const [foldersData, labelsData, emailsData, contactsData, groupsData, settingsData] = await Promise.all([
            api.get('/api/folders'),
            api.get('/api/labels'),
            api.get('/api/messages?folder=INBOX'),
            api.get('/api/contacts'),
            api.get('/api/contacts/groups'),
            api.get('/api/settings')
        ]);
        setMailboxes(foldersData.mailboxes);
        setUserFolders(foldersData.userFolders);
        setLabels(labelsData.labels);
        setEmails(emailsData.emails);
        setContacts(contactsData.contacts);
        setContactGroups(groupsData.groups);
        setAppSettings(settingsData);
        
        const primaryIdentity = settingsData.identities.find((i: Identity) => i.email === userEmail);
        setIsSetupComplete(!!primaryIdentity?.name);

        addAppLog('Initial data loaded successfully.');
    } catch (error: any) {
        addToast(`Error loading data: ${error.message}`, { duration: 5000 });
        addAppLog(`Error loading data: ${error.message}`, 'error');
        if (error.message.includes('jwt') || error.message.includes('Authentication failed')) logout();
    } finally {
        setIsSyncing(false);
    }
  }, [addToast, addAppLog, logout]);

  const checkUserSession = useCallback(async () => {
    setIsLoading(true);
    const jwt = localStorage.getItem('jwt');
    const sessionUserStr = localStorage.getItem('sessionUser');
    if (jwt && sessionUserStr) {
        try {
            const sessionUser = JSON.parse(sessionUserStr);
            setUser(sessionUser);
            await api.get('/api/auth/verify');
            addAppLog(`Session restored for ${sessionUser.email}`);
            await fetchData(sessionUser.email);
        } catch (error) {
            addAppLog('Session invalid, logging out.', 'error');
            logout();
        }
    } else {
        setUser(null);
    }
    setIsLoading(false);
  }, [addAppLog, fetchData, logout]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user) return;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/socket`);
    ws.onopen = () => {
        addAppLog('WebSocket connected.');
        ws.send(JSON.stringify({ type: 'auth', token: localStorage.getItem('jwt') }));
    };
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_EMAIL') {
            const newEmail = data.payload as Email;
            addAppLog(`New email received: ${newEmail.subject}`);
            addToast(`New email from ${newEmail.senderName}`);
            setEmails(prev => [newEmail, ...prev]);
        }
    };
    ws.onclose = () => addAppLog('WebSocket disconnected.', 'error');
    return () => ws.close();
  }, [user, addAppLog, addToast]);

  const login = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    addAppLog(`Attempting login for ${email}...`);
    try {
      const { token, user } = await api.post('/api/auth/login', { email, password: pass });
      localStorage.setItem('jwt', token);
      localStorage.setItem('sessionUser', JSON.stringify(user));
      setUser(user);
      await fetchData(user.email);
      addToast(`Welcome, ${user.name}!`);
      addAppLog(`Login successful for ${email}.`);
    } catch (error: any) {
      addToast(`Login failed: ${error.message}`, { duration: 5000 });
      addAppLog(`Login failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, addAppLog, fetchData]);
  
  const deselectAllConversations = useCallback(() => setSelectedConversationIds(new Set()), []);

  const setCurrentSelection = useCallback(async (type: SelectionType, id: string) => {
    _setCurrentSelection({ type, id });
    setSelectedConversationId(null);
    deselectAllConversations();
    try {
      setIsSyncing(true);
      addAppLog(`Fetching messages for ${type}: ${id}`);
      const endpoint = type === 'folder' ? `/api/messages?folder=${id}` : `/api/messages?label=${id}`;
      const data = await api.get(endpoint);
      setEmails(data.emails);
      addAppLog(`Successfully fetched ${data.emails.length} emails.`);
    } catch (error: any) {
      addToast(`Error fetching emails: ${error.message}`, { duration: 5000 });
      addAppLog(`Error fetching emails: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [addToast, addAppLog, deselectAllConversations]);
  
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
      try {
        const formData = new FormData();
        formData.append('to', data.to);
        if (data.cc) formData.append('cc', data.cc);
        if (data.bcc) formData.append('bcc', data.bcc);
        formData.append('subject', data.subject);
        formData.append('body', data.body);
        data.attachments.forEach(file => formData.append('attachments', file));
        if(data.scheduleDate) formData.append('scheduleDate', data.scheduleDate.toISOString());
        if(draftId) formData.append('draftId', draftId);

        const res = await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` },
            body: formData,
        });
        if (!res.ok) throw new Error((await res.json()).message);

        addToast(data.scheduleDate ? "Message scheduled." : "Message sent.");
        closeCompose();
      } catch (error: any) {
          addToast(`Failed to send: ${error.message}`, { duration: 5000 });
      }
  }, [addToast, closeCompose]);

  const saveDraft = useCallback(async (data: SendEmailData, draftId?: string): Promise<string> => {
    try {
      const endpoint = draftId ? `/api/messages/draft/${draftId}` : '/api/messages/draft';
      const method = draftId ? 'PUT' : 'POST';
      const result = await api[method as 'put' | 'post'](endpoint, data);
      addToast('Draft saved.');
      setEmails(prev => {
        const existing = prev.find(e => e.id === result.draft.id);
        if (existing) {
          return prev.map(e => e.id === result.draft.id ? result.draft : e);
        }
        return [result.draft, ...prev];
      });
      return result.draft.id;
    } catch (error: any) {
      addToast(`Error saving draft: ${error.message}`, { duration: 5000 });
      return draftId || '';
    }
  }, [addToast]);

  const deleteDraft = useCallback(async (draftId: string) => {
    if (!draftId) return;
    setEmails(prev => prev.filter(e => e.id !== draftId));
    try {
      await api.delete(`/api/messages/draft/${draftId}`);
      addToast('Draft discarded.');
    } catch (error: any) {
      addToast(`Error discarding draft: ${error.message}`, { duration: 5000 });
    }
  }, [addToast]);
  
  // --- Mail Actions ---
  const moveConversations = useCallback(async (conversationIds: string[], targetFolderId: string) => {
    const originalEmails = [...emails];
    setEmails(prev => prev.filter(e => !conversationIds.includes(e.conversationId)));
    if (selectedConversationId && conversationIds.includes(selectedConversationId)) {
        setSelectedConversationId(null);
    }
    deselectAllConversations();

    try {
      await api.post('/api/messages/move', { conversationIds, targetFolderId });
      const folderName = userFolders.find(f => f.id === targetFolderId)?.name || targetFolderId;
      addToast(`${conversationIds.length} conversation(s) moved to "${folderName}".`);
    } catch (error: any) {
      addToast(`Error moving conversation(s): ${error.message}`, { duration: 5000 });
      setEmails(originalEmails);
    }
  }, [emails, addToast, userFolders, selectedConversationId, deselectAllConversations]);
  
  const applyLabel = useCallback(async (conversationIds: string[], labelId: string) => {
    const originalEmails = [...emails];
    setEmails(prev => prev.map(e => {
      if (conversationIds.includes(e.conversationId) && !e.labelIds.includes(labelId)) {
        return { ...e, labelIds: [...e.labelIds, labelId] };
      }
      return e;
    }));

    try {
      await api.post('/api/messages/labels/add', { conversationIds, labelId });
      const labelName = labels.find(l => l.id === labelId)?.name || labelId;
      addToast(`Applied label "${labelName}" to ${conversationIds.length} conversation(s).`);
    } catch (error: any) {
      addToast(`Error applying label: ${error.message}`, { duration: 5000 });
      setEmails(originalEmails);
    }
  }, [emails, addToast, labels]);

  const removeLabel = useCallback(async (conversationIds: string[], labelId: string) => {
    const originalEmails = [...emails];
     setEmails(prev => prev.map(e => {
      if (conversationIds.includes(e.conversationId)) {
        return { ...e, labelIds: e.labelIds.filter(id => id !== labelId) };
      }
      return e;
    }));

    try {
      await api.post('/api/messages/labels/remove', { conversationIds, labelId });
      addToast(`Label removed.`);
    } catch (error: any) {
      addToast(`Error removing label: ${error.message}`, { duration: 5000 });
      setEmails(originalEmails);
    }
  }, [emails, addToast]);
  
  const toggleLabel = useCallback((conversationIds: string[], labelId: string) => {
      const firstConv = allConversations.find(c => c.id === conversationIds[0]);
      if (firstConv?.labelIds.includes(labelId)) {
          removeLabel(conversationIds, labelId);
      } else {
          applyLabel(conversationIds, labelId);
      }
  }, [allConversations, applyLabel, removeLabel]);
  
  const deleteConversation = useCallback(async (conversationIds: string[]) => {
      const originalEmails = [...emails];
      setEmails(prev => prev.filter(e => !conversationIds.includes(e.conversationId)));
      if (selectedConversationId && conversationIds.includes(selectedConversationId)) {
        setSelectedConversationId(null);
      }
      deselectAllConversations();
      try {
          await api.post('/api/messages/delete', { conversationIds });
          addToast(`${conversationIds.length} conversation(s) moved to Trash.`);
      } catch (error: any) {
          addToast(`Error: ${error.message}`, { duration: 5000 });
          setEmails(originalEmails);
      }
  }, [emails, addToast, selectedConversationId, deselectAllConversations]);
  
  const archiveConversation = useCallback(async (conversationIds: string[]) => {
    const archiveFolderId = getFolderPathFor('archive');
    if (archiveFolderId) {
        moveConversations(conversationIds, archiveFolderId);
    } else {
        addToast("Archive folder not configured.", { duration: 5000 });
    }
  }, [moveConversations, getFolderPathFor, addToast]);
  
  const updateFlags = useCallback(async (conversationIds: string[], flags: { isRead?: boolean }, optimisticUpdate: (email: Email) => Email) => {
    const originalEmails = [...emails];
    setEmails(prev => prev.map(e => {
        if (conversationIds.includes(e.conversationId)) {
            return optimisticUpdate(e);
        }
        return e;
    }));

    try {
        await api.post('/api/messages/flags', { conversationIds, flags });
    } catch (error: any) {
        addToast(`Error updating message status: ${error.message}`, { duration: 5000 });
        setEmails(originalEmails);
    }
  }, [emails, addToast]);

  const markAsRead = useCallback((conversationId: string) => {
    updateFlags([conversationId], { isRead: true }, (e) => ({ ...e, isRead: true }));
  }, [updateFlags]);

  const markAsUnread = useCallback((conversationIds: string[]) => {
    updateFlags(conversationIds, { isRead: false }, (e) => ({ ...e, isRead: false }));
    if (conversationIds.length > 0) addToast(`Marked ${conversationIds.length} item(s) as unread.`);
  }, [updateFlags, addToast]);
  
  const markAsSpam = useCallback(async (conversationIds: string[]) => {
    const originalEmails = [...emails];
    setEmails(prev => prev.filter(e => !conversationIds.includes(e.conversationId)));
    deselectAllConversations();
    try {
      await api.post('/api/messages/spam', { conversationIds, isSpam: true });
      addToast(`${conversationIds.length} conversation(s) moved to Spam.`);
    } catch (error: any) {
        addToast(`Error marking as spam: ${error.message}`, { duration: 5000 });
        setEmails(originalEmails);
    }
  }, [emails, addToast, deselectAllConversations]);
  
  const markAsNotSpam = useCallback(async (conversationIds: string[]) => {
    const originalEmails = [...emails];
    setEmails(prev => prev.filter(e => !conversationIds.includes(e.conversationId)));
    deselectAllConversations();
    try {
      await api.post('/api/messages/spam', { conversationIds, isSpam: false });
      addToast(`${conversationIds.length} conversation(s) moved to Inbox.`);
    } catch (error: any) {
        addToast(`Error: ${error.message}`, { duration: 5000 });
        setEmails(originalEmails);
    }
  }, [emails, addToast, deselectAllConversations]);
  
  const snoozeConversation = useCallback(async (conversationIds: string[], until: Date) => {
    const originalEmails = [...emails];
    setEmails(prev => prev.map(e => {
        if (conversationIds.includes(e.conversationId)) {
            return { ...e, snoozedUntil: until.toISOString() };
        }
        return e;
    }));
    deselectAllConversations();

    try {
        await api.post('/api/messages/snooze', { conversationIds, until: until.toISOString() });
        addToast(`${conversationIds.length} conversation(s) snoozed.`);
    } catch (error: any) {
        addToast(`Error snoozing: ${error.message}`, { duration: 5000 });
        setEmails(originalEmails);
    }
  }, [emails, addToast, deselectAllConversations]);
  
  const addRule = useCallback(async (rule: Omit<Rule, 'id'>) => {
      try {
          const newRule = await api.post('/api/settings/rules', rule);
          setAppSettings(prev => ({ ...prev, rules: [...prev.rules, newRule] }));
          addToast("Rule added.");
      } catch (error: any) {
          addToast(`Error adding rule: ${error.message}`, { duration: 5000 });
      }
  }, [addToast]);

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
    updateFlags(ids, { isRead: true }, (e) => ({ ...e, isRead: true }));
    addToast(`Marked ${ids.length} item(s) as read.`);
  }, [selectedConversationIds, updateFlags, addToast]);
  const bulkMarkAsUnread = useCallback(() => markAsUnread(Array.from(selectedConversationIds)), [selectedConversationIds, markAsUnread]);
  
  // --- UI ---
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
        const newTheme = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        return newTheme;
    });
  }, []);
  const toggleSidebar = useCallback(() => setIsSidebarCollapsed(prev => {
      localStorage.setItem('isSidebarCollapsed', String(!prev));
      return !prev;
  }), []);
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
  }, []);
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
  const updateSettings = useCallback(async (settings: Partial<AppSettings>) => {
    const originalSettings = { ...appSettings };
    setAppSettings(prev => ({ ...prev, ...settings }));
    try {
      await api.post('/api/settings', settings);
    } catch (error: any) {
      addToast(`Error updating settings: ${error.message}`, { duration: 5000 });
      setAppSettings(originalSettings);
    }
  }, [appSettings, addToast]);
  
  const updateSignature = (signature: Signature) => { updateSettings({ signature }); addToast("Signature settings updated."); };
  const updateAutoResponder = (autoResponder: AutoResponder) => { updateSettings({ autoResponder }); addToast("Auto-responder settings updated."); };
  const updateSendDelay = (sendDelay: AppSettings['sendDelay']) => { updateSettings({ sendDelay }); addToast("Send delay settings updated."); };
  const updateNotificationSettings = (enabled: boolean) => { updateSettings({ notifications: { enabled } }); addToast(enabled ? "Desktop notifications enabled." : "Desktop notifications disabled."); };
  const updateConversationView = (enabled: boolean) => { updateSettings({ conversationView: enabled }); addToast(enabled ? "Conversation view enabled." : "Conversation view disabled."); };
  const updateBlockExternalImages = (enabled: boolean) => { updateSettings({ blockExternalImages: enabled }); addToast(enabled ? "External images will be blocked by default." : "External images will be shown by default."); };
  const updateDisplayDensity = (density: DisplayDensity) => { updateSettings({ displayDensity: density }); addToast(`Display density set to ${density}.`); };
  const updateFolderMappings = (mappings: Record<string, string>) => updateSettings({ folderMappings: mappings });

  const deleteRule = useCallback(async (ruleId: string) => {
      const originalRules = [...appSettings.rules];
      setAppSettings(prev => ({ ...prev, rules: prev.rules.filter(r => r.id !== ruleId) }));
      try {
          await api.delete(`/api/settings/rules/${ruleId}`);
          addToast("Rule deleted.");
      } catch (error: any) {
          addToast(`Error deleting rule: ${error.message}`, { duration: 5000 });
          setAppSettings(prev => ({ ...prev, rules: originalRules }));
      }
  }, [appSettings.rules, addToast]);
  
  const completeFirstTimeSetup = useCallback(async (name: string, accountType: 'personal' | 'business') => {
      try {
          await api.post('/api/settings/setup/complete', { name, accountType });
          const sessionUserStr = localStorage.getItem('sessionUser');
          if (sessionUserStr) setUser({ ...JSON.parse(sessionUserStr), name });
          await fetchData(user!.email);
          setIsSetupComplete(true);
          addToast('Welcome! Your settings have been saved.');
      } catch(error: any) {
          addToast(`Setup failed: ${error.message}`, { duration: 5000 });
      }
  }, [fetchData, addToast, user]);

  const updateIdentity = useCallback(async (identity: Identity) => {
    const originalIdentities = [...appSettings.identities];
    setAppSettings(prev => ({ ...prev, identities: prev.identities.map(i => i.id === identity.id ? identity : i) }));
    try {
      await api.put(`/api/settings/identities/${identity.id}`, identity);
      addToast('Identity updated.');
    } catch (error: any) {
      addToast(`Error updating identity: ${error.message}`, { duration: 5000 });
      setAppSettings(prev => ({ ...prev, identities: originalIdentities }));
    }
  }, [appSettings.identities, addToast]);
  
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) { addToast("This browser does not support desktop notification"); return; }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') { updateNotificationSettings(true); addToast("Desktop notifications enabled!"); } 
    else { addToast("Notifications permission not granted."); }
  }, [addToast]);

  const createTemplate = useCallback(async (name: string, body: string) => {
      try {
          const newTemplate = await api.post('/api/settings/templates', { name, body });
          setAppSettings(prev => ({ ...prev, templates: [...prev.templates, newTemplate] }));
          addToast(`Template "${name}" created.`);
      } catch (error: any) {
          addToast(`Error creating template: ${error.message}`, { duration: 5000 });
      }
  }, [addToast]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<Omit<Template, 'id'>>) => {
      const originalTemplates = [...appSettings.templates];
      setAppSettings(prev => ({...prev, templates: prev.templates.map(t => t.id === id ? { ...t, ...updates } as Template : t)}));
      try {
          await api.put(`/api/settings/templates/${id}`, updates);
          addToast(`Template updated.`);
      } catch (error: any) {
          addToast(`Error updating template: ${error.message}`, { duration: 5000 });
          setAppSettings(prev => ({ ...prev, templates: originalTemplates }));
      }
  }, [appSettings.templates, addToast]);

  const deleteTemplate = useCallback(async (id: string) => {
      const originalTemplates = [...appSettings.templates];
      setAppSettings(prev => ({...prev, templates: prev.templates.filter(t => t.id !== id)}));
      try {
          await api.delete(`/api/settings/templates/${id}`);
          addToast('Template deleted.');
      } catch (error: any) {
          addToast(`Error deleting template: ${error.message}`, { duration: 5000 });
          setAppSettings(prev => ({ ...prev, templates: originalTemplates }));
      }
  }, [appSettings.templates, addToast]);

  // Label Management
  const createLabel = useCallback(async (name: string, color: string) => {
      try {
          const newLabel = await api.post('/api/labels', { name, color });
          setLabels(prev => [...prev, newLabel]);
          addToast(`Label "${name}" created.`);
      } catch (error: any) {
          addToast(`Error creating label: ${error.message}`, { duration: 5000 });
      }
  }, [addToast]);

  const updateLabel = useCallback(async (id: string, updates: Partial<Omit<Label, 'id'>>) => {
      const originalLabels = [...labels];
      setLabels(prev => prev.map(l => l.id === id ? { ...l, ...updates } as Label : l));
      try {
          await api.put(`/api/labels/${id}`, updates);
          addToast('Label updated.');
      } catch (error: any) {
          addToast(`Error updating label: ${error.message}`, { duration: 5000 });
          setLabels(originalLabels);
      }
  }, [labels, addToast]);

  const deleteLabel = useCallback(async (id: string) => {
      const originalLabels = [...labels];
      const labelToDelete = labels.find(l => l.id === id);
      setLabels(prev => prev.filter(l => l.id !== id));
      try {
          await api.delete(`/api/labels/${id}`);
          addToast(`Label "${labelToDelete?.name}" deleted.`);
      } catch (error: any) {
          addToast(`Error deleting label: ${error.message}`, { duration: 5000 });
          setLabels(originalLabels);
      }
  }, [labels, addToast]);
  
  const reorderLabel = useCallback(async (draggedId: string, targetId: string, position: 'top' | 'bottom') => {
      try {
          const newLabels = await api.post('/api/labels/reorder', { draggedId, targetId, position });
          setLabels(newLabels);
      } catch (error: any) {
          addToast(`Error reordering labels: ${error.message}`, { duration: 5000 });
      }
  }, [addToast]);
  
  // Folder Management
  const { folderTree, flattenedFolderTree } = useMemo(() => {
      const buildTree = (parentId: string | null = null): FolderTreeNode[] => {
          return userFolders
              .filter(folder => (folder.parentId || null) === parentId)
              .sort((a,b) => a.order - b.order)
              .map(folder => ({ ...folder, children: buildTree(folder.id), level: 0 }));
      };
      const flattenTree = (nodes: FolderTreeNode[], level = 0): FolderTreeNode[] => {
          return nodes.flatMap(node => [{ ...node, level }, ...flattenTree(node.children, level + 1)]);
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
      try {
          const foldersData = await api.post('/api/folders', { name, parentId });
          setUserFolders(foldersData.userFolders);
          addToast(`Folder "${name}" created.`);
      } catch (error: any) {
          addToast(`Error creating folder: ${error.message}`, { duration: 5000 });
      }
  }, [addToast]);

  const updateFolder = useCallback(async (id: string, newName: string, newParentId?: string) => {
      const originalFolders = [...userFolders];
      try {
          const foldersData = await api.put(`/api/folders/${id}`, { name: newName, parentId: newParentId });
          setUserFolders(foldersData.userFolders);
          addToast('Folder updated.');
      } catch (error: any) {
          addToast(`Error updating folder: ${error.message}`, { duration: 5000 });
          setUserFolders(originalFolders);
      }
  }, [userFolders, addToast]);

  const deleteFolder = useCallback(async (id: string) => {
      const folderToDelete = userFolders.find(f => f.id === id);
      const originalFolders = [...userFolders];
      try {
          const foldersData = await api.delete(`/api/folders/${id}`);
          setUserFolders(foldersData.userFolders);
          addToast(`Folder "${folderToDelete?.name}" deleted.`);
      } catch (error: any) {
          addToast(`Error deleting folder: ${error.message}`, { duration: 5000 });
          setUserFolders(originalFolders);
      }
  }, [userFolders, addToast]);

  const reorderFolder = useCallback(async (draggedId: string, targetId: string, position: 'top' | 'bottom') => {
      try {
          const foldersData = await api.post('/api/folders/reorder', { draggedId, targetId, position });
          setUserFolders(foldersData.userFolders);
      } catch (error: any) {
          addToast(`Error reordering folders: ${error.message}`, { duration: 5000 });
      }
  }, [addToast]);

  // Contacts
  const addContact = useCallback(async (contact: Omit<Contact, 'id'>) => {
    try {
        const newContact = await api.post('/api/contacts', contact);
        setContacts(prev => [newContact, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
        addToast("Contact added.");
    } catch (error: any) {
        addToast(`Error adding contact: ${error.message}`, { duration: 5000 });
    }
  }, [addToast]);

  const updateContact = useCallback(async (contact: Contact) => {
    const originalContacts = [...contacts];
    setContacts(prev => prev.map(c => c.id === contact.id ? contact : c));
    try {
        await api.put(`/api/contacts/${contact.id}`, contact);
        addToast("Contact updated.");
    } catch (error: any) {
        addToast(`Error updating contact: ${error.message}`, { duration: 5000 });
        setContacts(originalContacts);
    }
  }, [contacts, addToast]);

  const deleteContact = useCallback(async (contactId: string) => {
    const originalContacts = [...contacts];
    setContacts(prev => prev.filter(c => c.id !== contactId));
    if (selectedContactId === contactId) setSelectedContactId(null);
    try {
        await api.delete(`/api/contacts/${contactId}`);
        addToast("Contact deleted.");
    } catch (error: any) {
        addToast(`Error deleting contact: ${error.message}`, { duration: 5000 });
        setContacts(originalContacts);
    }
  }, [contacts, selectedContactId, addToast]);

  const importContacts = useCallback(async (newContacts: Omit<Contact, 'id'>[]) => {
    try {
        const result = await api.post('/api/contacts/import', { contacts: newContacts });
        setContacts(prev => [...prev, ...result.imported].sort((a,b) => a.name.localeCompare(b.name)));
        let message = `Imported ${result.imported.length} new contact(s).`;
        if (result.skipped > 0) message += ` Skipped ${result.skipped} duplicate(s).`;
        addToast(message);
    } catch (error: any) {
        addToast(`Error importing contacts: ${error.message}`, { duration: 5000 });
    }
  }, [addToast]);
  
  // Contact Groups
  const createContactGroup = useCallback(async (name: string) => {
    try {
        const newGroup = await api.post('/api/contacts/groups', { name });
        setContactGroups(prev => [...prev, newGroup]);
        addToast(`Group "${name}" created.`);
    } catch (error: any) {
        addToast(`Error creating group: ${error.message}`, { duration: 5000 });
    }
  }, [addToast]);

  const renameContactGroup = useCallback(async (groupId: string, newName: string) => {
    const originalGroups = [...contactGroups];
    setContactGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
    try {
        await api.put(`/api/contacts/groups/${groupId}`, { name: newName });
        addToast("Group renamed.");
    } catch (error: any) {
        addToast(`Error renaming group: ${error.message}`, { duration: 5000 });
        setContactGroups(originalGroups);
    }
  }, [contactGroups, addToast]);

  const deleteContactGroup = useCallback(async (groupId: string) => {
    const originalGroups = [...contactGroups];
    setContactGroups(prev => prev.filter(g => g.id !== groupId));
    if(selectedGroupId === groupId) setSelectedGroupId(null);
    try {
        await api.delete(`/api/contacts/groups/${groupId}`);
        addToast("Group deleted.");
    } catch (error: any) {
        addToast(`Error deleting group: ${error.message}`, { duration: 5000 });
        setContactGroups(originalGroups);
    }
  }, [contactGroups, selectedGroupId, addToast]);

  const addContactToGroup = useCallback(async (groupId: string, contactId: string) => {
    const originalGroups = [...contactGroups];
    setContactGroups(prev => prev.map(g => {
        if (g.id === groupId && !g.contactIds.includes(contactId)) {
            return { ...g, contactIds: [...g.contactIds, contactId] };
        }
        return g;
    }));
    try {
        await api.post(`/api/contacts/groups/${groupId}/members`, { contactId });
        const contactName = contacts.find(c => c.id === contactId)?.name || 'Contact';
        const groupName = contactGroups.find(g => g.id === groupId)?.name || 'group';
        addToast(`${contactName} added to ${groupName}.`);
    } catch (error: any) {
        addToast(`Error: ${error.message}`, { duration: 5000 });
        setContactGroups(originalGroups);
    }
  }, [contactGroups, contacts, addToast]);

  const removeContactFromGroup = useCallback(async (groupId: string, contactId: string) => {
    const originalGroups = [...contactGroups];
    setContactGroups(prev => prev.map(g => {
        if (g.id === groupId) {
            return { ...g, contactIds: g.contactIds.filter(id => id !== contactId) };
        }
        return g;
    }));
    try {
        await api.delete(`/api/contacts/groups/${groupId}/members/${contactId}`);
    } catch (error: any) {
        addToast(`Error: ${error.message}`, { duration: 5000 });
        setContactGroups(originalGroups);
    }
  }, [contactGroups, addToast]);

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