
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { DisplayDensity } from '../types';

type SendDelayDuration = 5 | 10 | 20 | 30;

const GeneralSettings: React.FC = () => {
    const { appSettings, updateSendDelay, notificationPermission, requestNotificationPermission, updateNotificationSettings, updateConversationView, updateBlockExternalImages, updateDisplayDensity } = useAppContext();
    const [isEnabled, setIsEnabled] = useState(appSettings.sendDelay.isEnabled);
    const [duration, setDuration] = useState<SendDelayDuration>(appSettings.sendDelay.duration);

    const handleSave = () => {
        updateSendDelay({ isEnabled, duration });
    };

    const renderNotificationSettings = () => {
        switch (notificationPermission) {
            case 'granted':
                return (
                    <div className="flex items-center justify-between">
                        <label htmlFor="enable-notifications" className="font-medium text-gray-700 dark:text-gray-300">Enable Notifications</label>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input
                                type="checkbox"
                                name="enable-notifications"
                                id="enable-notifications"
                                checked={appSettings.notifications.enabled}
                                onChange={(e) => updateNotificationSettings(e.target.checked)}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white dark:bg-gray-400 border-4 appearance-none cursor-pointer"
                            />
                            <label htmlFor="enable-notifications" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
                        </div>
                    </div>
                );
            case 'denied':
                return (
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/50 p-3 rounded-md">
                        Notifications are blocked by your browser. You'll need to update your site settings for this page to allow them.
                    </p>
                );
            default:
                return (
                    <button onClick={requestNotificationPermission} className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-md hover:bg-primary-hover">
                        Enable Desktop Notifications
                    </button>
                );
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-on-surface dark:text-dark-on-surface">General Settings</h2>
            <div className="space-y-6">
                 <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Undo Send</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">When enabled, you'll have a short period of time to cancel sending an email.</p>
                     <div className="flex items-center justify-between">
                        <label htmlFor="enable-send-delay" className="font-medium text-gray-700 dark:text-gray-300">Enable Send Delay</label>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input
                                type="checkbox"
                                name="enable-send-delay"
                                id="enable-send-delay"
                                checked={isEnabled}
                                onChange={(e) => setIsEnabled(e.target.checked)}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white dark:bg-gray-400 border-4 appearance-none cursor-pointer"
                            />
                            <label htmlFor="enable-send-delay" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
                        </div>
                    </div>
                 </div>

                <div className={`transition-opacity duration-300 ${isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cancellation period</label>
                    <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value) as SendDelayDuration)}
                        className="w-full md:w-1/2 p-2 border rounded-md bg-gray-50 dark:bg-dark-surface text-on-surface dark:text-dark-on-surface dark:border-dark-outline"
                        disabled={!isEnabled}
                    >
                        <option value={5}>5 seconds</option>
                        <option value={10}>10 seconds</option>
                        <option value={20}>20 seconds</option>
                        <option value={30}>30 seconds</option>
                    </select>
                </div>
                 <div className="border-t border-outline dark:border-dark-outline pt-6">
                     <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Conversation View</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Group emails with the same subject into a single conversation.</p>
                         <div className="flex items-center justify-between">
                            <label htmlFor="enable-conversation-view" className="font-medium text-gray-700 dark:text-gray-300">Enable Conversation View</label>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input
                                    type="checkbox"
                                    name="enable-conversation-view"
                                    id="enable-conversation-view"
                                    checked={appSettings.conversationView}
                                    onChange={(e) => updateConversationView(e.target.checked)}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white dark:bg-gray-400 border-4 appearance-none cursor-pointer"
                                />
                                <label htmlFor="enable-conversation-view" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
                            </div>
                        </div>
                     </div>
                </div>

                <div className="border-t border-outline dark:border-dark-outline pt-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Display Density</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose how compact the email list is.</p>
                        <div className="flex items-center space-x-4">
                            {(['comfortable', 'cozy', 'compact'] as DisplayDensity[]).map(density => (
                                <label key={density} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="display-density"
                                        value={density}
                                        checked={appSettings.displayDensity === density}
                                        onChange={() => updateDisplayDensity(density)}
                                        className="form-radio h-4 w-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary dark:focus:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{density}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-outline dark:border-dark-outline pt-6">
                     <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Privacy</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Block external images in emails to prevent senders from tracking you.</p>
                        <div className="flex items-center justify-between">
                            <label htmlFor="enable-block-images" className="font-medium text-gray-700 dark:text-gray-300">Block all external images</label>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input
                                    type="checkbox"
                                    name="enable-block-images"
                                    id="enable-block-images"
                                    checked={appSettings.blockExternalImages}
                                    onChange={(e) => updateBlockExternalImages(e.target.checked)}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white dark:bg-gray-400 border-4 appearance-none cursor-pointer"
                                />
                                <label htmlFor="enable-block-images" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-outline dark:border-dark-outline pt-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Desktop Notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Get notified of new emails when the app is in the background.</p>
                        {renderNotificationSettings()}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button onClick={handleSave} className="px-6 py-2 text-sm font-bold text-white bg-primary rounded-md hover:bg-primary-hover">
                        Save Changes
                    </button>
                </div>
            </div>
             <style>{`
                .toggle-checkbox:checked { right: 0; border-color: #0B57D0; background-color: #0B57D0; }
                .toggle-checkbox:checked + .toggle-label { background-color: #0B57D0; }
            `}</style>
        </div>
    );
};
export default GeneralSettings;