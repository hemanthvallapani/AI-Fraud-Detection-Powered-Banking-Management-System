'use client';

import { useEffect, useState } from 'react';

export default function StatusIndicator() {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [mode, setMode] = useState<'production' | 'demo'>('production');
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    const checkStatus = async () => {
      setStatus('checking');
      
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        setStatus(data.status);
        setMode(data.mode);
      } catch (error) {
        setStatus('offline');
        setMode('demo');
      }
      
      setLastCheck(new Date().toLocaleTimeString());
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm border border-yellow-300">
        🔍 Checking connection...
      </div>
    );
  }

  return (
    <div className={`fixed top-4 right-4 px-3 py-1 rounded-full text-sm border ${
      status === 'online' 
        ? 'bg-green-100 text-green-800 border-green-300' 
        : 'bg-red-100 text-red-800 border-red-300'
    }`}>
      {status === 'online' ? '🟢 Online' : '🔴 Offline (Demo Mode)'}
      <div className="text-xs mt-1">Last check: {lastCheck}</div>
    </div>
  );
}