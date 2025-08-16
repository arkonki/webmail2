import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useAppContext } from '../context/AppContext';
import { TrashIcon } from './icons/TrashIcon';
import { MailIcon } from './icons/MailIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import ConversationListItem from './EmailListItem';
import SearchBar from './SearchBar';
import { TagIcon } from './icons/TagIcon';
import LabelManagerPopover from './LabelManagerPopover';
import { SystemFolder } from '../types';
import { FolderArrowDownIcon } from './icons/FolderArrowDownIcon';
import MoveToPopover from './MoveToPopover';
import { EnvelopeOpenIcon } from './icons/EnvelopeOpenIcon';
import { ClockIcon } from './icons/ClockIcon';
import SnoozePopover from './SnoozePopover';
import { SpinnerIcon } from './icons/SpinnerIcon';

const BulkActionBar = () => {
    const { 
      selectedConversationIds, bulkDelete, bulkMarkAsRead, bulkMarkAsUnread, 
      deselectAllConversations, markAsSpam, archiveConversation, 
      currentSelection, moveConversations, shortcutTrigger, clearShortcutTrigger
    } = useAppContext();
    const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
    const [isMovePopoverOpen, setIsMovePopoverOpen] = useState(false);
    const [isSnoozePopoverOpen, setIsSnoozePopoverOpen] = useState(false);
    const count = selectedConversationIds.size;
    const conversationIds = Array.from(selectedConversationIds);

    useEffect(() => {
        if (shortcutTrigger?.type === 'openLabelPopover') {
            setIsLabelPopoverOpen(true);
            clearShortcutTrigger();
        }
    }, [shortcutTrigger, clearShortcutTrigger]);

    const handleMarkAsSpam = () => {
        markAsSpam(conversationIds);
        deselectAllConversations();
    }
    
    const handleArchive = () => {
        archiveConversation(conversationIds);
    }
    
    const handleMove = (targetFolderId: string) => {
        moveConversations(conversationIds, targetFolderId);
        setIsMovePopoverOpen(false);
    }

    const showArchive = currentSelection.type === 'folder' && currentSelection.id === SystemFolder.INBOX;

    return (
        <div className="flex items-center justify-between p-2 bg-primary/10 dark:bg-primary/20 border-b border-outline dark:border-dark-outline">
            <div className="flex items-center">
                <button onClick={deselectAllConversations} className="px-2 py-1 text-sm font-semibold text-primary">
                    {count} selected
                </button>
            </div>
            <div className="flex items-center space-x-2">
                {showArchive &&
                    <button onClick={handleArchive} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Archive">
                        <ArchiveBoxIcon className="w-5 h-5" />
                    </button>
                }
                <div className="relative">
                    <button onClick={() => setIsSnoozePopoverOpen(prev => !prev)} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Snooze">
                        <ClockIcon className="w-5 h-5" />
                    </button>
                    {isSnoozePopoverOpen && <SnoozePopover conversationIds={conversationIds} onClose={() => setIsSnoozePopoverOpen(false)} />}
                </div>
                <div className="relative">
                    <button onClick={() => setIsMovePopoverOpen(prev => !prev)} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Move to">
                        <FolderArrowDownIcon className="w-5 h-5" />
                    </button>
                    {isMovePopoverOpen && <MoveToPopover onSelectFolder={handleMove} onClose={() => setIsMovePopoverOpen(false)} />}
                </div>
                <div className="relative">
                    <button onClick={() => setIsLabelPopoverOpen(prev => !prev)} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Apply label">
                        <TagIcon className="w-5 h-5" />
                    </button>
                    {isLabelPopoverOpen && <LabelManagerPopover conversationIds={conversationIds} onClose={() => setIsLabelPopoverOpen(false)} />}
                </div>
                <button onClick={bulkMarkAsRead} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Mark as read">
                    <EnvelopeOpenIcon className="w-5 h-5" />
                </button>
                <button onClick={bulkMarkAsUnread} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Mark as unread">
                    <MailIcon className="w-5 h-5" />
                </button>
                <button onClick={handleMarkAsSpam} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Mark as spam">
                    <ExclamationCircleIcon className="w-5 h-5" />
                </button>
                <button onClick={bulkDelete} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Delete">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


const EmailList: React.FC = () => {
  const { appSettings, currentSelection, searchQuery, selectedConversationIds, selectAllConversations, deselectAllConversations, displayedConversations, labels, userFolders, isSyncing } = useAppContext();
  const isSearching = searchQuery.length > 0;
  
  const allDisplayedIds = displayedConversations.map(c => c.id);
  const areAllSelected = allDisplayedIds.length > 0 && allDisplayedIds.every(id => selectedConversationIds.has(id));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      selectAllConversations(allDisplayedIds);
    } else {
      deselectAllConversations();
    }
  };
  
  const getListTitle = () => {
    if (isSearching) return `Search results for "${searchQuery}"`;
    if (currentSelection.type === 'folder') {
        return userFolders.find(f => f.id === currentSelection.id)?.name || currentSelection.id;
    }
    if (currentSelection.type === 'label') {
        return labels.find(l => l.id === currentSelection.id)?.name || currentSelection.id;
    }
    return 'Mail';
  }
  
  const listTitle = getListTitle();
  const emptyMessage = isSearching ? `No results found for "${searchQuery}".` : `No messages in "${listTitle}".`;
  
  const showBulkActions = selectedConversationIds.size > 0;

  const listRef = useRef<HTMLDivElement>(null);
  const [listSize, setListSize] = useState({ width: 0, height: 0 });

  const itemSize = useMemo(() => {
    switch(appSettings.displayDensity) {
        case 'compact': return 46;
        case 'cozy': return 52;
        case 'comfortable':
        default: return 58;
    }
  }, [appSettings.displayDensity]);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    
    const resizeObserver = new ResizeObserver(() => {
      setListSize({ width: element.offsetWidth, height: element.offsetHeight });
    });
    
    resizeObserver.observe(element);
    
    return () => resizeObserver.disconnect();
  }, []);

  const renderContent = () => {
    if (isSyncing && displayedConversations.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400">
                <SpinnerIcon className="w-12 h-12 text-primary animate-spin mb-4" />
                <p>Syncing your mailbox...</p>
            </div>
        );
    }

    if (displayedConversations.length === 0) {
        return (
            <div className="flex-grow flex items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400">
              <p>{emptyMessage}</p>
            </div>
        );
    }
    return (
        <div ref={listRef} className="flex-grow w-full h-full">
            {listSize.width > 0 && listSize.height > 0 && (
                <List
                    height={listSize.height}
                    itemCount={displayedConversations.length}
                    itemSize={itemSize}
                    width={listSize.width}
                >
                    {({ index, style }) => {
                        const conv = displayedConversations[index];
                        return <ConversationListItem key={conv.id} conversation={conv} style={style} />;
                    }}
                </List>
            )}
        </div>
    );
  };

  return (
    <div className="flex-grow flex flex-col bg-white dark:bg-dark-surface overflow-hidden">
        { showBulkActions ? <BulkActionBar /> : (
            <div className="p-4 border-b border-outline dark:border-dark-outline flex items-center gap-4 flex-shrink-0">
                <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-primary rounded border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-800 focus:ring-primary flex-shrink-0"
                    checked={areAllSelected}
                    onChange={handleSelectAll}
                    disabled={displayedConversations.length === 0}
                    title="Select all"
                />
                <div className="flex-grow max-w-lg">
                    <SearchBar />
                </div>
                 <h2 className="text-lg font-medium text-on-surface dark:text-dark-on-surface truncate sr-only">{listTitle}</h2>
            </div>
        )}
      {renderContent()}
    </div>
  );
};

export default EmailList;