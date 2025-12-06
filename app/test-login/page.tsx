'use client';

import { useState } from 'react';
import * as api from '@/lib/api';

export default function TestLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Testing login with:', { email, password: '***' });

      const response = await api.login(email.toLowerCase().trim(), password);
      console.log('Login response:', response);

      setResult(response);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Login Test Page</h1>

        <div className="bg-card rounded-3xl p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-4 py-3 bg-background text-white rounded-2xl border border-border focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="w-full px-4 py-3 bg-background text-white rounded-2xl border border-border focus:outline-none focus:border-accent"
              />
            </div>

            <button
              onClick={handleTest}
              disabled={loading || !email || !password}
              className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 rounded-2xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Login'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-error/10 border border-error rounded-2xl p-6 mb-6">
            <h3 className="text-error font-bold mb-2">Error:</h3>
            <pre className="text-error text-sm font-mono whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        )}

        {result && (
          <div className="bg-success/10 border border-success rounded-2xl p-6">
            <h3 className="text-success font-bold mb-2">Success!</h3>
            <pre className="text-white text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <h3 className="text-blue-400 font-bold mb-2">Debug Info:</h3>
          <div className="text-blue-200 text-sm font-mono space-y-1">
            <div>API URL: {process.env.NEXT_PUBLIC_API_URL || 'https://subtext-backend-f8ci.vercel.app/api'}</div>
            <div>Email (trimmed): {email.toLowerCase().trim()}</div>
            <div>Password length: {password.length}</div>
            <div>Current Token: {api.getToken() ? 'EXISTS' : 'NULL'}</div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <a href="/login" className="text-accent hover:text-accent-light">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
