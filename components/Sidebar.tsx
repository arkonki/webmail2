
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { PencilIcon } from './icons/PencilIcon';
import { InboxIcon } from './icons/InboxIcon';
import { StarIcon } from './icons/StarIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SystemLabel, Label, SystemFolder, UserFolder, FolderTreeNode } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { TagIcon } from './icons/TagIcon';
import LabelModal from './LabelModal';
import { FolderIcon } from './icons/FolderIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import FolderModal from './FolderModal';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ArrowsUpDownIcon } from './icons/ArrowsUpDownIcon';


const getSystemFolderIcon = (folderName: string): React.ReactNode => {
    switch (folderName) {
        case SystemFolder.INBOX: return <InboxIcon className="w-5 h-5" />;
        case SystemFolder.SENT: return <PaperAirplaneIcon className="w-5 h-5" />;
        case SystemFolder.SCHEDULED: return <ClockIcon className="w-5 h-5" />;
        case SystemFolder.SPAM: return <ExclamationCircleIcon className="w-5 h-5" />;
        case SystemFolder.DRAFTS: return <DocumentIcon className="w-5 h-5" />;
        case SystemFolder.TRASH: return <TrashIcon className="w-5 h-5" />;
        case SystemFolder.ARCHIVE: return <ArchiveBoxIcon className="w-5 h-5" />;
        default: return <FolderIcon className="w-5 h-5" />;
    }
}

interface NavItemProps {
  name: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isSidebarCollapsed?: boolean;
  isEditable?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isBeingDragged?: boolean;
  isDragOver?: boolean;
  dropPosition?: 'top' | 'bottom' | null;
  onDragStartHandle?: (e: React.DragEvent) => void;
  onDragOverItem?: (e: React.DragEvent) => void;
  onDropItem?: (e: React.DragEvent) => void;
  onDragEndHandle?: (e: React.DragEvent) => void;
  onDragLeaveItem?: (e: React.DragEvent) => void;
}

