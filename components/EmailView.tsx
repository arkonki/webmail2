
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';
import { ArrowUturnRightIcon } from './icons/ArrowUturnRightIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { StarIconSolid } from './icons/StarIconSolid';
import { StarIcon as StarIconOutline } from './icons/StarIcon';
import { MailIcon } from './icons/MailIcon';
import { ActionType, Email, SystemLabel, Label, SystemFolder, Attachment } from '../types';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { EllipsisVerticalIcon } from './icons/EllipsisVerticalIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { NoSymbolIcon } from './icons/NoSymbolIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { TagIcon } from './icons/TagIcon';
import LabelManagerPopover from './LabelManagerPopover';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { FolderArrowDownIcon } from './icons/FolderArrowDownIcon';
import MoveToPopover from './MoveToPopover';
import SearchBar from './SearchBar';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { EyeIcon } from './icons/EyeIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { FileIcon } from './icons/FileIcon';
import { PdfFileIcon } from './icons/PdfFileIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import AttachmentPreviewModal from './AttachmentPreviewModal';
import { ClockIcon } from './icons/ClockIcon';
import SnoozePopover from './SnoozePopover';
import { PhotoSlashIcon } from './icons/PhotoSlashIcon';


const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType: string, className = "w-8 h-8 text-gray-500 dark:text-gray-400") => {
    if (mimeType.startsWith('image/')) return <PhotoIcon className={className} />;
    if (mimeType === 'application/pdf') return <PdfFileIcon className={className} />;
    if (mimeType.startsWith('text/')) return <DocumentTextIcon className={className} />;
    return <FileIcon className={className} />;
};
const isPreviewable = (mimeType: string) => {
    return mimeType.startsWith('image/') || mimeType.startsWith('text/') || mimeType === 'application/pdf';
}

