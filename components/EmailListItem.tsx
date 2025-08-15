
import React, { useState, useRef, useMemo } from 'react';
import { Conversation, SystemLabel, ActionType, SystemFolder } from '../types';
import { useAppContext } from '../context/AppContext';
import { StarIconSolid } from './icons/StarIconSolid';
import { StarIcon as StarIconOutline } from './icons/StarIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ClockIcon } from './icons/ClockIcon';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { NoSymbolIcon } from './icons/NoSymbolIcon';
import SnoozePopover from './SnoozePopover';

interface ConversationListItemProps {
  conversation: Conversation;
  style?: React.CSSProperties;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({ conversation, style }) => {
  const { user, setSelectedConversationId, toggleLabel, markAsRead, deleteConversation, selectedConversationIds, toggleConversationSelection, openCompose, focusedConversationId, labels, unsubscribeFromSender, appSettings } = useAppContext();
  const { conversationView, displayDensity } = appSettings;
  const isFocused = focusedConversationId === conversation.id;
  const isChecked = selectedConversationIds.has(conversation.id);
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);
  const [isSnoozePopoverOpen, setIsSnoozePopoverOpen] = useState(false);

  const latestEmail = conversation.emails[0];
  const isDraftOrScheduled = conversation.folderId === SystemFolder.DRAFTS || conversation.folderId === SystemFolder.SCHEDULED;
  const isStarred = conversation.labelIds.includes(SystemLabel.STARRED);

  // New logic: Show snippet only if subject is reasonably short
  const showSnippet = conversation.subject.split(' ').length < 10;

  const handleContainerClick = () => {
    if (isDraftOrScheduled) {
      openCompose({ action: ActionType.DRAFT, email: latestEmail });
    } else {
      setSelectedConversationId(conversation.__originalConversationId || conversation.id);
      if (!conversation.isRead) {
          markAsRead(conversation.id);
      }
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleConversationSelection(conversation.id);
  }

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    toggleLabel([conversation.id], SystemLabel.STARRED);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation([conversation.id]);
  }
  
