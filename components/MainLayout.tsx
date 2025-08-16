import React, { useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import EmailList from './EmailList';
import EmailView from './EmailView';
import ComposeModal from './ComposeModal';
import Settings from './Settings';
import ContactsView from './ContactsView';
import { useAppContext } from '../context/AppContext';

const MainLayout: React.FC = () => {
  const { composeState, view, selectedConversationId, handleKeyboardShortcut, isSidebarCollapsed, isDraggingEmail } = useAppContext();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        handleKeyboardShortcut(e);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyboardShortcut]);

  const renderMailView = () => {
    if (selectedConversationId) {
        return <EmailView />;
    }
    return <EmailList />;
  };

  const renderView = () => {
    switch (view) {
      case 'settings':
        return <Settings />;
      case 'contacts':
        return <ContactsView />;
      case 'mail':
      default:
        return renderMailView();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-surface dark:bg-dark-surface text-on-surface dark:text-dark-on-surface">
      <Header />
      <div className="flex flex-grow overflow-hidden">
        <Sidebar />
        <main className={`flex-grow transition-all duration-300 ease-in-out flex flex-col ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} ${isDraggingEmail ? 'opacity-50' : ''}`}>
          {renderView()}
        </main>
      </div>
      {composeState.isOpen && <ComposeModal />}
    </div>
  );
};

export default MainLayout;
