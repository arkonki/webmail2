import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Attachment } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { FileIcon } from './icons/FileIcon';
import { PdfFileIcon } from './icons/PdfFileIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AttachmentPreviewModal: React.FC<{ attachment: Attachment; onClose: () => void; }> = ({ attachment, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [textContent, setTextContent] = useState<string | null>(null);
    const [isLoadingText, setIsLoadingText] = useState(false);

    useEffect(() => {
        const rootEl = document.getElementById('root');
        rootEl?.setAttribute('inert', '');

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            rootEl?.removeAttribute('inert');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    useEffect(() => {
        if (attachment.mimeType.startsWith('text/') && attachment.url) {
            setIsLoadingText(true);
            fetch(attachment.url)
                .then(res => res.text())
                .then(text => {
                    setTextContent(text);
                    setIsLoadingText(false);
                })
                .catch(err => {
                    console.error("Failed to fetch text content:", err);
                    setTextContent("Could not load content.");
                    setIsLoadingText(false);
                });
        }
    }, [attachment]);
    

    const renderPreview = () => {
        const { mimeType, url, fileName } = attachment;

        if (mimeType.startsWith('image/') && url) {
            return (
                <div className="flex justify-center items-center h-full bg-gray-100 dark:bg-gray-900/50 p-4">
                    <img src={url} alt={fileName} className="max-w-full max-h-full object-contain" />
                </div>
            );
        }

        if (mimeType.startsWith('text/')) {
            if (isLoadingText) return <div className="flex items-center justify-center h-full"><SpinnerIcon className="w-12 h-12 text-primary animate-spin" /></div>;
            return (
                <pre className="p-4 text-sm whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-800 rounded-b-lg overflow-auto">
                    {textContent}
                </pre>
            );
        }
        
        if (mimeType === 'application/pdf') {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-gray-800">
                    <PdfFileIcon className="w-24 h-24 text-red-500" />
                    <p className="mt-4 font-semibold text-lg">{fileName}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Live preview for PDF files is not available in this mock environment.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-gray-800">
                <FileIcon className="w-24 h-24 text-gray-400" />
                <p className="mt-4 font-semibold text-lg">{fileName}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Preview not available for this file type.</p>
            </div>
        );
    };

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                ref={modalRef}
                className="bg-white dark:bg-dark-surface-container rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-3 border-b border-outline dark:border-dark-outline flex-shrink-0">
                    <div className="truncate">
                        <p className="font-semibold truncate text-on-surface dark:text-dark-on-surface" title={attachment.fileName}>{attachment.fileName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(attachment.fileSize)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-outline dark:border-dark-outline" title="Download">
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            <span>Download</span>
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Close">
                            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </header>
                <div className="flex-grow overflow-auto">
                    {renderPreview()}
                </div>
            </div>
        </div>
    );

    const portalNode = document.getElementById('modal-portal');
    return portalNode ? ReactDOM.createPortal(modalContent, portalNode) : modalContent;
};

export default AttachmentPreviewModal;
