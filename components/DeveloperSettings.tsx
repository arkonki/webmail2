
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { AppLog } from '../types';

const DeveloperSettings: React.FC = () => {
    const { user, appLogs, addAppLog } = useAppContext();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleTestConnection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !password) {
            setTestResult({ success: false, message: "Email and password are required." });
            return;
        }
        setIsLoading(true);
        setTestResult(null);
        addAppLog(`[DEV] Testing IMAP connection for ${user.email}...`);
        try {
            const response = await fetch('/api/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, password }),
            });
            const data = await response.json();
            setTestResult(data);
            if(data.success) {
                addAppLog(`[DEV] IMAP connection test successful: ${data.message}`);
            } else {
                addAppLog(`[DEV] IMAP connection test failed: ${data.message}`, 'error');
            }
        } catch (error: any) {
            setTestResult({ success: false, message: `Request failed: ${error.message}` });
            addAppLog(`[DEV] IMAP connection test request failed: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
            setPassword('');
        }
    };

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
                {/* IMAP Connection Tester */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">IMAP Connection Tester</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Safely test your connection to the IMAP server without performing a full sync. Your password is not stored.
                    </p>
                    <form onSubmit={handleTestConnection} className="space-y-4">
                        <div>
                            <label htmlFor="test-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                            <input
                                id="test-email"
                                type="email"
                                value={user?.email || ''}
                                readOnly
                                className="w-full p-2 border rounded-md bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 dark:border-dark-outline"
                            />
                        </div>
                        <div>
                            <label htmlFor="test-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <input
                                id="test-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border rounded-md bg-white dark:bg-dark-surface text-on-surface dark:text-dark-on-surface dark:border-dark-outline"
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-md hover:bg-primary-hover disabled:bg-gray-400"
                            >
                                {isLoading ? 'Testing...' : 'Test Connection'}
                            </button>
                            {testResult && (
                                <p className={`text-sm font-semibold ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {testResult.message}
                                </p>
                            )}
                        </div>
                    </form>
                </div>

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
