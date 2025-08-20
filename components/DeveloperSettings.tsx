
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { AppLog } from '../types';

const DeveloperSettings: React.FC = () => {
    const { appLogs } = useAppContext();

    const LogEntry: React.FC<{ log: AppLog }> = ({ log }) => (
        <div className={`p-2 border-l-4 ${log.level === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'}`}>
            <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                {new Date(log.timestamp).toLocaleTimeString()}
            </p>
            <p className={`text-sm ${log.level === 'error' ? 'text-red-800 dark:text-red-200' : 'text-gray-800 dark:text-gray-200'}`}>
                {log.message}
            </p>
        </div>
    );

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-on-surface dark:text-dark-on-surface">Developer Tools</h2>
            <div className="space-y-8">
                {/* Application Event Log */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Application Event Log</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        A log of recent actions and events within the application. Most recent events are at the top.
                    </p>
                    <div className="bg-white dark:bg-dark-surface border border-outline dark:border-dark-outline rounded-md h-80 overflow-y-auto">
                        {appLogs.length > 0 ? (
                            <div className="space-y-2 p-2">
                                {appLogs.map((log, index) => <LogEntry key={index} log={log} />)}
                            </div>
                        ) : (
                            <p className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">Log is empty. Perform an action to see logs here.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeveloperSettings;