const SingleEmailInThread: React.FC<{ email: Email; isExpanded: boolean; onToggle: () => void; onReply: (email: Email) => void; onForward: (email: Email) => void; onPreviewAttachment: (attachment: Attachment) => void; }> = ({ email, isExpanded, onToggle, onReply, onForward, onPreviewAttachment }) => {
    const { appSettings } = useAppContext();
    const [forceShowImages, setForceShowImages] = useState(false);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

    const { processedBody, hasBlockedImages } = useMemo(() => {
        const shouldBlock = appSettings.blockExternalImages && !forceShowImages;
        if (!shouldBlock) {
            return { processedBody: email.body, hasBlockedImages: false };
        }

        let blockedCount = 0;
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(email.body, 'text/html');
            const images = doc.querySelectorAll('img');

            images.forEach(img => {
                const src = img.getAttribute('src');
                if (src && src.startsWith('http')) {
                    img.setAttribute('data-original-src', src);
                    img.removeAttribute('src');
                    img.className = `${img.className} blocked-image-placeholder`.trim();
                    blockedCount++;
                }
            });

            return {
                processedBody: doc.body.innerHTML,
                hasBlockedImages: blockedCount > 0
            };
        } catch (e) {
            console.error("Error sanitizing email body:", e);
            // Fallback to original body if parsing fails
            return { processedBody: email.body, hasBlockedImages: false };
        }
    }, [email.body, appSettings.blockExternalImages, forceShowImages]);

    return (
        <div className="border border-outline dark:border-dark-outline rounded-lg mb-4 bg-white dark:bg-dark-surface-container overflow-hidden">
            <div className="p-4 flex justify-between items-center cursor-pointer" onClick={onToggle}>
                <div className="flex items-center min-w-0">
                    <UserCircleIcon className="w-8 h-8 mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-semibold text-on-surface dark:text-dark-on-surface truncate" title={email.senderName}>{email.senderName}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 truncate" title={email.senderEmail}>&lt;{email.senderEmail}&gt;</span>
                            {!isExpanded && <span className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">, {formatDate(email.timestamp)}</span>}
                        </div>
                        <div className="hidden sm:flex items-center">
                            {isExpanded && <span className="mx-2 text-gray-400">&middot;</span>}
                            <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(email.timestamp)}</span>
                        </div>
                    </div>
                </div>
                {!isExpanded && <p className="text-sm text-gray-600 dark:text-gray-400 truncate ml-4 flex-grow">{email.snippet}</p>}
            </div>
            {isExpanded && (
                <div className="px-6 pb-6">
                    <div className="border-t border-outline dark:border-dark-outline pt-4 flex justify-between items-start">
                         <p className="text-sm text-gray-500 dark:text-gray-400">to {email.recipientEmail}</p>
                         <div className="flex items-center">
                             <button onClick={() => onReply(email)} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Reply"><ArrowUturnLeftIcon className="w-5 h-5"/></button>
                            <button onClick={() => onForward(email)} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Forward"><ArrowUturnRightIcon className="w-5 h-5"/></button>
                         </div>
                    </div>
                    {hasBlockedImages && (
                        <div className="my-4 p-3 border border-dashed border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 rounded-md flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <PhotoSlashIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    To protect your privacy, external images have been blocked.
                                </p>
                            </div>
                            <button 
                                onClick={() => setForceShowImages(true)}
                                className="px-3 py-1 text-sm font-semibold text-yellow-900 dark:text-yellow-100 bg-yellow-200 dark:bg-yellow-700/50 rounded-md hover:bg-yellow-300 dark:hover:bg-yellow-700 whitespace-nowrap"
                            >
                                Show images
                            </button>
                        </div>
                    )}
                    <div className="pt-4 prose dark:prose-invert max-w-none prose-a:text-primary dark:prose-a:text-blue-400" dangerouslySetInnerHTML={{ __html: processedBody }} />
                    {email.attachments && email.attachments.length > 0 && (
                        <div className="pt-6 mt-6 border-t border-outline dark:border-dark-outline">
                            <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">Attachment{email.attachments.length > 1 ? 's' : ''}</h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {email.attachments.map((att, index) => (
                                <li key={index} className="group relative flex flex-col justify-between p-3 border border-outline dark:border-dark-outline rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 pt-1">{getFileIcon(att.mimeType, "w-6 h-6 text-gray-500 dark:text-gray-400")}</div>
                                        <div className="truncate flex-grow">
                                            <p className="text-sm font-medium truncate text-on-surface dark:text-dark-on-surface" title={att.fileName}>{att.fileName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(att.fileSize)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 mt-2">
                                        {isPreviewable(att.mimeType) && (
                                            <button onClick={() => onPreviewAttachment(att)} className="p-1.5 text-gray-500 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" title="Preview"><EyeIcon className="w-5 h-5" /></button>
                                        )}
                                        <button className="p-1.5 text-gray-500 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" title="Download"><ArrowDownTrayIcon className="w-5 h-5" /></button>
                                    </div>
                                </li>
                            ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const EmailView: React.FC = () => {
  const { selectedConversationId, setSelectedConversationId, currentSelection, deleteConversation, openCompose, toggleLabel, markAsSpam, markAsNotSpam, conversations, addRule, markAsUnread, archiveConversation, moveConversations, labels, shortcutTrigger, clearShortcutTrigger } = useAppContext();
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const [isMovePopoverOpen, setIsMovePopoverOpen] = useState(false);
  const [isSnoozePopoverOpen, setIsSnoozePopoverOpen] = useState(false);
  const [previewingAttachment, setPreviewingAttachment] = useState<Attachment | null>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const latestEmail = selectedConversation?.emails[selectedConversation.emails.length - 1];
  const isStarred = selectedConversation?.labelIds.includes(SystemLabel.STARRED) || false;

  useEffect(() => {
    if (selectedConversation) {
      const latestEmailId = selectedConversation.emails[selectedConversation.emails.length - 1].id;
      setExpandedEmails(new Set([latestEmailId]));
    }
  }, [selectedConversation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) setIsMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (shortcutTrigger?.type === 'openLabelPopover') {
        setIsLabelPopoverOpen(true);
        clearShortcutTrigger();
    }
  }, [shortcutTrigger, clearShortcutTrigger]);


  if (!selectedConversation) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-white dark:bg-dark-surface text-gray-500 dark:text-gray-400">
        <MailIcon className="w-24 h-24 text-gray-200 dark:text-gray-700" />
        <p className="mt-4 text-lg">Select a conversation to read</p>
      </div>
    );
  }

  const handleToggleExpand = (emailId: string) => { setExpandedEmails(prev => { const newSet = new Set(prev); newSet.has(emailId) ? newSet.delete(emailId) : newSet.add(emailId); return newSet; }); };
  const handleReply = () => openCompose({ action: ActionType.REPLY, email: latestEmail });
  const handleForward = () => openCompose({ action: ActionType.FORWARD, email: latestEmail });
  const handleStarConversation = () => toggleLabel([selectedConversation.id], SystemLabel.STARRED);
  const handleDeleteConversation = () => deleteConversation([selectedConversation.id]);
  const handleSpamAction = () => { currentSelection.id === SystemFolder.SPAM ? markAsNotSpam([selectedConversation.id]) : markAsSpam([selectedConversation.id]); setIsMoreMenuOpen(false); };
  const handleArchive = () => archiveConversation([selectedConversation.id]);
  
  const handleMove = (targetFolderId: string) => {
      moveConversations([selectedConversation.id], targetFolderId);
      setIsMovePopoverOpen(false);
      setIsMoreMenuOpen(false);
  }

  const handleMarkAsUnread = () => { markAsUnread([selectedConversation.id]); setIsMoreMenuOpen(false); setSelectedConversationId(null); };

  const handleBlockSender = () => {
    if (!latestEmail) return;
    if (window.confirm(`Are you sure you want to block ${latestEmail.senderEmail}? Future messages from this sender will be moved to Trash.`)) {
        addRule({
            condition: { field: 'sender', operator: 'contains', value: latestEmail.senderEmail },
            action: { type: 'moveToFolder', folderId: SystemFolder.TRASH }
        });
    }
    setIsMoreMenuOpen(false);
  };

  const handlePrint = () => {
    if (!selectedConversation) return;

    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (printWindow) {
        let contentToPrint = `
            <html>
                <head>
                    <title>Print: ${selectedConversation.subject}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
                        .conversation-header { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #000; }
                        .email { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 1rem; overflow: hidden; page-break-inside: avoid; }
                        .email-header { background: #f9fafb; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9rem; }
                        .email-body { padding: 1rem; }
                        blockquote { border-left: 2px solid #e5e7eb; margin: 0.5rem 0; padding-left: 1rem; color: #6b7280; }
                        img { max-width: 100%; }
                    </style>
                </head>
                <body>
                    <div class="conversation-header">
                        <h1>${selectedConversation.subject}</h1>
                        <p>${selectedConversation.participants.map(p => p.name).join(', ')}</p>
                    </div>
        `;

        selectedConversation.emails.forEach(email => {
            contentToPrint += `
                <div class="email">
                    <div class="email-header">
                        <strong>From:</strong> ${email.senderName} &lt;${email.senderEmail}&gt;<br/>
                        <strong>To:</strong> ${email.recipientEmail}<br/>
                        <strong>Date:</strong> ${new Date(email.timestamp).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                    </div>
                    <div class="email-body">
                        ${email.body}
                    </div>
                </div>
            `;
        });

        contentToPrint += `
                </body>
            </html>
        `;

        printWindow.document.write(contentToPrint);
        printWindow.document.close();
        printWindow.focus(); // required for some browsers
        setTimeout(() => { // allow content to load
             printWindow.print();
             printWindow.close();
        }, 250);
    }
    setIsMoreMenuOpen(false);
  };

  const handleViewSource = () => {
    if (!selectedConversation) return;
    const sourceWindow = window.open('', '_blank');
    if (sourceWindow) {
        let sourceContent = `
            <html>
                <head>
                    <title>Source: ${selectedConversation.subject}</title>
                    <style>
                        body { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 13px; white-space: pre-wrap; word-wrap: break-word; padding: 1.5rem; background-color: #1f1f1f; color: #e3e3e3; line-height: 1.6; }
                        .email-container { border: 1px solid #444; border-radius: 8px; margin-bottom: 2rem; overflow: hidden; }
                        h2 { background: #2d2d2d; color: #60a5fa; padding: 0.75rem 1.5rem; margin: 0; font-size: 1em; font-weight: 500; }
                        pre { margin: 0; padding: 1.5rem; }
                        .headers { color: #d1d5db; }
                        .header-key { color: #9ca3af; }
                        .body-content { color: #e3e3e3; padding-top: 1.5rem; border-top: 1px dashed #444; margin-top: 1.5rem; }
                    </style>
                </head>
                <body>
        `;

        const escapeHtml = (unsafe: string | undefined): string => {
            if (typeof unsafe !== 'string') return '';
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        selectedConversation.emails.forEach((email, index) => {
            let headers = '';
            if (email.messageId) {
                headers += `<span class="header-key">Message-ID:</span> ${escapeHtml(email.messageId)}\n`;
            }
            headers += `<span class="header-key">From:</span> ${escapeHtml(`${email.senderName} <${email.senderEmail}>`)}\n`;
            headers += `<span class="header-key">To:</span> ${escapeHtml(email.recipientEmail)}\n`;
            if (email.cc) {
                headers += `<span class="header-key">Cc:</span> ${escapeHtml(email.cc)}\n`;
            }
            if (email.bcc) {
                headers += `<span class="header-key">Bcc:</span> ${escapeHtml(email.bcc)}\n`;
            }
            headers += `<span class="header-key">Date:</span> ${new Date(email.timestamp).toUTCString()}\n`;
            headers += `<span class="header-key">Subject:</span> ${escapeHtml(email.subject)}\n`;

            sourceContent += `
                <div class="email-container">
                    <h2>Email ${index + 1} of ${selectedConversation.emails.length} (from: ${escapeHtml(email.senderEmail)})</h2>
                    <pre><span class="headers">${headers}</span><div class="body-content">${escapeHtml(email.body)}</div></pre>
                </div>
            `;
        });
        
        sourceContent += `
                </body>
            </html>
        `;

        sourceWindow.document.write(sourceContent);
        sourceWindow.document.close();
    }
    setIsMoreMenuOpen(false);
  };


  const userLabels = selectedConversation.labelIds
    .map(id => labels.find(l => l.id === id))
    .filter((l): l is Label => l !== undefined);

  return (
    <div className="flex-grow flex flex-col bg-gray-50 dark:bg-dark-surface overflow-y-auto">
      <div className="p-4 border-b border-outline dark:border-dark-outline bg-white dark:bg-dark-surface-container sticky top-0 z-10">
        <div className="flex justify-between items-center">
            <div className="flex items-center min-w-0 flex-grow">
                <button onClick={() => setSelectedConversationId(null)} className="p-2 mr-2 -ml-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Back to list">
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex-grow max-w-lg">
                    <SearchBar />
                </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
                {selectedConversation.folderId === SystemFolder.INBOX && <button onClick={handleArchive} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Archive"><ArchiveBoxIcon className="w-5 h-5"/></button>}
                 <button onClick={handleSpamAction} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={currentSelection.id === SystemFolder.SPAM ? "Not spam" : "Mark as spam"}><ExclamationCircleIcon className="w-5 h-5"/></button>
                 <div className="relative">
                    <button onClick={() => setIsSnoozePopoverOpen(p => !p)} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Snooze"><ClockIcon className="w-5 h-5"/></button>
                    {isSnoozePopoverOpen && <SnoozePopover conversationIds={[selectedConversation.id]} onClose={() => setIsSnoozePopoverOpen(false)} />}
                </div>
                 <div className="relative">
                    <button onClick={() => setIsLabelPopoverOpen(p => !p)} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Apply label"><TagIcon className="w-5 h-5"/></button>
                    {isLabelPopoverOpen && <LabelManagerPopover conversationIds={[selectedConversation.id]} onClose={() => setIsLabelPopoverOpen(false)} />}
                </div>
                <button onClick={handleStarConversation} className="p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-500/20" title={isStarred ? 'Unstar conversation' : 'Star conversation'}>{isStarred ? <StarIconSolid className="w-5 h-5 text-yellow-500" /> : <StarIconOutline className="w-5 h-5 text-gray-400" />}</button>
                <button onClick={handleReply} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Reply to latest"><ArrowUturnLeftIcon className="w-5 h-5"/></button>
                <button onClick={handleForward} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Forward latest"><ArrowUturnRightIcon className="w-5 h-5"/></button>
                <button onClick={handleDeleteConversation} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Delete conversation"><TrashIcon className="w-5 h-5"/></button>
                <div className="relative" ref={moreMenuRef}>
                    <button onClick={() => setIsMoreMenuOpen(p => !p)} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="More options"><EllipsisVerticalIcon className="w-5 h-5"/></button>
                    {isMoreMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5 z-20">
                            <div className="py-1">
                                <button onClick={handleMarkAsUnread} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><MailIcon className="w-5 h-5" /> Mark as unread</button>
                                <div className="relative">
                                    <button onClick={() => setIsMovePopoverOpen(p => !p)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><FolderArrowDownIcon className="w-5 h-5" /> Move to...</button>
                                    {isMovePopoverOpen && <MoveToPopover onSelectFolder={handleMove} onClose={() => setIsMovePopoverOpen(false)} aclass="left-full -top-1 ml-1"/>}
                                </div>
                                <button onClick={handlePrint} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><PrinterIcon className="w-5 h-5" /> Print conversation</button>
                                <button onClick={handleViewSource} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><CodeBracketIcon className="w-5 h-5" /> View source</button>
                                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                <button onClick={handleBlockSender} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><NoSymbolIcon className="w-5 h-5" /> Block "{latestEmail?.senderName}"</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        {currentSelection.id === SystemFolder.SPAM && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 text-sm rounded-md mx-4">
                This conversation is in Spam. Messages in Spam will be deleted after 30 days.
            </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-baseline gap-2 mb-4">
            <h1 className="text-2xl font-bold text-on-surface dark:text-dark-on-surface">{selectedConversation.subject}</h1>
            <div className="flex items-center gap-1 flex-shrink-0">
                {userLabels.map(label => (
                    <div key={label.id} className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: `${label.color}33`, color: label.color }}>
                        {label.name}
                    </div>
                ))}
            </div>
        </div>
        {selectedConversation.emails.map(email => (
            <SingleEmailInThread 
                key={email.id} 
                email={email}
                isExpanded={expandedEmails.has(email.id)}
                onToggle={() => handleToggleExpand(email.id)}
                onReply={(email) => openCompose({ action: ActionType.REPLY, email })}
                onForward={(email) => openCompose({ action: ActionType.FORWARD, email })}
                onPreviewAttachment={setPreviewingAttachment}
            />
        ))}
      </div>
       {previewingAttachment && (
        <AttachmentPreviewModal
          attachment={previewingAttachment}
          onClose={() => setPreviewingAttachment(null)}
        />
      )}
    </div>
  );
};

export default EmailView;