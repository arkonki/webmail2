
import React, { useCallback, useEffect } from 'react';
import Login from './components/Login';
import MainLayout from './components/MainLayout';
import { AppContextProvider, useAppContext } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import FirstTimeSetupModal from './components/FirstTimeSetupModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';

const AppContent: React.FC = () => {
    const { user, isLoading, checkUserSession, theme, isSetupComplete, isShortcutsModalOpen, setIsShortcutsModalOpen } = useAppContext();

    useEffect(() => {
        checkUserSession();
    }, [checkUserSession]);
    
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        root.style.colorScheme = theme;
    }, [theme]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-surface dark:bg-dark-surface">
                <SpinnerIcon className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }
    
    if (!user) {
        return <Login />;
    }
    
    if (!isSetupComplete) {
        return <FirstTimeSetupModal />;
    }

    return (
        <>
            <MainLayout />
            {isShortcutsModalOpen && <KeyboardShortcutsModal onClose={() => setIsShortcutsModalOpen(false)} />}
        </>
    );
};


const App: React.FC = () => {
    return (
        <ToastProvider>
            <AppContextProvider>
                <div className="h-screen w-screen font-sans overflow-x-hidden">
                    <AppContent />
                </div>
            </AppContextProvider>
        </ToastProvider>
    );
};

export default App;