  const handleUnsubscribeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const primarySender = [...conversation.emails].reverse().find(e => e.senderEmail !== user?.email) || latestEmail;
      unsubscribeFromSender(primarySender.senderEmail);
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date.toLocaleDateString() === now.toLocaleDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getParticipantsDisplay = () => {
    if (!conversationView && latestEmail.senderEmail === user?.email) {
        return `To: ${latestEmail.recipientEmail.split('@')[0]}`;
    }
    const names = conversation.participants.map(p => p.name.split(' ')[0]);
    if (names.length > 2) {
      return `${names.slice(0, 2).join(', ')}...`;
    }
    return names.join(', ');
  }

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>) => {
    const idsToMove = selectedConversationIds.has(conversation.id) ? Array.from(selectedConversationIds) : [conversation.id];
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ conversationIds: idsToMove }));

    const dragPreview = document.createElement('div');
    dragPreview.className = 'px-3 py-1 bg-primary text-white text-sm rounded-full shadow-lg';
    dragPreview.textContent = `Move ${idsToMove.length} item${idsToMove.length > 1 ? 's' : ''}`;
    
    dragPreview.style.position = 'absolute';
    dragPreview.style.left = '-1000px';
    document.body.appendChild(dragPreview);
    dragPreviewRef.current = dragPreview;

    e.dataTransfer.setDragImage(dragPreview, 10, 10);
  };

  const handleDragEnd = () => {
    if (dragPreviewRef.current) {
        document.body.removeChild(dragPreviewRef.current);
        dragPreviewRef.current = null;
    }
  };
  
  const userLabels = conversation.labelIds
    .map(id => labels.find(l => l.id === id))
    .filter((l): l is NonNullable<typeof l> => l !== undefined);

  const densityPadding = useMemo(() => {
    switch(displayDensity) {
        case 'compact': return 'py-0.5';
        case 'cozy': return 'py-1';
        case 'comfortable':
        default: return 'py-1.5';
    }
  }, [displayDensity]);

  return (
    <div style={style}>
        <li
        draggable="true"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleContainerClick}
        className={`group flex items-center px-4 ${densityPadding} border-b border-outline dark:border-dark-outline transition-colors duration-150 relative cursor-pointer h-full ${
            isFocused ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-gray-100 dark:hover:bg-dark-surface-container'
        } ${!conversation.isRead && !isDraftOrScheduled ? 'bg-white dark:bg-dark-surface font-bold' : 'bg-surface dark:bg-dark-surface'}`}
        >
            {/* Left section: Checkbox, Star, Sender */}
            <div className="flex items-center flex-shrink-0">
                <div className="flex items-center" onClick={handleCheckboxClick}>
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="form-checkbox h-5 w-5 text-primary rounded border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-800 focus:ring-primary cursor-pointer"
                    />
                </div>
                
                <button onClick={handleStarClick} className="p-2 ml-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-500/20 focus:outline-none flex-shrink-0">
                {isStarred ? <StarIconSolid className="w-5 h-5 text-yellow-500" /> : <StarIconOutline className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
                </button>
                
                <div className={`w-24 sm:w-36 truncate ml-2 flex-shrink-0 ${!conversation.isRead && !isDraftOrScheduled ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                    {getParticipantsDisplay()}
                    {conversationView && conversation.emails.length > 1 && <span className="ml-1 text-xs">({conversation.emails.length})</span>}
                </div>
            </div>
            
            {/* Center section: Subject and Snippet (this part grows) */}
            <div className="flex-grow flex items-center gap-2 min-w-0 mx-2">
                <div className="flex-shrink-0">
                {conversation.folderId === SystemFolder.SCHEDULED && (
                    <span className="inline-flex items-center text-xs font-medium mr-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    Scheduled
                    </span>
                )}
                {conversation.folderId === SystemFolder.DRAFTS && (
                    <span className="inline-flex items-center text-xs font-medium mr-2 px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    Draft
                    </span>
                )}
                </div>
                <div className="truncate">
                    <span className={`${!conversation.isRead && !isDraftOrScheduled ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-800 dark:text-gray-300'}`}>{conversation.subject}</span>
                    {showSnippet && <span className="ml-2 text-gray-500 dark:text-gray-400 font-normal">- {latestEmail.snippet}</span>}
                </div>
            </div>
            
            {/* Right section: Labels, Date, Actions */}
            <div className="relative flex items-center flex-shrink-0 ml-auto pl-2">
                {/* Static content (date, labels) - fades out on hover */}
                <div className="flex items-center transition-opacity duration-200 group-hover:opacity-0">
                    {conversation.isSnoozed && conversation.snoozedUntil && (
                        <div className="flex items-center text-xs text-yellow-700 dark:text-yellow-300 ml-2">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            <span>{new Date(conversation.snoozedUntil).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                    )}
                    <div className="hidden md:flex items-center gap-1 flex-shrink-0">
                        {userLabels.map(label => (
                            <div key={label.id} className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: `${label.color}33`, color: label.color }}>
                                {label.name}
                            </div>
                        ))}
                    </div>
                    {conversation.hasAttachments && <PaperClipIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0" />}
                    <div className={`w-20 text-right ml-2 text-xs whitespace-nowrap ${!conversation.isRead && !isDraftOrScheduled ? 'text-primary font-bold' : 'text-gray-600 dark:text-gray-400'}`}>{formatDate(conversation.lastTimestamp)}</div>
                </div>
                
                {/* Hover actions - fade in on hover */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center bg-inherit">
                    <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setIsSnoozePopoverOpen(p => !p); }} className="p-2 text-gray-500 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none" title="Snooze">
                            <ClockIcon className="w-5 h-5" />
                        </button>
                        {isSnoozePopoverOpen && <SnoozePopover conversationIds={[conversation.id]} onClose={() => setIsSnoozePopoverOpen(false)} />}
                    </div>
                    {conversation.canUnsubscribe && (
                        <button onClick={handleUnsubscribeClick} className="p-2 text-gray-500 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none" title="Unsubscribe">
                            <NoSymbolIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={handleDeleteClick} className="p-2 text-gray-500 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none" title="Delete">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </li>
    </div>
  );
};

export default ConversationListItem;