const NavItem: React.FC<NavItemProps> = (props) => {
  const { name, icon, isActive, onClick, isSidebarCollapsed, isEditable, onEdit, onDelete,
    isBeingDragged, isDragOver, dropPosition,
    onDragStartHandle, onDragOverItem, onDropItem, onDragEndHandle, onDragLeaveItem } = props;

  const justifyContent = isSidebarCollapsed ? 'justify-center' : 'justify-start';
  const baseClasses = `group relative w-full flex items-center ${justifyContent} px-4 py-2 my-1 text-sm rounded-r-full cursor-pointer transition-all duration-200 ease-in-out`;
  const activeClasses = 'bg-primary text-white font-bold';
  const inactiveClasses = 'text-gray-700 dark:text-dark-on-surface hover:bg-gray-200 dark:hover:bg-dark-surface-container';
  const beingDraggedClasses = isBeingDragged ? 'opacity-40' : '';

  return (
    <li
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${beingDraggedClasses}`}
      onClick={onClick}
      title={isSidebarCollapsed ? name : undefined}
      onDragOver={onDragOverItem}
      onDrop={onDropItem}
      onDragLeave={onDragLeaveItem}
      onDragEnd={onDragEndHandle}
    >
        {isDragOver && dropPosition === 'top' && <div className="absolute top-0 left-4 right-0 h-0.5 bg-primary z-10" />}
        <div className="flex items-center flex-grow min-w-0">
          <div className={`flex items-center min-w-0 ${isSidebarCollapsed ? '' : 'space-x-4'}`}>
            {icon}
            {!isSidebarCollapsed && <span className="truncate">{name}</span>}
          </div>
        </div>
       {isEditable && !isSidebarCollapsed && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center transition-opacity duration-200 opacity-0 group-hover:opacity-100 bg-inherit pl-2">
            <button
                draggable
                onDragStart={onDragStartHandle}
                onClick={e => e.stopPropagation()}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-move"
                title="Drag to reorder"
            >
                <ArrowsUpDownIcon className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><PencilIcon className="w-4 h-4" /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><TrashIcon className="w-4 h-4" /></button>
        </div>
      )}
      {isDragOver && dropPosition === 'bottom' && <div className="absolute bottom-0 left-4 right-0 h-0.5 bg-primary z-10" />}
    </li>
  );
};


const Sidebar: React.FC = () => {
  const { 
    currentSelection, setCurrentSelection, openCompose, labels, userFolders, folderTree, isSidebarCollapsed, 
    applyLabel, moveConversations, deleteFolder, view, reorderLabel, reorderFolder
  } = useAppContext();
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<UserFolder | null>(null);

  const [isLabelsCollapsed, setIsLabelsCollapsed] = useState(() => localStorage.getItem('isLabelsCollapsed') === 'true');
  const [isFoldersCollapsed, setIsFoldersCollapsed] = useState(() => localStorage.getItem('isFoldersCollapsed') === 'true');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('expandedFolders');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [draggedItem, setDraggedItem] = useState<{id: string, type: 'label' | 'folder'} | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);
  
  useEffect(() => { localStorage.setItem('isLabelsCollapsed', String(isLabelsCollapsed)); }, [isLabelsCollapsed]);
  useEffect(() => { localStorage.setItem('isFoldersCollapsed', String(isFoldersCollapsed)); }, [isFoldersCollapsed]);
  useEffect(() => { localStorage.setItem('expandedFolders', JSON.stringify(Array.from(expandedFolders))); }, [expandedFolders]);

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => {
        const newSet = new Set(prev);
        if (newSet.has(folderId)) {
            newSet.delete(folderId);
        } else {
            newSet.add(folderId);
        }
        return newSet;
    })
  }
  
  const handleDragStart = (e: React.DragEvent, type: 'label' | 'folder', id: string) => {
    e.stopPropagation();
    setDraggedItem({ type, id });
    e.dataTransfer.setData('application/x-webmail-reorder', JSON.stringify({id, type}));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, type: 'label' | 'folder', item: Label | UserFolder) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem || draggedItem.id === item.id || draggedItem.type !== type) {
      setDragOverItemId(null);
      return;
    }
    
    if (type === 'folder') {
      const draggedFolder = userFolders.find(f => f.id === draggedItem.id);
      if (draggedFolder?.parentId !== (item as UserFolder).parentId) {
        setDragOverItemId(null);
        return;
      }
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const newPosition = e.clientY < midpoint ? 'top' : 'bottom';
    
    setDropPosition(newPosition);
    setDragOverItemId(item.id);
  };
  
  const handleDrop = (e: React.DragEvent, dropTargetType: 'label' | 'folder' | 'system-folder' | 'system-label', item: Label | UserFolder | {id: string}) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const reorderDataStr = e.dataTransfer.getData('application/x-webmail-reorder');
      if (reorderDataStr) {
        const reorderData = JSON.parse(reorderDataStr);
        if (reorderData.type === 'label' && dropTargetType === 'label' && dropPosition) {
          reorderLabel(reorderData.id, item.id, dropPosition);
        } else if (reorderData.type === 'folder' && dropTargetType === 'folder' && dropPosition) {
          reorderFolder(reorderData.id, item.id, dropPosition);
        }
      } else {
        const convDataStr = e.dataTransfer.getData('application/json');
        if (convDataStr) {
          const convData = JSON.parse(convDataStr);
          if (convData.conversationIds) {
            if (dropTargetType === 'label') {
              applyLabel(convData.conversationIds, item.id);
            } else if (dropTargetType === 'folder' || dropTargetType === 'system-folder') {
              moveConversations(convData.conversationIds, item.id);
            }
          }
        }
      }
    } catch (err) {
      console.error("Drop failed", err);
    }
    handleDragEnd();
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItemId(null);
    setDropPosition(null);
  };
  
  const handleDragLeave = () => {
    setDragOverItemId(null);
    setDropPosition(null);
  };

  const handleOpenLabelModal = (label: Label | null = null) => {
    setEditingLabel(label);
    setIsLabelModalOpen(true);
  }

  const handleOpenFolderModal = (folder: UserFolder | null = null) => {
      setEditingFolder(folder);
      setIsFolderModalOpen(true);
  }

  const handleDeleteFolder = (folder: UserFolder) => {
    if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"? This will also delete all its subfolders and move all emails inside to Archive.`)) {
        deleteFolder(folder.id);
    }
  }

  const systemFolders = Object.values(SystemFolder);
  
  const renderFolderTree = (nodes: FolderTreeNode[]) => {
    return nodes.map(node => (
      <React.Fragment key={node.id}>
        <div className="flex items-center w-full" style={{ paddingLeft: `${node.level > 0 ? 0 : 16}px` }}>
            {node.children.length > 0 && (
                <button onClick={() => toggleFolderExpansion(node.id)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" style={{ marginLeft: `${node.level * 16}px` }}>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${!expandedFolders.has(node.id) ? '-rotate-90' : ''}`} />
                </button>
            )}
             <NavItem
                name={node.name}
                icon={<FolderIcon className="w-5 h-5" />}
                isActive={currentSelection.type === 'folder' && currentSelection.id === node.id && view === 'mail'}
                onClick={() => setCurrentSelection('folder', node.id)}
                isSidebarCollapsed={isSidebarCollapsed}
                onEdit={() => handleOpenFolderModal(node)}
                onDelete={() => handleDeleteFolder(node)}
                isEditable
                isBeingDragged={draggedItem?.type === 'folder' && draggedItem.id === node.id}
                isDragOver={dragOverItemId === node.id}
                dropPosition={dragOverItemId === node.id ? dropPosition : null}
                onDragStartHandle={(e) => handleDragStart(e, 'folder', node.id)}
                onDragOverItem={(e) => handleDragOver(e, 'folder', node)}
                onDropItem={(e) => handleDrop(e, 'folder', node)}
                onDragEndHandle={handleDragEnd}
                onDragLeaveItem={handleDragLeave}
            />
        </div>
        {expandedFolders.has(node.id) && node.children.length > 0 && (
            <ul className="pl-0">{renderFolderTree(node.children)}</ul>
        )}
      </React.Fragment>
    ));
  };


  return (
    <aside className={`fixed top-0 pt-16 h-full flex-shrink-0 bg-surface-container dark:bg-dark-surface-container flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex-shrink-0 p-2">
        <button 
          onClick={() => openCompose()}
          className={`flex items-center w-full px-4 py-3 space-x-2 font-semibold text-gray-700 dark:text-gray-800 transition-all duration-150 bg-compose-accent rounded-2xl hover:shadow-lg justify-center`}
          title={isSidebarCollapsed ? 'Compose' : undefined}
          >
          <PencilIcon className="w-6 h-6" />
          {!isSidebarCollapsed && <span>Compose</span>}
        </button>
      </div>
      <div className="flex-grow overflow-y-auto mt-2 pr-1">
        <nav>
          <ul>
            {systemFolders.map((folder) => (
              <NavItem
                key={folder}
                name={folder}
                icon={getSystemFolderIcon(folder)}
                isActive={currentSelection.type === 'folder' && currentSelection.id === folder && view === 'mail'}
                onClick={() => setCurrentSelection('folder', folder)}
                isSidebarCollapsed={isSidebarCollapsed}
                onDropItem={(e) => handleDrop(e, 'system-folder', {id: folder})}
                onDragOverItem={(e) => {
                    try {
                        const data = JSON.parse(e.dataTransfer.getData('application/json'));
                        if (data.conversationIds) e.preventDefault();
                    } catch (err) {}
                }}
              />
            ))}
             <NavItem
                key={SystemLabel.STARRED}
                name={SystemLabel.STARRED}
                icon={<StarIcon className="w-5 h-5" />}
                isActive={currentSelection.type === 'label' && currentSelection.id === SystemLabel.STARRED && view === 'mail'}
                onClick={() => setCurrentSelection('label', SystemLabel.STARRED)}
                isSidebarCollapsed={isSidebarCollapsed}
                onDropItem={(e) => handleDrop(e, 'system-label', {id: SystemLabel.STARRED})}
                 onDragOverItem={(e) => {
                    try {
                        const data = JSON.parse(e.dataTransfer.getData('application/json'));
                        if (data.conversationIds) e.preventDefault();
                    } catch (err) {}
                }}
              />
               <NavItem
                key={SystemLabel.SNOOZED}
                name={SystemLabel.SNOOZED}
                icon={<ClockIcon className="w-5 h-5" />}
                isActive={currentSelection.type === 'label' && currentSelection.id === SystemLabel.SNOOZED && view === 'mail'}
                onClick={() => setCurrentSelection('label', SystemLabel.SNOOZED)}
                isSidebarCollapsed={isSidebarCollapsed}
              />
          </ul>

            <div key="folders" className="mt-4 pt-4 border-t border-outline dark:border-dark-outline">
                <div className="group flex items-center justify-between px-4 mb-1">
                    <button
                        onClick={() => !isSidebarCollapsed && setIsFoldersCollapsed(p => !p)}
                        className={`flex items-center gap-2 flex-grow text-left ${isSidebarCollapsed ? 'cursor-default' : ''}`}
                        aria-expanded={!isFoldersCollapsed}
                        aria-controls="folder-list"
                    >
                        {!isSidebarCollapsed && <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isFoldersCollapsed ? '-rotate-90' : ''}`} />}
                        <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{isSidebarCollapsed ? "F" : "Folders"}</h3>
                    </button>
                    {!isSidebarCollapsed && (
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button onClick={() => handleOpenFolderModal(null)} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600" title="Create new folder">
                                <PlusIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    )}
                </div>
                <ul id="folder-list" className={`transition-all duration-300 ease-in-out overflow-hidden ${isFoldersCollapsed && !isSidebarCollapsed ? 'max-h-0' : 'max-h-[500px]'}`}>
                    {renderFolderTree(folderTree)}
                </ul>
            </div>
          
            <div key="labels" className="mt-4 pt-4 border-t border-outline dark:border-dark-outline">
                <div className="group flex items-center justify-between px-4 mb-1">
                    <button
                        onClick={() => !isSidebarCollapsed && setIsLabelsCollapsed(p => !p)}
                        className={`flex items-center gap-2 flex-grow text-left ${isSidebarCollapsed ? 'cursor-default' : ''}`}
                        aria-expanded={!isLabelsCollapsed}
                        aria-controls="label-list"
                    >
                        {!isSidebarCollapsed && <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isLabelsCollapsed ? '-rotate-90' : ''}`} />}
                        <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{isSidebarCollapsed ? "L" : "Labels"}</h3>
                    </button>
                    {!isSidebarCollapsed && (
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button onClick={() => handleOpenLabelModal(null)} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600" title="Create new label">
                                <PlusIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    )}
                </div>
                <ul id="label-list" className={`transition-all duration-300 ease-in-out overflow-hidden ${isLabelsCollapsed && !isSidebarCollapsed ? 'max-h-0' : 'max-h-[500px]'}`}>
                    {labels.map(label => (
                        <NavItem
                            key={label.id}
                            name={label.name}
                            icon={<TagIcon className="w-5 h-5" style={{color: label.color}} />}
                            isActive={currentSelection.type === 'label' && currentSelection.id === label.id && view === 'mail'}
                            onClick={() => setCurrentSelection('label', label.id)}
                            isSidebarCollapsed={isSidebarCollapsed}
                            onEdit={() => handleOpenLabelModal(label)}
                            onDelete={() => { /* Should be handled in settings */}}
                            isEditable
                            isBeingDragged={draggedItem?.type === 'label' && draggedItem.id === label.id}
                            isDragOver={dragOverItemId === label.id}
                            dropPosition={dragOverItemId === label.id ? dropPosition : null}
                            onDragStartHandle={(e) => handleDragStart(e, 'label', label.id)}
                            onDragOverItem={(e) => handleDragOver(e, 'label', label)}
                            onDropItem={(e) => handleDrop(e, 'label', label)}
                            onDragEndHandle={handleDragEnd}
                            onDragLeaveItem={handleDragLeave}
                        />
                    ))}
                </ul>
            </div>
        </nav>
      </div>
      {isFolderModalOpen && (
          <FolderModal 
              isOpen={isFolderModalOpen}
              onClose={() => setIsFolderModalOpen(false)}
              folder={editingFolder}
          />
      )}
      {isLabelModalOpen && (
          <LabelModal 
              isOpen={isLabelModalOpen}
              onClose={() => setIsLabelModalOpen(false)}
              label={editingLabel}
          />
      )}
    </aside>
  );
};

export default Sidebar;