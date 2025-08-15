
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Template } from '../types';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import TemplateModal from './TemplateModal';

const TemplateSettings: React.FC = () => {
    const { appSettings, deleteTemplate } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

    const handleOpenModal = (template: Template | null) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const handleDelete = (template: Template) => {
        if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
            deleteTemplate(template.id);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-on-surface dark:text-dark-on-surface">Templates</h2>
                <button onClick={() => handleOpenModal(null)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-md hover:bg-primary-hover">
                    <PlusCircleIcon className="w-5 h-5"/> Create new template
                </button>
            </div>
            <div className="space-y-2">
                {appSettings.templates.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">You haven't created any templates yet.</p>
                ) : (
                    appSettings.templates.map(template => (
                        <div key={template.id} className="flex items-center justify-between p-3 bg-white dark:bg-dark-surface rounded-lg border border-outline dark:border-dark-outline">
                            <p className="text-sm font-medium text-on-surface dark:text-dark-on-surface">{template.name}</p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleOpenModal(template)} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <PencilIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => handleDelete(template)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {isModalOpen && (
                <TemplateModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    template={editingTemplate}
                />
            )}
        </div>
    );
};

export default TemplateSettings;
