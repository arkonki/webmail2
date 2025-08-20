
import React, { useState } from 'react';
import { MailIcon } from './icons/MailIcon';
import { useAppContext } from '../context/AppContext';
import { SpinnerIcon } from './icons/SpinnerIcon';

const Login: React.FC = () => {
  const { login } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({
        email,
        password,
        imap: {
            host: 'mail.veebimajutus.ee',
            port: 993,
            secure: true
        },
        smtp: {
            host: 'mail.veebimajutus.ee',
            port: 465,
            secure: true
        }
      });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-dark-surface-container rounded-lg shadow-md">
        <div className="text-center">
            <MailIcon className="w-12 h-12 mx-auto text-primary"/>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Webmail Client
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Connect to your IMAP/SMTP account.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-md appearance-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-md appearance-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="App Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
               <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Use an <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">app-specific password</a> for security.</p>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md group bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              {isLoading ? <><SpinnerIcon className="w-5 h-5 mr-2 animate-spin"/> Connecting...</> : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
