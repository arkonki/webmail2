
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { UserFolder, FolderTreeNode } from '../types';
import FolderModal from './FolderModal';
import { FolderPlusIcon } from './icons/FolderPlusIcon';

const FolderRow: React.FC<{
    node: FolderTreeNode;
    onEdit: (folder: UserFolder) => void;
    onDelete: (folder: UserFolder) => void;
    onAddSubfolder: (parentId: string) => void;
}> = ({ node, onEdit, onDelete, onAddSubfolder }) => {
    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-dark-surface rounded-lg border border-outline dark:border-dark-outline">
                <p className="text-sm text-on-surface dark:text-dark-on-surface" style={{ paddingLeft: `${node.level * 24}px` }}>
                    {node.name}
                </p>
                <div className="flex items-center gap-2">
                    <button onClick={() => onAddSubfolder(node.id)} className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Add subfolder">
                        <FolderPlusIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => onEdit(node)} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Edit folder">
                        <PencilIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => onDelete(node)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Delete folder">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

const FolderSettings: React.FC = () => {
    const { userFolders, deleteFolder, flattenedFolderTree } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState<UserFolder | null>(null);
    const [modalParentId, setModalParentId] = useState<string | undefined>(undefined);

    const handleOpenModal = (folder: UserFolder | null, parentId?: string) => {
        setEditingFolder(folder);
        setModalParentId(parentId);
        setIsModalOpen(true);
    };

    const handleDelete = (folder: UserFolder) => {
        if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"? This will also delete all its subfolders and move all emails inside to Archive.`)) {
            deleteFolder(folder.id);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-on-surface dark:text-dark-on-surface">Folders</h2>
                <button onClick={() => handleOpenModal(null)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-md hover:bg-primary-hover">
                    <PlusCircleIcon className="w-5 h-5"/> Create new folder
                </button>
            </div>
            <div className="space-y-2">
                {userFolders.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No custom folders have been created.</p>
                ) : (
                    flattenedFolderTree.map(node => (
                        <FolderRow
                            key={node.id}
                            node={node}
                            onEdit={handleOpenModal}
                            onDelete={handleDelete}
                            onAddSubfolder={(parentId) => handleOpenModal(null, parentId)}
                        />
                    ))
                )}
            </div>
            {isModalOpen && (
                <FolderModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    folder={editingFolder}
                    parentId={modalParentId}
                />
            )}
        </div>
    );
};

export default FolderSettings;