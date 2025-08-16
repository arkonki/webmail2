
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { Template } from '../types';
import RichTextToolbar from './RichTextToolbar';
import DOMPurify from 'dompurify';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, template }) => {
    const { createTemplate, updateTemplate } = useAppContext();
    const [name, setName] = useState(template?.name || '');
    const [body, setBody] = useState(template?.body || '');
    const contentRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const rootEl = document.getElementById('root');
        if (isOpen) {
            rootEl?.setAttribute('inert', '');
        }
        return () => {
            rootEl?.removeAttribute('inert');
        };
    }, [isOpen]);
    
    useEffect(() => {
        if (isOpen && contentRef.current) {
            contentRef.current.innerHTML = body;
        }
    }, [isOpen, body]);
    
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const currentBody = contentRef.current?.innerHTML || '';
        const sanitizedBody = DOMPurify.sanitize(currentBody);
        
        if (template) {
            updateTemplate(template.id, { name, body: sanitizedBody });
        } else {
            createTemplate(name, sanitizedBody);
        }
        onClose();
    };
    
    const insertImageFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl && contentRef.current) {
                contentRef.current.focus();
                document.execCommand('insertHTML', false, `<img src="${dataUrl}" style="max-width: 100%; height: auto; border-radius: 4px;" alt="${file.name}"/>`);
            }
        };
        reader.readAsDataURL(file);
    };
    
    const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            insertImageFile(e.target.files[0]);
        }
        e.target.value = '';
    };

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark-surface-container rounded-lg shadow-xl p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-4">{template ? "Edit Template" : "Create Template"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template name</label>
                        <input
                            id="template-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-dark-surface text-on-surface dark:text-dark-on-surface dark:border-dark-outline"
                            required
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                         <div className="w-full border border-outline dark:border-dark-outline rounded-md bg-white dark:bg-dark-surface overflow-hidden">
                            <div className="p-1 border-b border-outline dark:border-dark-outline">
                                <RichTextToolbar onInsertImage={() => imageInputRef.current?.click()} />
                            </div>
                            <div
                                ref={contentRef}
                                contentEditable
                                className="w-full min-h-[200px] p-2 text-sm resize-y focus:outline-none compose-editor"
                            />
                         </div>
                         <input type="file" ref={imageInputRef} onChange={handleImageFileSelect} className="hidden" accept="image/*" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-outline dark:border-dark-outline">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
    
    const portalNode = document.getElementById('modal-portal');
    return portalNode ? ReactDOM.createPortal(modalContent, portalNode) : modalContent;
};

export default TemplateModal;
