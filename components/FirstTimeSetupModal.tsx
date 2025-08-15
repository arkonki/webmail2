
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Identity } from '../types';
import { UserIcon } from './icons/UserIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { MailIcon } from './icons/MailIcon';

const FirstTimeSetupModal: React.FC = () => {
    const { completeFirstTimeSetup } = useAppContext();
    const [displayName, setDisplayName] = useState('');
    const [accountType, setAccountType] = useState<Identity['accountType']>('personal');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (displayName.trim()) {
            completeFirstTimeSetup(displayName.trim(), accountType);
        }
    };
    
    const AccountTypeOption: React.FC<{type: Identity['accountType'], label: string, description: string, icon: React.ReactNode}> = ({type, label, description, icon}) => (
        <button
            type="button"
            onClick={() => setAccountType(type)}
            className={`flex items-start text-left gap-4 p-4 border-2 rounded-lg w-full transition-all duration-200 ${accountType === type ? 'border-primary bg-primary/5 shadow-md' : 'border-outline dark:border-dark-outline hover:border-gray-400 dark:hover:border-gray-500'}`}
        >
            <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${accountType === type ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {icon}
            </div>
            <div>
                <p className="font-semibold text-on-surface dark:text-dark-on-surface">{label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-surface dark:bg-dark-surface z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-surface-container rounded-xl shadow-2xl p-8 w-full max-w-2xl animate-fade-in space-y-8">
                <div className="text-center">
                    <MailIcon className="w-12 h-12 mx-auto text-primary mb-4"/>
                    <h1 className="text-2xl sm:text-3xl font-bold text-on-surface dark:text-dark-on-surface">Welcome to Webmail!</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Let's get your account set up in just a moment.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="display-name" className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">What should we call you?</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">This is the name that will appear on emails you send.</p>
                        <input
                            id="display-name"
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className="w-full p-3 border rounded-md bg-gray-50 dark:bg-dark-surface text-on-surface dark:text-dark-on-surface dark:border-dark-outline focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="e.g., Jane Doe"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">What kind of account is this?</label>
                        <div className="space-y-3">
                            <AccountTypeOption type="personal" label="Personal" description="For an individual person." icon={<UserIcon className="w-6 h-6"/>} />
                            <AccountTypeOption type="business" label="Business / Shared" description="For a team, company, or role (e.g., info@, support@)." icon={<UserGroupIcon className="w-6 h-6"/>} />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-8 py-3 text-base font-bold text-white bg-primary rounded-full hover:bg-primary-hover transition-transform transform hover:scale-105" disabled={!displayName.trim()}>
                            Get Started
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FirstTimeSetupModal;
