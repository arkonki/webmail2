
import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { SystemFolder } from '../types';

interface MoveToPopoverProps {
  onSelectFolder: (folderId: string) => void;
  onClose: () => void;
  aclass?: string;
}

const MoveToPopover: React.FC<MoveToPopoverProps> = ({ onSelectFolder, onClose, aclass }) => {
  const { userFolders, currentSelection, flattenedFolderTree, getFolderDescendants } = useAppContext();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  const currentFolderId = currentSelection.type === 'folder' ? currentSelection.id : null;
  
  const systemFoldersToShow = Object.values(SystemFolder).filter(f => 
    ![SystemFolder.SPAM, SystemFolder.TRASH, currentFolderId].includes(f)
  );

  const descendantIds = currentFolderId ? getFolderDescendants(currentFolderId) : new Set<string>();
  const userFoldersToShow = flattenedFolderTree.filter(f => f.id !== currentFolderId && !descendantIds.has(f.id));

  return (
    <div ref={popoverRef} className={`absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5 z-20 ${aclass}`}>
      <div className="py-1 max-h-60 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Move to</p>
        {systemFoldersToShow.map(folderId => (
          <button
            key={folderId}
            onClick={() => onSelectFolder(folderId)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {folderId}
          </button>
        ))}
        {userFoldersToShow.length > 0 && <div className="my-1 border-t border-outline dark:border-dark-outline" />}
        {userFoldersToShow.map(folder => (
          <button
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            className="w-full text-left py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            style={{ paddingLeft: `${12 + (folder.level * 16)}px` }}
          >
            {folder.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoveToPopover;