
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon } from './icons/XMarkIcon';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

const Shortcut: React.FC<{ keys: string[]; description: string }> = ({ keys, description }) => (
    <div className="flex items-center justify-between py-2">
        <p className="text-gray-700 dark:text-gray-300">{description}</p>
        <div className="flex items-center gap-1">
            {keys.map(key => (
                <kbd key={key} className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">{key}</kbd>
            ))}
        </div>
    </div>
);

const ShortcutSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-on-surface dark:text-dark-on-surface mb-2 pt-4">{title}</h3>
        <div className="divide-y divide-outline dark:divide-dark-outline">
            {children}
        </div>
    </div>
);


const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
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

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark-surface-container rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-outline dark:border-dark-outline flex-shrink-0">
                    <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Close">
                        <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </header>
                <div className="p-6 overflow-y-auto">
                    <ShortcutSection title="Global">
                        <Shortcut keys={['c']} description="Compose new mail" />
                        <Shortcut keys={['/']} description="Focus search bar" />
                        <Shortcut keys={['?']} description="Open this shortcuts guide" />
                    </ShortcutSection>

                    <ShortcutSection title="Navigation">
                        <Shortcut keys={['g', 'i']} description="Go to Inbox" />
                        <Shortcut keys={['g', 's']} description="Go to Sent" />
                    </ShortcutSection>
                    
                    <ShortcutSection title="List View">
                        <Shortcut keys={['j', '↓']} description="Focus next conversation" />
                        <Shortcut keys={['k', '↑']} description="Focus previous conversation" />
                        <Shortcut keys={['Enter']} description="Open focused conversation" />
                        <Shortcut keys={['x']} description="Toggle selection on focused conversation" />
                    </ShortcutSection>

                    <ShortcutSection title="Actions (on focused or selected)">
                        <Shortcut keys={['e']} description="Archive conversation" />
                        <Shortcut keys={['#']} description="Delete conversation" />
                        <Shortcut keys={['_']} description="Mark as unread" />
                        <Shortcut keys={['l']} description="Open label menu" />
                    </ShortcutSection>
                    
                     <ShortcutSection title="Compose View">
                        <Shortcut keys={['Cmd', 'Enter']} description="Send message" />
                    </ShortcutSection>
                </div>
            </div>
        </div>
    );
    
    const portalNode = document.getElementById('modal-portal');
    return portalNode ? ReactDOM.createPortal(modalContent, portalNode) : modalContent;
};

export default KeyboardShortcutsModal;
