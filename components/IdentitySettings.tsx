
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Identity } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';

const IdentitySettings: React.FC = () => {
    const { appSettings, updateIdentity, user } = useAppContext();
    const primaryIdentity = appSettings.identities.find(id => id.email === user?.email);

    const [displayName, setDisplayName] = useState(primaryIdentity?.name || '');
    const [accountType, setAccountType] = useState<Identity['accountType']>(primaryIdentity?.accountType || 'personal');

    useEffect(() => {
        if (primaryIdentity) {
            setDisplayName(primaryIdentity.name);
            setAccountType(primaryIdentity.accountType);
        }
    }, [primaryIdentity]);

    const handleSave = () => {
        if (primaryIdentity && displayName.trim()) {
            updateIdentity({
                ...primaryIdentity,
                name: displayName.trim(),
                accountType,
            });
        }
    };
    
    if (!primaryIdentity) {
        return (
            <div>
                <h2 className="text-xl font-semibold mb-4 text-on-surface dark:text-dark-on-surface">Identities</h2>
                <p className="text-gray-500 dark:text-gray-400">No identity found for this account. This might indicate a setup issue.</p>
            </div>
        );
    }
    
    const AccountTypeOption: React.FC<{type: Identity['accountType'], label: string, icon: React.ReactNode}> = ({type, label, icon}) => (
        <button
            type="button"
            onClick={() => setAccountType(type)}
            className={`flex items-center gap-3 p-3 border rounded-lg w-full transition-colors ${accountType === type ? 'border-primary bg-primary/10' : 'border-outline dark:border-dark-outline hover:bg-gray-50 dark:hover:bg-gray-800'}`}
        >
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${accountType === type ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {icon}
            </div>
            <p className="font-medium text-on-surface dark:text-dark-on-surface">{label}</p>
        </button>
    );

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-on-surface dark:text-dark-on-surface">Identities</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage how you appear to others when you send an email.</p>
            
            <div className="space-y-6 max-w-xl">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-400">{primaryIdentity.email}</p>
                 </div>
                 
                <div>
                    <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                    <input
                        id="display-name"
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-dark-surface text-on-surface dark:text-dark-on-surface dark:border-dark-outline"
                        placeholder="e.g., Jane Doe"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AccountTypeOption type="personal" label="Personal" icon={<UserIcon className="w-5 h-5"/>} />
                        <AccountTypeOption type="business" label="Business / Shared" icon={<BuildingOfficeIcon className="w-5 h-5"/>} />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button onClick={handleSave} className="px-6 py-2 text-sm font-bold text-white bg-primary rounded-md hover:bg-primary-hover" disabled={!displayName.trim()}>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IdentitySettings;
