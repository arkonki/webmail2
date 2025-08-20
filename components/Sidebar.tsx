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
  isDropTarget?: boolean;
  dropPosition?: 'top' | 'bottom' | null;
  onDragStartHandle?: (e: React.DragEvent) => void;
  onDragEnterItem?: (e: React.DragEvent) => void;
  onDragOverItem?: (e: React.DragEvent) => void;
  onDropItem?: (e: React.DragEvent) => void;
  onDragEndHandle?: (e: React.DragEvent) => void;
  onDragLeaveItem?: (e: React.DragEvent) => void;
  isActionable?: boolean;
}

const NavItem: React.FC<NavItemProps> = (props) => {
  const { name, icon, isActive, onClick, isSidebarCollapsed, isEditable, onEdit, onDelete,
    isBeingDragged, isDropTarget, dropPosition,
    onDragStartHandle, onDragEnterItem, onDragOverItem, onDropItem, onDragEndHandle, onDragLeaveItem, isActionable } = props;
  
  const [isHovered, setIsHovered] = useState(false);

  const justifyContent = isSidebarCollapsed ? 'justify-center' : 'justify-start';
  const baseClasses = `group relative w-full flex items-center ${justifyContent} px-4 py-2 my-1 text-sm rounded-r-full cursor-pointer transition-all duration-200 ease-in-out`;
  const activeClasses = 'bg-primary text-white font-bold';
  const inactiveClasses = 'text-gray-700 dark:text-dark-on-surface hover:bg-gray-200 dark:hover:bg-dark-surface-container';
  const beingDraggedClasses = isBeingDragged ? 'opacity-40' : '';
  const showAsTarget = isDropTarget || (isActionable && isHovered && !isActive);
  const dropTargetClasses = showAsTarget ? 'scale-105 bg-primary/20 dark:bg-primary/30 ring-2 ring-primary ring-inset' : '';

  return (
    <li
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${beingDraggedClasses} ${dropTargetClasses}`}
      onClick={onClick}
      title={isSidebarCollapsed ? name : undefined}
      onDragEnter={onDragEnterItem}
      onDragOver={onDragOverItem}
      onDrop={onDropItem}
      onDragLeave={onDragLeaveItem}
      onDragEnd={onDragEndHandle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
        {isDropTarget && !isSidebarCollapsed && dropPosition === 'top' && <div className="absolute top-0 left-4 right-0 h-0.5 bg-primary z-10" />}
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
                title={"Drag to reorder"}
            >
                <ArrowsUpDownIcon className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><PencilIcon className="w-4 h-4" /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><TrashIcon className="w-4 h-4" /></button>
        </div>
      )}
      {isDropTarget && !isSidebarCollapsed && dropPosition === 'bottom' && <div className="absolute bottom-0 left-4 right-0 h-0.5 bg-primary z-10" />}
    </li>
  );
};


const Sidebar: React.FC = () => {
  const { 
    currentSelection, setCurrentSelection, openCompose, labels, userFolders, folderTree, isSidebarCollapsed, 
    sidebarSectionOrder, reorderSidebarSections,
    applyLabel, moveConversations, deleteFolder, view, reorderLabel, reorderFolder, isDraggingEmail,
    selectedConversationIds, toggleLabel, setIsDraggingEmail
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
  
  const [draggedItem, setDraggedItem] = useState<{id: string, type: 'label' | 'folder' | 'section'} | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);
  const dragCounter = useRef(0);
  
  useEffect(() => { localStorage.setItem('isLabelsCollapsed', String(isLabelsCollapsed)); }, [isLabelsCollapsed]);
  useEffect(() => { localStorage.setItem('isFoldersCollapsed', String(isFoldersCollapsed)); }, [isFoldersCollapsed]);
  useEffect(() => { localStorage.setItem('expandedFolders', JSON.stringify(Array.from(expandedFolders))); }, [expandedFolders]);

  const hasSelection = selectedConversationIds.size > 0;

  const handleFolderClick = (folderId: string) => {
    const ids = Array.from(selectedConversationIds);
    if (ids.length > 0) {
      moveConversations(ids, folderId);
    } else {
      setCurrentSelection('folder', folderId);
    }
  };

  const handleLabelClick = (labelId: string) => {
    const ids = Array.from(selectedConversationIds);
    if (ids.length > 0) {
      toggleLabel(ids, labelId);
    } else {
      setCurrentSelection('label', labelId);
    }
  };

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
  
  // Handlers for re-ordering items within the sidebar
  const handleReorderDragStart = (e: React.DragEvent, type: 'label' | 'folder' | 'section', id: string) => {
    e.stopPropagation();
    setDraggedItem({ type, id });
    e.dataTransfer.setData('application/x-webmail-reorder', JSON.stringify({id, type}));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItemId(null);
    setDropPosition(null);
    dragCounter.current = 0;
  };
  
  const handleDragEnter = (e: React.DragEvent, id: string) => {
    if (isDraggingEmail || draggedItem) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        setDragOverItemId(id);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    if (isDraggingEmail || draggedItem) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDragOverItemId(null);
            setDropPosition(null);
        }
    }
  };

  const handleDragOver = (e: React.DragEvent, type: 'label' | 'folder' | 'section', item: Label | UserFolder | { id: string }) => {
    // Logic for dropping emails onto items
    if (isDraggingEmail) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      return;
    }

    // Logic for reordering items
    if (draggedItem) {
        e.preventDefault();
        e.stopPropagation();
        if (draggedItem.id === item.id || draggedItem.type !== type) {
            return;
        }
        if (type === 'folder') {
            const draggedFolder = userFolders.find(f => f.id === draggedItem.id);
            if (draggedFolder?.parentId !== (item as UserFolder).parentId) return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        setDropPosition(e.clientY < midpoint ? 'top' : 'bottom');
    }
  };

  const performDrop = (e: React.DragEvent, dropTargetType: 'label' | 'folder' | 'system-folder' | 'system-label' | 'section', item: Label | UserFolder | {id: string}) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // First, check for re-order drop
      const reorderDataStr = e.dataTransfer.getData('application/x-webmail-reorder');
      if (reorderDataStr) {
        const reorderData = JSON.parse(reorderDataStr);
        if (reorderData.type === 'label' && dropTargetType === 'label' && dropPosition) {
          reorderLabel(reorderData.id, item.id, dropPosition);
        } else if (reorderData.type === 'folder' && dropTargetType === 'folder' && dropPosition) {
          reorderFolder(reorderData.id, item.id, dropPosition);
        } else if (reorderData.type === 'section' && dropTargetType === 'section') {
            reorderSidebarSections(reorderData.id, item.id as 'folders' | 'labels');
        }
        return;
      }
      
      // Second, check for email drop
      const convDataStr = e.dataTransfer.getData('application/json');
      if (convDataStr) {
          setIsDraggingEmail(false);
          const convData = JSON.parse(convDataStr);
          if (convData.conversationIds) {
            if (dropTargetType === 'label' || dropTargetType === 'system-label') {
              applyLabel(convData.conversationIds, item.id);
            } else if (dropTargetType === 'folder' || dropTargetType === 'system-folder') {
              moveConversations(convData.conversationIds, item.id);
            }
          }
      }
    } catch (err) {
      console.error("Drop failed", err);
      setIsDraggingEmail(false);
    }
  };

  const handleDrop = (e: React.DragEvent, dropTargetType: 'label' | 'folder' | 'system-folder' | 'system-label' | 'section', item: Label | UserFolder | {id: string}) => {
    performDrop(e, dropTargetType, item);
    handleDragEnd(); // Clean up all drag states
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
                onClick={() => handleFolderClick(node.id)}
                isSidebarCollapsed={isSidebarCollapsed}
                onEdit={() => handleOpenFolderModal(node)}
                onDelete={() => handleDeleteFolder(node)}
                isEditable
                isActionable={hasSelection}
                isBeingDragged={draggedItem?.type === 'folder' && draggedItem.id === node.id}
                isDropTarget={dragOverItemId === node.id}
                dropPosition={dragOverItemId === node.id ? dropPosition : null}
                onDragStartHandle={(e) => handleReorderDragStart(e, 'folder', node.id)}
                onDragEnterItem={(e) => handleDragEnter(e, node.id)}
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
  
  const sections = {
    folders: (
      <div 
        key="folders" 
        className={`relative mt-4 pt-4 border-t border-outline dark:border-dark-outline transition-opacity ${draggedItem?.id === 'folders' ? 'opacity-40' : ''}`}
        onDragEnter={(e) => handleDragEnter(e, 'folders')}
        onDragOver={(e) => handleDragOver(e, 'section', {id: 'folders'})}
        onDrop={(e) => handleDrop(e, 'section', {id: 'folders'})}
        onDragLeave={handleDragLeave}
        onDragEnd={handleDragEnd}
      >
        {dragOverItemId === 'folders' && !isSidebarCollapsed && dropPosition === 'top' && <div className="absolute top-0 left-0 right-0 h-1 bg-primary z-10" />}
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
                    <button 
                      draggable 
                      onDragStart={(e) => handleReorderDragStart(e, 'section', 'folders')}
                      onClick={e => e.stopPropagation()}
                      className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 cursor-move"
                      title={"Reorder sections"}
                    >
                        <ArrowsUpDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button onClick={() => handleOpenFolderModal(null)} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600" title={"Create new folder"}>
                        <PlusIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
            )}
        </div>
        <ul id="folder-list" className={`transition-all duration-300 ease-in-out overflow-hidden ${isFoldersCollapsed && !isSidebarCollapsed ? 'max-h-0' : 'max-h-[500px]'}`}>
            {renderFolderTree(folderTree)}
        </ul>
         {dragOverItemId === 'folders' && !isSidebarCollapsed && dropPosition === 'bottom' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary z-10" />}
      </div>
    ),
    labels: (
      <div 
        key="labels" 
        className={`relative mt-4 pt-4 border-t border-outline dark:border-dark-outline transition-opacity ${draggedItem?.id === 'labels' ? 'opacity-40' : ''}`}
        onDragEnter={(e) => handleDragEnter(e, 'labels')}
        onDragOver={(e) => handleDragOver(e, 'section', {id: 'labels'})}
        onDrop={(e) => handleDrop(e, 'section', {id: 'labels'})}
        onDragLeave={handleDragLeave}
        onDragEnd={handleDragEnd}
      >
        {dragOverItemId === 'labels' && !isSidebarCollapsed && dropPosition === 'top' && <div className="absolute top-0 left-0 right-0 h-1 bg-primary z-10" />}
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
                     <button 
                      draggable 
                      onDragStart={(e) => handleReorderDragStart(e, 'section', 'labels')}
                      onClick={e => e.stopPropagation()}
                      className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 cursor-move"
                      title={"Reorder sections"}
                    >
                        <ArrowsUpDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button onClick={() => handleOpenLabelModal(null)} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600" title={"Create new label"}>
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
                    onClick={() => handleLabelClick(label.id)}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onEdit={() => handleOpenLabelModal(label)}
                    onDelete={() => { /* Should be handled in settings */}}
                    isEditable
                    isActionable={hasSelection}
                    isBeingDragged={draggedItem?.type === 'label' && draggedItem.id === label.id}
                    isDropTarget={dragOverItemId === label.id}
                    dropPosition={dragOverItemId === label.id ? dropPosition : null}
                    onDragStartHandle={(e) => handleReorderDragStart(e, 'label', label.id)}
                    onDragEnterItem={(e) => handleDragEnter(e, label.id)}
                    onDragOverItem={(e) => handleDragOver(e, 'label', label)}
                    onDropItem={(e) => handleDrop(e, 'label', label)}
                    onDragEndHandle={handleDragEnd}
                    onDragLeaveItem={handleDragLeave}
                />
            ))}
        </ul>
        {dragOverItemId === 'labels' && !isSidebarCollapsed && dropPosition === 'bottom' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary z-10" />}
      </div>
    )
  };


  return (
    <aside className={`fixed top-0 pt-16 h-full flex-shrink-0 bg-surface-container dark:bg-dark-surface-container flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex-shrink-0 p-2">
        <button 
          onClick={() => openCompose()}
          className={`flex items-center w-full px-4 py-3 space-x-2 font-semibold text-gray-700 dark:text-gray-800 transition-all duration-150 bg-compose-accent rounded-2xl hover:shadow-lg justify-center`}
          title={isSidebarCollapsed ? "Compose" : undefined}
          >
          <PencilIcon className="w-6 h-6" />
          {!isSidebarCollapsed && <span>Compose</span>}
        </button>
      </div>
      <div className="flex-grow overflow-y-auto mt-2 pr-1">
        <nav>
          <ul>
            {systemFolders.map((folder) => {
              const isMovableTarget = ![SystemFolder.DRAFTS, SystemFolder.SCHEDULED].includes(folder);
              return (
              <NavItem
                key={folder}
                name={folder}
                icon={getSystemFolderIcon(folder)}
                isActive={currentSelection.type === 'folder' && currentSelection.id === folder && view === 'mail'}
                onClick={() => {
                  if (hasSelection && !isMovableTarget) return;
                  handleFolderClick(folder);
                }}
                isSidebarCollapsed={isSidebarCollapsed}
                isDropTarget={dragOverItemId === folder}
                isActionable={hasSelection && isMovableTarget}
                onDropItem={(e) => handleDrop(e, 'system-folder', {id: folder})}
                onDragEnterItem={(e) => handleDragEnter(e, folder)}
                onDragOverItem={(e) => { if (isDraggingEmail) e.preventDefault(); }}
                onDragLeaveItem={handleDragLeave}
              />
            )})}
             <NavItem
                key={SystemLabel.STARRED}
                name={SystemLabel.STARRED}
                icon={<StarIcon className="w-5 h-5" />}
                isActive={currentSelection.type === 'label' && currentSelection.id === SystemLabel.STARRED && view === 'mail'}
                onClick={() => handleLabelClick(SystemLabel.STARRED)}
                isSidebarCollapsed={isSidebarCollapsed}
                isDropTarget={dragOverItemId === SystemLabel.STARRED}
                isActionable={hasSelection}
                onDropItem={(e) => handleDrop(e, 'system-label', {id: SystemLabel.STARRED})}
                onDragEnterItem={(e) => handleDragEnter(e, SystemLabel.STARRED)}
                onDragOverItem={(e) => { if (isDraggingEmail) e.preventDefault(); }}
                onDragLeaveItem={handleDragLeave}
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
            {sidebarSectionOrder.map(sectionId => sections[sectionId])}
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