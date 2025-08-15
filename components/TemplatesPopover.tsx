
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Template } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import TemplateModal from './TemplateModal';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface TemplatesPopoverProps {
  onInsert: (html: string) => void;
  onClose: () => void;
}

const TemplatesPopover: React.FC<TemplatesPopoverProps> = ({ onInsert, onClose }) => {
    const { appSettings, deleteTemplate } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
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

    const handleEdit = (e: React.MouseEvent, template: Template) => {
        e.stopPropagation();
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, template: Template) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
            deleteTemplate(template.id);
        }
    };

    const filteredTemplates = appSettings.templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <>
            <div ref={popoverRef} className="absolute left-0 bottom-full mb-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5 z-20">
                <div className="p-2 border-b border-outline dark:border-dark-outline">
                    <input
                        type="text"
                        placeholder="Search templates"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-md border-transparent focus:ring-primary focus:border-primary"
                    />
                </div>
                <div className="py-1 max-h-60 overflow-y-auto">
                    {filteredTemplates.length > 0 ? filteredTemplates.map(template => (
                        <div key={template.id} className="group w-full text-left flex justify-between items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={() => onInsert(template.body)}>
                            <span className="truncate pr-2">{template.name}</span>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleEdit(e, template)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><PencilIcon className="w-4 h-4" /></button>
                                <button onClick={(e) => handleDelete(e, template)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )) : (
                        <p className="px-3 py-4 text-center text-sm text-gray-500">No templates found.</p>
                    )}
                </div>
                <div className="p-2 border-t border-outline dark:border-dark-outline">
                    <button onClick={() => { setEditingTemplate(null); setIsModalOpen(true); }} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        <PlusIcon className="w-4 h-4"/> Create new template
                    </button>
                </div>
            </div>
            {isModalOpen && (
                <TemplateModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    template={editingTemplate}
                />
            )}
        </>
    );
};

export default TemplatesPopover;
