
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { Email, ActionType, Label, Conversation, User, AppSettings, Signature, AutoResponder, Rule, SystemLabel, Contact, ContactGroup, SystemFolder, UserFolder, Attachment, FolderTreeNode, Identity, Template, DisplayDensity } from '../types';
import { useToast } from './ToastContext';
import { mockLabels, mockContacts, mockEmails, mockUser, mockUserFolders, mockContactGroups } from '../data/mockData';


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
  view: View;
  appSettings: AppSettings;
  contacts: Contact[];
  contactGroups: ContactGroup[];
  selectedContactId: string | null;
  selectedGroupId: string | null;
  isLoading: boolean;
  isSetupComplete: boolean;
  notificationPermission: NotificationPermission;
  isShortcutsModalOpen: boolean;
  shortcutTrigger: ShortcutTrigger | null;
  isOnline: boolean;
  
  // Auth
  login: (email: string, pass: string) => void;
  logout: () => void;
  checkUserSession: () => void;
  
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
  handleEscape: () => void;
  navigateConversationList: (direction: 'up' | 'down') => void;
  openFocusedConversation: () => void;
  setView: (view: View) => void;
  setIsShortcutsModalOpen: (isOpen: boolean) => void;
  handleKeyboardShortcut: (e: KeyboardEvent) => void;
  clearShortcutTrigger: () => void;
  
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
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [labels, setLabels] = useState<Label[]>(() => {
    const saved = localStorage.getItem('labels');
    return saved ? JSON.parse(saved) : mockLabels;
  });
  const [userFolders, setUserFolders] = useState<UserFolder[]>(() => {
    const saved = localStorage.getItem('userFolders');
    return saved ? JSON.parse(saved) : mockUserFolders;
  });
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const savedContacts = localStorage.getItem('contacts');
    return savedContacts ? JSON.parse(savedContacts) : mockContacts;
  });
   const [contactGroups, setContactGroups] = useState<ContactGroup[]>(() => {
    const savedGroups = localStorage.getItem('contactGroups');
    return savedGroups ? JSON.parse(savedGroups) : mockContactGroups;
  });
  const [currentSelection, setCurrentSelection] = useState<{type: SelectionType, id: string}>({type: 'folder', id: SystemFolder.INBOX});
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
  const [view, setView] = useState<View>('mail');
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            return {
                ...initialAppSettings,
                ...parsedSettings,
                signature: { ...initialAppSettings.signature, ...parsedSettings.signature },
                autoResponder: { ...initialAppSettings.autoResponder, ...parsedSettings.autoResponder },
                sendDelay: { ...initialAppSettings.sendDelay, ...parsedSettings.sendDelay },
                notifications: { ...initialAppSettings.notifications, ...parsedSettings.notifications },
                conversationView: parsedSettings.conversationView !== undefined ? parsedSettings.conversationView : initialAppSettings.conversationView,
                blockExternalImages: parsedSettings.blockExternalImages !== undefined ? parsedSettings.blockExternalImages : initialAppSettings.blockExternalImages,
                templates: parsedSettings.templates || [],
                displayDensity: parsedSettings.displayDensity || initialAppSettings.displayDensity,
            };
        } catch (e) {
            console.error("Failed to parse appSettings from localStorage", e);
        }
      }
      return initialAppSettings;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => localStorage.getItem('isSetupComplete') === 'true');
  const [pendingSend, setPendingSend] = useState<PendingSend | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [shortcutTrigger, setShortcutTrigger] = useState<ShortcutTrigger | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
  useEffect(() => { localStorage.setItem('appSettings', JSON.stringify(appSettings)); }, [appSettings]);
  useEffect(() => { localStorage.setItem('emails', JSON.stringify(emails)); }, [emails]);
  useEffect(() => { localStorage.setItem('contacts', JSON.stringify(contacts)); }, [contacts]);
  useEffect(() => { localStorage.setItem('contactGroups', JSON.stringify(contactGroups)); }, [contactGroups]);
  useEffect(() => { localStorage.setItem('labels', JSON.stringify(labels)); }, [labels]);
  useEffect(() => { localStorage.setItem('userFolders', JSON.stringify(userFolders)); }, [userFolders]);

  const checkUserSession = useCallback(() => {
    setIsLoading(true);
    const loadedSettingsStr = localStorage.getItem('appSettings');
    const loadedSettings: AppSettings = loadedSettingsStr ? JSON.parse(loadedSettingsStr) : initialAppSettings;
    const hasCompletedSetup = localStorage.getItem('isSetupComplete') === 'true';

    const currentUser = { ...mockUser };
    const primaryIdentity = loadedSettings.identities.find(id => id.email === currentUser.email);
    if(primaryIdentity) {
      currentUser.name = primaryIdentity.name;
    }
    
    setUser(currentUser);
    
    const savedEmails = localStorage.getItem('emails');
    if (savedEmails) {
        setEmails(JSON.parse(savedEmails));
    } else {
        setEmails(mockEmails);
    }
    
    setAppSettings(loadedSettings);
    setIsSetupComplete(hasCompletedSetup && !!primaryIdentity);

    setTimeout(() => setIsLoading(false), 500);
  }, []);
  
  const login = useCallback((email: string, pass: string) => {
    setIsLoading(true);
    if (email && pass) {
        checkUserSession();
    } else {
        addToast('Please enter both email and password.');
        setIsLoading(false);
    }
  }, [checkUserSession, addToast]);

  const logout = useCallback(() => {
    setUser(null);
    setEmails([]);
    // Don't clear labels/folders on logout to persist user settings
    setCurrentSelection({type: 'folder', id: SystemFolder.INBOX});
    setSelectedConversationId(null);
    addToast('You have been logged out.');
  }, [addToast]);

  const deselectAllConversations = useCallback(() => setSelectedConversationIds(new Set()), []);
  
  const unsnoozeConversation = useCallback((conversationIds: string[]) => {
    setEmails(prevEmails => {
        return prevEmails.map(email => {
            if (conversationIds.includes(email.conversationId)) {
                const newEmail = { ...email };
                delete newEmail.snoozedUntil;
                newEmail.folderId = SystemFolder.INBOX;
                newEmail.labelIds = newEmail.labelIds.filter(id => id !== SystemLabel.SNOOZED);
                return newEmail;
            }
            return email;
        });
    });
    addToast(`${conversationIds.length} conversation(s) returned to Inbox.`);
  }, [addToast]);

  // Check for snoozed emails periodically
  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        const convsToUnsnooze: string[] = [];
        
        setEmails(currentEmails => {
            currentEmails.forEach(email => {
                if (email.snoozedUntil && new Date(email.snoozedUntil) <= now) {
                    if (!convsToUnsnooze.includes(email.conversationId)) {
                        convsToUnsnooze.push(email.conversationId);
                    }
                }
            });
            return currentEmails;
        });

        if (convsToUnsnooze.length > 0) {
            unsnoozeConversation(convsToUnsnooze);
        }
    }, 5000); // Check every 5 seconds

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
        convEmails.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const lastEmail = convEmails[convEmails.length - 1];
        const participants = [...new Map(convEmails.map(e => [e.senderEmail, { name: e.senderEmail === user?.email ? 'Me' : e.senderName, email: e.senderEmail }])).values()];
        const allLabelIds = [...new Set(convEmails.flatMap(e => e.labelIds))];
        const canUnsubscribe = convEmails.some(e => /unsubscribe|opt-out|opt out|subscription preferences/i.test(e.body));
        const isSnoozed = !!lastEmail.snoozedUntil && new Date(lastEmail.snoozedUntil) > new Date();

        return {
          id,
          subject: lastEmail.subject || '(no subject)',
          emails: convEmails,
          participants,
          lastTimestamp: lastEmail.timestamp,
          isRead: convEmails.every(e => e.isRead),
          folderId: lastEmail.folderId,
          labelIds: allLabelIds,
          isSnoozed: isSnoozed,
          snoozedUntil: lastEmail.snoozedUntil,
          hasAttachments: convEmails.some(e => e.attachments && e.attachments.length > 0),
          canUnsubscribe
        };
      })
      .sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime());
  }, [emails, user]);

  const sortedLabels = useMemo(() => [...labels].sort((a, b) => a.order - b.order), [labels]);

  const folderTree = useMemo<FolderTreeNode[]>(() => {
    const buildTree = (folders: UserFolder[], parentId?: string, level = 0): FolderTreeNode[] => {
        return folders
            .filter(folder => folder.parentId === parentId)
            .sort((a,b) => a.order - b.order)
            .map(folder => ({
                ...folder,
                level,
                children: buildTree(folders, folder.id, level + 1)
            }));
    };
    return buildTree(userFolders);
  }, [userFolders]);

  const flattenedFolderTree = useMemo<FolderTreeNode[]>(() => {
    const flatten = (nodes: FolderTreeNode[]): FolderTreeNode[] => {
        return nodes.reduce((acc, node) => {
            acc.push(node);
            if (node.children.length > 0) {
                acc.push(...flatten(node.children));
            }
            return acc;
        }, [] as FolderTreeNode[]);
    };
    return flatten(folderTree);
  }, [folderTree]);

  const displayedConversations = useMemo(() => {
    let baseList: Conversation[];

    if (appSettings.conversationView) {
        baseList = allConversations;
    } else {
        // Flattened message view
        baseList = allConversations
            .flatMap(conv => conv.emails.map(email => ({
                id: email.id,
                __originalConversationId: conv.id,
                subject: email.subject || '(no subject)',
                emails: [email],
                participants: [{ name: email.senderName, email: email.senderEmail }],
                lastTimestamp: email.timestamp,
                isRead: email.isRead,
                folderId: email.folderId,
                labelIds: email.labelIds,
                isSnoozed: !!email.snoozedUntil && new Date(email.snoozedUntil) > new Date(),
                snoozedUntil: email.snoozedUntil,
                hasAttachments: !!(email.attachments && email.attachments.length > 0),
                canUnsubscribe: /unsubscribe|opt-out|opt out|subscription preferences/i.test(email.body),
            })))
            .sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime());
    }
    
    if (currentSelection.type === 'folder') {
        baseList = baseList.filter(c => c.folderId === currentSelection.id && !c.isSnoozed);
    } else if (currentSelection.type === 'label') {
        if (currentSelection.id === SystemLabel.SNOOZED) {
            baseList = baseList.filter(c => c.isSnoozed);
        } else {
             baseList = baseList.filter(c => c.labelIds.includes(currentSelection.id) && c.folderId !== SystemFolder.SPAM && c.folderId !== SystemFolder.TRASH && !c.isSnoozed);
        }
    }
    
    let filtered = baseList;
    
    if(searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        
        const filters: { type: string, value: string }[] = [];
        const filterRegex = /(from:|to:|subject:|is:|has:)([\w@.-]+)/g;
        
        const textSearch = lowerQuery.replace(filterRegex, '').trim();
        
        let match;
        while ((match = filterRegex.exec(lowerQuery)) !== null) {
            filters.push({ type: match[1].slice(0, -1), value: match[2] });
        }
        
        if (filters.length > 0) {
            filtered = filtered.filter(conv => {
                return filters.every(({ type, value }) => {
                    switch (type) {
                        case 'from':
                            return conv.participants.some(p => p.name.toLowerCase().includes(value) || p.email.toLowerCase().includes(value));
                        case 'to':
                            return conv.emails.some(email =>
                                (email.recipientEmail && email.recipientEmail.toLowerCase().includes(value)) ||
                                (email.cc && email.cc.toLowerCase().includes(value)) ||
                                (email.bcc && email.bcc.toLowerCase().includes(value))
                            );
                        case 'subject':
                            return conv.subject.toLowerCase().includes(value);
                        case 'is':
                            if (value === 'starred') return conv.labelIds.includes(SystemLabel.STARRED);
                            if (value === 'unread') return !conv.isRead;
                            if (value === 'snoozed') return conv.isSnoozed;
                            return true;
                        case 'has':
                            return value === 'attachment' ? conv.hasAttachments : true;
                        default:
                            return true;
                    }
                });
            });
        }

        if (textSearch) {
            filtered = filtered.filter(conv => 
                conv.subject.toLowerCase().includes(textSearch) ||
                conv.participants.some(p => p.name.toLowerCase().includes(textSearch) || p.email.toLowerCase().includes(textSearch)) ||
                conv.emails.some(e => e.snippet.toLowerCase().includes(textSearch))
            );
        }
    }
    
    return filtered;

  }, [allConversations, currentSelection, searchQuery, appSettings.conversationView]);
  
  const getRealConversationIds = useCallback((ids: string[]): string[] => {
    if (appSettings.conversationView) {
        return ids;
    }
    const realIds = new Set<string>();
    const convMap = new Map<string, Conversation>();
    displayedConversations.forEach(c => convMap.set(c.id, c));
    const allConvIds = new Set(allConversations.map(c => c.id));

    ids.forEach(id => {
        if (allConvIds.has(id)) { // It's already a real conv id
            realIds.add(id);
            return;
        }

        const conv = convMap.get(id); // It's an email ID from displayed list
        if (conv && conv.__originalConversationId) {
            realIds.add(conv.__originalConversationId);
        } else { // Fallback for safety, should not be hit often from UI
            const originalConv = allConversations.find(c => c.emails.some(e => e.id === id));
            if (originalConv) {
                realIds.add(originalConv.id);
            }
        }
    });
    return Array.from(realIds);
  }, [appSettings.conversationView, displayedConversations, allConversations]);
  
  const setCurrentSelectionCallback = useCallback((type: SelectionType, id: string) => {
    setView('mail');
    setCurrentSelection({type, id});
    setSelectedConversationId(null);
    setFocusedConversationId(null);
    setSearchQuery('');
    setSelectedConversationIds(new Set());
  }, []);

  const openCompose = useCallback((config: Partial<Omit<ComposeState, 'isOpen'>> = {}) => {
    const draftId = (config.action === ActionType.DRAFT && config.email) ? config.email.id : undefined;
    const conversationId = config.email?.conversationId;
    setComposeState({ isOpen: true, isMinimized: false, draftId, conversationId, ...config });
  }, []);

  const closeCompose = useCallback(() => setComposeState({ isOpen: false, isMinimized: false }), []);
  const toggleMinimizeCompose = useCallback(() => setComposeState(prev => ({ ...prev, isMinimized: !prev.isMinimized })), []);
  
  const moveConversations = useCallback((conversationIds: string[], targetFolderId: string) => {
     const realIds = getRealConversationIds(conversationIds);
     setEmails(prevEmails => {
        return prevEmails.map(email => {
            if (realIds.includes(email.conversationId)) {
                return { ...email, folderId: targetFolderId };
            }
            return email;
        });
    });
    const folderName = userFolders.find(f => f.id === targetFolderId)?.name || targetFolderId;
    addToast(`${realIds.length} conversation(s) moved to "${folderName}".`);
    deselectAllConversations();
    if (realIds.includes(selectedConversationId!)) setSelectedConversationId(null);
  }, [addToast, userFolders, deselectAllConversations, selectedConversationId, getRealConversationIds]);

  const applyLabel = useCallback((conversationIds: string[], labelId: string) => {
    const realIds = getRealConversationIds(conversationIds);
    setEmails(prevEmails => {
        return prevEmails.map(email => {
            if (realIds.includes(email.conversationId)) {
                const newLabelIds = [...new Set([...email.labelIds, labelId])];
                return { ...email, labelIds: newLabelIds };
            }
            return email;
        });
    });
    const labelName = labels.find(l => l.id === labelId)?.name || labelId;
    addToast(`Applied label "${labelName}" to ${realIds.length} conversation(s).`);
  }, [addToast, labels, getRealConversationIds]);

  const removeLabel = useCallback((conversationIds: string[], labelId: string) => {
    const realIds = getRealConversationIds(conversationIds);
    setEmails(prevEmails => {
        return prevEmails.map(email => {
            if (realIds.includes(email.conversationId)) {
                return { ...email, labelIds: email.labelIds.filter(id => id !== labelId) };
            }
            return email;
        });
    });
  }, [getRealConversationIds]);

  const toggleLabel = useCallback((conversationIds: string[], labelId: string) => {
    const realIds = getRealConversationIds(conversationIds);
    if (realIds.length === 0) return;

    const firstConv = allConversations.find(c => c.id === realIds[0]);
    if (!firstConv) return;
    
    // Check if ALL conversations in the selection have the label.
    // To be safe, we'll just check the first one, which is common UI practice.
    const hasLabel = firstConv.labelIds.includes(labelId);

    if (hasLabel) {
        removeLabel(conversationIds, labelId); // Pass original IDs
        addToast('Label removed.');
    } else {
        applyLabel(conversationIds, labelId); // Pass original IDs
    }
  }, [allConversations, getRealConversationIds, applyLabel, removeLabel, addToast]);
  
  const archiveConversation = useCallback((conversationIds: string[]) => {
    const realIds = getRealConversationIds(conversationIds);
    moveConversations(realIds, SystemFolder.ARCHIVE);
  }, [moveConversations, getRealConversationIds]);

  const actuallySendEmail = useCallback((data: SendEmailData, draftId?: string, conversationId?: string) => {
      if (!user) return;
      
      const newEmail: Email = {
        id: `email-${Date.now()}`,
        conversationId: conversationId || `conv-${Date.now()}`,
        senderName: user.name,
        senderEmail: user.email,
        recipientEmail: data.to,
        cc: data.cc,
        // bcc data is a delivery instruction and should not be stored in the final message.
        subject: data.subject || '(no subject)',
        body: data.body,
        snippet: data.body.replace(/<[^>]*>?/gm, '').substring(0, 100),
        timestamp: new Date().toISOString(),
        isRead: true,
        folderId: data.scheduleDate ? SystemFolder.SCHEDULED : SystemFolder.SENT,
        labelIds: [],
        attachments: data.attachments.map(f => ({fileName: f.name, fileSize: f.size, mimeType: f.type})),
        scheduledSendTime: data.scheduleDate?.toISOString(),
      };

      setEmails(prev => [newEmail, ...prev.filter(e => e.id !== draftId)]);
      
      if (data.scheduleDate) {
          addToast('Message scheduled.');
      } else {
          addToast('Message sent.');
      }
      const targetFolder = data.scheduleDate ? SystemFolder.SCHEDULED : SystemFolder.SENT;
      if (currentSelection.id !== targetFolder) {
          setCurrentSelectionCallback('folder', targetFolder);
      }
  }, [user, addToast, setCurrentSelectionCallback, currentSelection]);

  const cancelSend = useCallback(() => {
    if (pendingSend) {
        clearTimeout(pendingSend.timerId);
        openCompose({ 
            initialData: pendingSend.emailData, 
            draftId: pendingSend.draftId,
            conversationId: pendingSend.conversationId,
        });
        setPendingSend(null);
        addToast('Sending cancelled.');
    }
  }, [pendingSend, openCompose, addToast]);

  const sendEmail = useCallback((data: SendEmailData, draftId?: string) => {
    const convId = composeState.conversationId;
    closeCompose();

    if (data.scheduleDate) {
      actuallySendEmail(data, draftId, convId);
      return;
    }
    
    if (appSettings.sendDelay.isEnabled && appSettings.sendDelay.duration > 0) {
      if (pendingSend?.timerId) clearTimeout(pendingSend.timerId);
      
      const timerId = setTimeout(() => {
        actuallySendEmail(data, draftId, convId);
        setPendingSend(null);
      }, appSettings.sendDelay.duration * 1000);
      
      setPendingSend({ timerId: timerId as unknown as number, emailData: data, draftId, conversationId: convId });
      
      addToast('Sending...', {
        duration: appSettings.sendDelay.duration * 1000,
        action: { label: 'Undo', onClick: cancelSend }
      });
    } else {
      actuallySendEmail(data, draftId, convId);
    }
  }, [closeCompose, actuallySendEmail, appSettings.sendDelay, pendingSend, addToast, cancelSend, composeState.conversationId]);
  
  const saveDraft = useCallback((data: SendEmailData, draftId?: string) => {
      if (!user) return '';
      const conversationId = composeState.conversationId || `conv-${Date.now()}`;
      let newDraftId = draftId;

      if (draftId) {
          setEmails(prev => prev.map(e => e.id === draftId ? {
              ...e,
              recipientEmail: data.to,
              cc: data.cc || undefined,
              bcc: data.bcc || undefined,
              subject: data.subject || '(no subject)',
              body: data.body,
              snippet: data.body.replace(/<[^>]*>?/gm, '').substring(0, 100),
              timestamp: new Date().toISOString(),
              attachments: data.attachments.map(f => ({ fileName: f.name, fileSize: f.size, mimeType: f.type })),
          } : e));
          addToast('Draft updated.');
      } else {
          newDraftId = `email-${Date.now()}`;
          const newDraft: Email = {
              id: newDraftId,
              conversationId: conversationId,
              senderName: user.name,
              senderEmail: user.email,
              recipientEmail: data.to,
              cc: data.cc,
              bcc: data.bcc,
              subject: data.subject || '(no subject)',
              body: data.body,
              snippet: data.body.replace(/<[^>]*>?/gm, '').substring(0, 100),
              timestamp: new Date().toISOString(),
              isRead: true,
              folderId: SystemFolder.DRAFTS,
              labelIds: [],
              attachments: data.attachments.map(f => ({ fileName: f.name, fileSize: f.size, mimeType: f.type })),
          };
          setEmails(prev => [newDraft, ...prev]);
          addToast('Draft saved.');
      }
      if (currentSelection.id !== SystemFolder.DRAFTS) {
        setCurrentSelectionCallback('folder', SystemFolder.DRAFTS);
      }
      return newDraftId || '';
  }, [user, addToast, composeState.conversationId, currentSelection, setCurrentSelectionCallback]);

  const deleteDraft = useCallback((draftId: string) => {
    setEmails(prev => prev.filter(email => email.id !== draftId));
    addToast('Draft discarded.');
  }, [addToast]);

  const deleteConversation = useCallback((conversationIds: string[]) => {
    const realIds = getRealConversationIds(conversationIds);
    const convsToDelete = allConversations.filter(c => realIds.includes(c.id));
    const isPermanentDelete = convsToDelete.every(c => c.folderId === SystemFolder.TRASH);

    if (isPermanentDelete) {
        const emailIdsToDelete = convsToDelete.flatMap(c => c.emails.map(e => e.id));
        setEmails(prev => prev.filter(e => !emailIdsToDelete.includes(e.id)));
        addToast(`${realIds.length} conversation(s) permanently deleted.`);
    } else {
        moveConversations(realIds, SystemFolder.TRASH);
        // Also strip labels when moving to trash
        setEmails(prevEmails => prevEmails.map(email => 
            realIds.includes(email.conversationId) ? { ...email, labelIds: [] } : email
        ));
    }

    if(selectedConversationIds.size > 0) deselectAllConversations();
    if(realIds.includes(selectedConversationId!)) setSelectedConversationId(null);
  }, [allConversations, moveConversations, addToast, selectedConversationId, selectedConversationIds, deselectAllConversations, getRealConversationIds]);

  const handleEscape = useCallback(() => {
    if (isShortcutsModalOpen) { setIsShortcutsModalOpen(false); return; }
    if (composeState.isOpen) return;
    if (selectedConversationId) setSelectedConversationId(null);
    else if (searchQuery) setSearchQuery('');
    else if (focusedConversationId) setFocusedConversationId(null);
  }, [composeState.isOpen, selectedConversationId, searchQuery, focusedConversationId, isShortcutsModalOpen]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  }, []);

  const toggleSidebar = useCallback(() => { setIsSidebarCollapsed(prev => { const newState = !prev; localStorage.setItem('isSidebarCollapsed', String(newState)); return newState; }); }, []);
  const toggleConversationSelection = useCallback((conversationId: string) => { setSelectedConversationIds(prev => { const newSet = new Set(prev); if (newSet.has(conversationId)) newSet.delete(conversationId); else newSet.add(conversationId); return newSet; }); }, []);
  const selectAllConversations = useCallback((conversationIds: string[]) => { setSelectedConversationIds(new Set(conversationIds)); }, []);
  
  const markConversationsAsRead = useCallback((conversationIds: string[], isRead: boolean) => {
    const realIds = getRealConversationIds(conversationIds);
    setEmails(prevEmails => prevEmails.map(email => {
        if (realIds.includes(email.conversationId)) {
            return { ...email, isRead };
        }
        return email;
    }));
  }, [getRealConversationIds]);
  
  const bulkAction = useCallback((action: 'read' | 'unread' | 'delete') => {
    const ids = Array.from(selectedConversationIds);
    if (ids.length === 0) return;
    if (action === 'delete') deleteConversation(ids);
    else { markConversationsAsRead(ids, action === 'read'); addToast(`Marked ${ids.length} item(s) as ${action}.`); }
    deselectAllConversations();
  }, [selectedConversationIds, deleteConversation, deselectAllConversations, markConversationsAsRead, addToast]);

  const bulkDelete = useCallback(() => bulkAction('delete'), [bulkAction]);
  const bulkMarkAsRead = useCallback(() => bulkAction('read'), [bulkAction]);
  const bulkMarkAsUnread = useCallback(() => bulkAction('unread'), [bulkAction]);
  const markAsRead = useCallback((conversationId: string) => { markConversationsAsRead([conversationId], true); }, [markConversationsAsRead]);
  const markAsUnread = useCallback((conversationIds: string[]) => { markConversationsAsRead(conversationIds, false); }, [markConversationsAsRead]);

  const navigateConversationList = useCallback((direction: 'up' | 'down') => {
    if (displayedConversations.length === 0) return;
    const currentId = focusedConversationId || selectedConversationId;
    const index = displayedConversations.findIndex(c => c.id === currentId);
    let nextIndex = index + (direction === 'down' ? 1 : -1);
    nextIndex = Math.max(0, Math.min(displayedConversations.length - 1, nextIndex));
    if (nextIndex !== index || !currentId) setFocusedConversationId(displayedConversations[nextIndex]?.id || null);
  }, [displayedConversations, focusedConversationId, selectedConversationId]);
  
  const openFocusedConversation = useCallback(() => {
    if (focusedConversationId) {
        const conv = displayedConversations.find(c => c.id === focusedConversationId);
        if (conv) {
             setSelectedConversationId(conv.__originalConversationId || conv.id);
            if (!conv.isRead) markAsRead(conv.id);
        }
    }
  }, [focusedConversationId, displayedConversations, markAsRead]);

  // Key sequence timeout
  useEffect(() => {
    let timer: number;
    if (keySequence.length > 0) {
        timer = window.setTimeout(() => setKeySequence([]), 2000);
    }
    return () => clearTimeout(timer);
  }, [keySequence]);

  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.nodeName === 'INPUT' || target.nodeName === 'TEXTAREA' || target.isContentEditable || composeState.isOpen) {
        return;
      }
      
      const isMailListView = view === 'mail' && !selectedConversationId;
      const targetIds = selectedConversationIds.size > 0 
          ? Array.from(selectedConversationIds) 
          : (selectedConversationId ? [selectedConversationId] : (focusedConversationId ? [focusedConversationId] : []));
      
      if (keySequence.length > 0) {
          e.preventDefault();
          const fullSequence = [...keySequence, e.key].join('');
          if (fullSequence === 'gi') setCurrentSelectionCallback('folder', SystemFolder.INBOX);
          if (fullSequence === 'gs') setCurrentSelectionCallback('folder', SystemFolder.SENT);
          setKeySequence([]);
          return;
      }

      switch (e.key) {
        case '?':
          e.preventDefault();
          setIsShortcutsModalOpen(p => !p);
          break;
        case 'c':
          e.preventDefault();
          openCompose();
          break;
        case '/':
          e.preventDefault();
          document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
          break;
        case 'g':
          e.preventDefault();
          setKeySequence(['g']);
          break;
        
        // List Navigation / Actions
        case 'j':
        case 'ArrowDown':
            if (isMailListView) { e.preventDefault(); navigateConversationList('down'); }
            break;
        case 'k':
        case 'ArrowUp':
            if (isMailListView) { e.preventDefault(); navigateConversationList('up'); }
            break;
        case 'Enter':
            if (isMailListView && focusedConversationId) { e.preventDefault(); openFocusedConversation(); }
            break;
        case 'x':
             if (isMailListView && focusedConversationId) { e.preventDefault(); toggleConversationSelection(focusedConversationId); }
             break;
        case 'e':
            if (view === 'mail' && targetIds.length > 0) { e.preventDefault(); archiveConversation(targetIds); }
            break;
        case '#':
             if (view === 'mail' && targetIds.length > 0) { e.preventDefault(); deleteConversation(targetIds); }
             break;
        case 'l':
             if (view === 'mail' && targetIds.length > 0) { e.preventDefault(); setShortcutTrigger({ type: 'openLabelPopover', ts: Date.now() }); }
             break;
        case '_': // Shift + -
            if (e.shiftKey && view === 'mail' && targetIds.length > 0) { e.preventDefault(); markAsUnread(targetIds); }
            break;
        case 'Escape':
             handleEscape();
             break;
      }
  }, [view, selectedConversationId, focusedConversationId, selectedConversationIds, composeState.isOpen, keySequence, archiveConversation, deleteConversation, markAsUnread, openCompose, handleEscape, navigateConversationList, openFocusedConversation, setCurrentSelectionCallback, toggleConversationSelection]);


  const createLabel = useCallback((name: string, color: string) => {
      const newLabel = { id: `label-${Date.now()}`, name, color, order: labels.length };
      setLabels(prev => [...prev, newLabel]);
      addToast(`Label "${name}" created.`);
  }, [addToast, labels.length]);

  const updateLabel = useCallback((id: string, updates: Partial<Omit<Label, 'id'>>) => {
      setLabels(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      addToast(`Label updated.`);
  }, [addToast]);

  const deleteLabel = useCallback((id: string) => {
      let labelToDelete: Label | undefined;
      setLabels(prev => {
          labelToDelete = prev.find(l => l.id === id);
          return prev.filter(l => l.id !== id);
      });
      if (labelToDelete) {
          setEmails(prev => prev.map(e => ({ ...e, labelIds: e.labelIds.filter(lid => lid !== id) })));
          addToast(`Label "${labelToDelete.name}" deleted.`);
      }
  }, [addToast]);

  const reorderItems = <T extends { id: string; order: number }>(items: T[], draggedId: string, targetId: string, position: 'top' | 'bottom'): T[] => {
    if (draggedId === targetId) return items;
    
    const localItems = [...items];
    const draggedItem = localItems.find(i => i.id === draggedId);
    
    if (!draggedItem) return items;
    
    const itemsWithoutDragged = localItems.filter(i => i.id !== draggedId);
    
    let insertIndex = itemsWithoutDragged.findIndex(i => i.id === targetId);
    if (insertIndex === -1) return items;

    if (position === 'bottom') {
        insertIndex++;
    }
    
    itemsWithoutDragged.splice(insertIndex, 0, draggedItem);
    
    return itemsWithoutDragged.map((item, index) => ({ ...item, order: index }));
  };
  
  const reorderLabel = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {
      setLabels(prevLabels => {
          const updatedLabels = reorderItems(prevLabels, draggedId, targetId, position);
          return updatedLabels;
      });
  }, []);

  const reorderFolder = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {
    const draggedFolder = userFolders.find(f => f.id === draggedId);
    const targetFolder = userFolders.find(f => f.id === targetId);

    if (!draggedFolder || !targetFolder || draggedFolder.parentId !== targetFolder.parentId) {
        addToast("Folders can only be reordered within the same level.", { duration: 4000 });
        return;
    }

    setUserFolders(prevFolders => {
        const siblings = prevFolders.filter(f => f.parentId === draggedFolder.parentId);
        const otherFolders = prevFolders.filter(f => f.parentId !== draggedFolder.parentId);
        
        const reorderedSiblings = reorderItems(siblings, draggedId, targetId, position);
        
        return [...otherFolders, ...reorderedSiblings];
    });
  }, [userFolders, addToast]);
  
  const createFolder = useCallback((name: string, parentId?: string) => {
      const siblings = userFolders.filter(f => f.parentId === parentId);
      const newFolder = { id: `folder-${Date.now()}`, name, parentId, order: siblings.length };
      setUserFolders(prev => [...prev, newFolder]);
      addToast(`Folder "${name}" created.`);
  }, [addToast, userFolders]);

  const updateFolder = useCallback((id: string, newName: string, newParentId?: string) => {
      setUserFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName, parentId: newParentId || undefined } : f));
      addToast(`Folder updated.`);
  }, [addToast]);

  const getFolderDescendants = useCallback((folderId: string): Set<string> => {
    const descendants = new Set<string>();
    const findChildren = (parentId: string) => {
        const children = userFolders.filter(f => f.parentId === parentId);
        children.forEach(child => {
            descendants.add(child.id);
            findChildren(child.id);
        });
    };
    findChildren(folderId);
    return descendants;
  }, [userFolders]);

  const deleteFolder = useCallback((id: string) => {
      let folderToDelete = userFolders.find(f => f.id === id);
      if (folderToDelete) {
          const descendantIds = getFolderDescendants(id);
          const allFolderIdsToDelete = new Set([id, ...descendantIds]);
          
          setEmails(prev => prev.map(e => allFolderIdsToDelete.has(e.folderId) ? { ...e, folderId: SystemFolder.ARCHIVE } : e));
          setUserFolders(prev => prev.filter(f => !allFolderIdsToDelete.has(f.id)));
          
          addToast(`Folder "${folderToDelete.name}" and its subfolders deleted. Contents moved to Archive.`);
      }
  }, [addToast, userFolders, getFolderDescendants]);

  const updateSignature = useCallback((signature: Signature) => { setAppSettings(prev => ({...prev, signature})); addToast('Signature settings updated.'); }, [addToast]);
  const updateAutoResponder = useCallback((autoResponder: AutoResponder) => { setAppSettings(prev => ({...prev, autoResponder})); addToast('Auto-responder settings updated.'); }, [addToast]);
  const addRule = useCallback((ruleData: Omit<Rule, 'id'>) => { const newRule = { ...ruleData, id: `rule-${Date.now()}`}; setAppSettings(prev => ({...prev, rules: [...prev.rules, newRule]})); addToast("Rule added."); }, [addToast]);
  const deleteRule = useCallback((ruleId: string) => { setAppSettings(prev => ({ ...prev, rules: prev.rules.filter(r => r.id !== ruleId) })); addToast("Rule deleted."); }, [addToast]);
  const updateSendDelay = useCallback((sendDelay: AppSettings['sendDelay']) => { setAppSettings(prev => ({ ...prev, sendDelay })); addToast("Send delay settings updated."); }, [addToast]);
  const updateConversationView = useCallback((enabled: boolean) => { setAppSettings(prev => ({ ...prev, conversationView: enabled })); addToast(`Conversation view ${enabled ? 'enabled' : 'disabled'}.`); }, [addToast]);
  const updateBlockExternalImages = useCallback((enabled: boolean) => { setAppSettings(prev => ({ ...prev, blockExternalImages: enabled })); addToast(`External images will be ${enabled ? 'blocked' : 'shown'} by default.`); }, [addToast]);
  const updateDisplayDensity = useCallback((density: DisplayDensity) => { setAppSettings(prev => ({ ...prev, displayDensity: density })); addToast(`Display density set to ${density}.`); }, [addToast]);

  const markAsSpam = useCallback((conversationIds: string[]) => {
    const realIds = getRealConversationIds(conversationIds);
    moveConversations(realIds, SystemFolder.SPAM);
  }, [moveConversations, getRealConversationIds]);

  const markAsNotSpam = useCallback((conversationIds: string[]) => {
    const realIds = getRealConversationIds(conversationIds);
    moveConversations(realIds, SystemFolder.INBOX);
  }, [moveConversations, getRealConversationIds]);
  
  const snoozeConversation = useCallback((conversationIds: string[], until: Date) => {
    const realIds = getRealConversationIds(conversationIds);
    const untilISO = until.toISOString();
    setEmails(prevEmails => {
        return prevEmails.map(email => {
            if (realIds.includes(email.conversationId)) {
                return {
                    ...email,
                    snoozedUntil: untilISO,
                    folderId: SystemFolder.ARCHIVE,
                    labelIds: [...new Set([...email.labelIds, SystemLabel.SNOOZED])]
                };
            }
            return email;
        });
    });
    addToast(`${realIds.length} conversation(s) snoozed.`);
    deselectAllConversations();
    if (realIds.includes(selectedConversationId!)) setSelectedConversationId(null);
  }, [addToast, deselectAllConversations, selectedConversationId, getRealConversationIds]);

  const unsubscribeFromSender = useCallback((senderEmail: string) => {
      addRule({
          condition: { field: 'sender', operator: 'contains', value: senderEmail },
          action: { type: 'moveToFolder', folderId: SystemFolder.TRASH }
      });
      addToast(`Unsubscribed from ${senderEmail}. Future messages will be moved to Trash.`);
  }, [addRule, addToast]);

  const addContact = useCallback((contactData: Omit<Contact, 'id'>) => {
    const newContact: Contact = { ...contactData, id: `contact-${Date.now()}` };
    setContacts(prev => [...prev, newContact].sort((a,b) => a.name.localeCompare(b.name)));
    addToast('Contact added.');
    setSelectedContactId(newContact.id);
  }, [addToast]);
  
  const updateContact = useCallback((updatedContact: Contact) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c).sort((a,b) => a.name.localeCompare(b.name)));
    addToast('Contact updated.');
  }, [addToast]);

  const deleteContact = useCallback((contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
    setContactGroups(prev => prev.map(g => ({ ...g, contactIds: g.contactIds.filter(id => id !== contactId) })));
    addToast('Contact deleted.');
    setSelectedContactId(null);
  }, [addToast]);
  
  const importContacts = useCallback((newContacts: Omit<Contact, 'id'>[]) => {
    let importedCount = 0, skippedCount = 0;
    setContacts(prev => {
        const existingEmails = new Set(prev.map(c => c.email.toLowerCase()));
        const contactsToAdd: Contact[] = [];
        newContacts.forEach((newContact, index) => {
            if (newContact.email && !existingEmails.has(newContact.email.toLowerCase())) {
                contactsToAdd.push({ ...newContact, id: `contact-${Date.now()}-${index}` });
                existingEmails.add(newContact.email.toLowerCase());
                importedCount++;
            } else {
                skippedCount++;
            }
        });
        return contactsToAdd.length > 0 ? [...prev, ...contactsToAdd].sort((a,b) => a.name.localeCompare(b.name)) : prev;
    });
    let toastMessage = '';
    if (importedCount > 0) toastMessage += `Imported ${importedCount} new contact(s). `;
    if (skippedCount > 0) toastMessage += `Skipped ${skippedCount} duplicate(s).`;
    addToast(toastMessage || 'No new contacts to import.');
  }, [addToast]);
  
  const createContactGroup = useCallback((name: string) => {
      const newGroup: ContactGroup = { id: `group-${Date.now()}`, name, contactIds: [] };
      setContactGroups(prev => [...prev, newGroup].sort((a,b) => a.name.localeCompare(b.name)));
      addToast(`Group "${name}" created.`);
  }, [addToast]);
  
  const renameContactGroup = useCallback((groupId: string, newName: string) => {
      setContactGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g).sort((a,b) => a.name.localeCompare(b.name)));
      addToast('Group renamed.');
  }, [addToast]);
  
  const deleteContactGroup = useCallback((groupId: string) => {
      setContactGroups(prev => prev.filter(g => g.id !== groupId));
      if (selectedGroupId === groupId) setSelectedGroupId(null);
      addToast('Group deleted.');
  }, [addToast, selectedGroupId]);
  
  const addContactToGroup = useCallback((groupId: string, contactId: string) => {
      setContactGroups(prev => prev.map(g => (g.id === groupId && !g.contactIds.includes(contactId)) ? { ...g, contactIds: [...g.contactIds, contactId] } : g));
      const groupName = contactGroups.find(g => g.id === groupId)?.name;
      const contactName = contacts.find(c => c.id === contactId)?.name;
      if(groupName && contactName) addToast(`${contactName} added to ${groupName}.`);
  }, [addToast, contactGroups, contacts]);
  
  const removeContactFromGroup = useCallback((groupId: string, contactId: string) => { setContactGroups(prev => prev.map(g => g.id === groupId ? { ...g, contactIds: g.contactIds.filter(id => id !== contactId) } : g)); }, []);

  const setViewCallback = useCallback((newView: View) => { setView(newView); setSelectedConversationId(null); setFocusedConversationId(null); setSearchQuery(''); setSelectedConversationIds(new Set()); setSelectedContactId(null); }, []);

  const completeFirstTimeSetup = useCallback((name: string, accountType: Identity['accountType']) => {
    if (!user) return;
    const newIdentity: Identity = {
        id: `identity-${Date.now()}`,
        name,
        email: user.email,
        accountType
    };
    setAppSettings(prev => ({...prev, identities: [newIdentity]}));
    setUser(prev => prev ? {...prev, name} : null);
    
    // Create or update the user's own contact
    const selfContact: Contact = { id: user.id, name, email: user.email };
    setContacts(prev => {
        const existing = prev.find(c => c.id === user.id);
        if (existing) {
            return prev.map(c => c.id === user.id ? selfContact : c).sort((a,b) => a.name.localeCompare(b.name));
        }
        return [...prev, selfContact].sort((a,b) => a.name.localeCompare(b.name));
    });

    localStorage.setItem('isSetupComplete', 'true');
    setIsSetupComplete(true);
    addToast('Welcome! Your settings have been saved.');
  }, [user, addToast]);

  const updateIdentity = useCallback((updatedIdentity: Identity) => {
      if (!user) return;
      setAppSettings(prev => ({
          ...prev,
          identities: prev.identities.map(id => id.id === updatedIdentity.id ? updatedIdentity : id)
      }));

      // If the primary identity was updated, update the user object
      if (updatedIdentity.email === user.email) {
          setUser(prev => prev ? { ...prev, name: updatedIdentity.name } : null);
      }
      
      // Also update the user's "self" contact
      const selfContact: Contact = { id: user.id, name: updatedIdentity.name, email: user.email };
       setContacts(prev => prev.map(c => c.id === user.id ? selfContact : c).sort((a,b) => a.name.localeCompare(b.name)));

      addToast('Identity updated.');
  }, [user, addToast]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
        addToast("This browser does not support desktop notification", { duration: 5000 });
        return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      setAppSettings(prev => ({ ...prev, notifications: { ...prev.notifications, enabled: true } }));
      addToast('Desktop notifications enabled!');
    } else {
      addToast('Notifications permission not granted.');
    }
  }, [addToast]);

  const updateNotificationSettings = useCallback((enabled: boolean) => {
    if (notificationPermission !== 'granted' && enabled) {
        addToast('Please enable notification permissions in your browser first.');
        return;
    }
    setAppSettings(prev => ({ ...prev, notifications: { enabled } }));
    addToast(`Desktop notifications ${enabled ? 'enabled' : 'disabled'}.`);
  }, [addToast, notificationPermission]);
  
  const createTemplate = useCallback((name: string, body: string) => {
    const newTemplate: Template = { id: `template-${Date.now()}`, name, body };
    setAppSettings(prev => ({ ...prev, templates: [...prev.templates, newTemplate] }));
    addToast(`Template "${name}" created.`);
  }, [addToast]);

  const updateTemplate = useCallback((id: string, updates: Partial<Omit<Template, 'id'>>) => {
    setAppSettings(prev => ({
        ...prev,
        templates: prev.templates.map(t => (t.id === id ? { ...t, ...updates } : t)),
    }));
    addToast(`Template updated.`);
  }, [addToast]);

  const deleteTemplate = useCallback((id: string) => {
    setAppSettings(prev => ({
        ...prev,
        templates: prev.templates.filter(t => t.id !== id),
    }));
    addToast('Template deleted.');
  }, [addToast]);

  useEffect(() => {
    if (!appSettings.notifications.enabled || notificationPermission !== 'granted' || !user) {
        return;
    }

    const intervalId = setInterval(() => {
        if (document.hidden) {
            const newConvId = `conv-${Date.now()}`;
            const newEmail: Email = {
                id: `email-${Date.now()}`,
                conversationId: newConvId,
                senderName: 'Acme Corp',
                senderEmail: 'notifications@acme.inc',
                recipientEmail: user.email,
                subject: 'Weekly Digest & Important Updates',
                body: '<p>This is a simulated new email to demonstrate desktop notifications. Click to view.</p>',
                snippet: 'This is a simulated new email...',
                timestamp: new Date().toISOString(),
                isRead: false,
                folderId: SystemFolder.INBOX,
                labelIds: [],
            };
            
            const notification = new Notification(`New Email from ${newEmail.senderName}`, {
                body: newEmail.subject,
                icon: '/logo.svg', // A generic icon
            });

            notification.onclick = () => {
                window.focus();
                setEmails(prev => [newEmail, ...prev]);
                setView('mail');
                setCurrentSelection({type: 'folder', id: SystemFolder.INBOX});
                setSelectedConversationId(newConvId);
                setTimeout(() => markAsRead(newConvId), 100);
            };
        }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [appSettings.notifications.enabled, notificationPermission, user, setEmails, setView, setCurrentSelectionCallback, setSelectedConversationId, markAsRead]);

  const contextValue: AppContextType = {
    user, emails, conversations: allConversations, labels: sortedLabels, userFolders, folderTree, flattenedFolderTree, currentSelection, selectedConversationId, focusedConversationId, composeState, searchQuery, selectedConversationIds, theme, displayedConversations, isSidebarCollapsed, view, appSettings, contacts, contactGroups, selectedContactId, selectedGroupId, isLoading, isSetupComplete, notificationPermission, isShortcutsModalOpen, shortcutTrigger, isOnline,
    login, logout, checkUserSession,
    setCurrentSelection: setCurrentSelectionCallback, setSelectedConversationId, setSearchQuery,
    openCompose, closeCompose, toggleMinimizeCompose, sendEmail, cancelSend, saveDraft, deleteDraft,
    moveConversations,
    toggleLabel, applyLabel, removeLabel, deleteConversation, archiveConversation, markAsRead, markAsUnread, markAsSpam, markAsNotSpam, snoozeConversation, unsnoozeConversation, unsubscribeFromSender,
    toggleConversationSelection, selectAllConversations, deselectAllConversations, bulkDelete, bulkMarkAsRead, bulkMarkAsUnread,
    toggleTheme, toggleSidebar, handleEscape, navigateConversationList, openFocusedConversation, setView: setViewCallback, setIsShortcutsModalOpen, handleKeyboardShortcut, clearShortcutTrigger: () => setShortcutTrigger(null),
    updateSignature, updateAutoResponder, addRule, deleteRule, updateSendDelay, completeFirstTimeSetup, updateIdentity, requestNotificationPermission, updateNotificationSettings, updateConversationView, updateBlockExternalImages, updateDisplayDensity, createTemplate, updateTemplate, deleteTemplate,
    createLabel, updateLabel, deleteLabel, reorderLabel,
    createFolder, updateFolder, deleteFolder, getFolderDescendants, reorderFolder,
    addContact, updateContact, deleteContact, setSelectedContactId, importContacts,
    createContactGroup, renameContactGroup, deleteContactGroup, addContactToGroup, removeContactFromGroup, setSelectedGroupId,
  };

  return <AppContext.Provider value={useMemo(() => contextValue, [contextValue])}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppContextProvider');
  return context;
};