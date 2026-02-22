
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, AuditLog } from './types';
import { store } from './store';
import Login from './components/Login';
import AuthoriserDashboard from './components/AuthoriserDashboard';
import SetterDashboard from './components/SetterDashboard';
import SecurityMonitor from './components/SecurityMonitor';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [securityViolation, setSecurityViolation] = useState<string | null>(null);
  const [isTabActive, setIsTabActive] = useState(true);

  useEffect(() => {
    store.init();
    const savedUser = localStorage.getItem('sentry_active_session');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    const handleBlur = () => setIsTabActive(false);
    const handleFocus = () => setIsTabActive(true);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sentry_active_session', JSON.stringify(user));
    store.addLog({
      timestamp: Date.now(),
      type: 'LOGIN',
      userId: user.id,
      details: `User ${user.email} logged in successfully via biometric verification.`,
      severity: 'LOW'
    });
  };

  const handleLogout = () => {
    if (currentUser) {
      store.addLog({
        timestamp: Date.now(),
        type: 'LOGIN',
        userId: currentUser.id,
        details: `User ${currentUser.email} logged out.`,
        severity: 'LOW'
      });
    }
    setCurrentUser(null);
    localStorage.removeItem('sentry_active_session');
    setIsMonitoringActive(false);
    setSecurityViolation(null);
  };

  const handleSecurityAlert = useCallback((type: string, details: string) => {
    if (!currentUser) return;
    
    setSecurityViolation(details);
    setIsMonitoringActive(false);

    store.addLog({
      timestamp: Date.now(),
      type: 'SECURITY_ALERT',
      userId: currentUser.id,
      details: `VIOLATION DETECTED: ${type} - ${details}`,
      severity: 'CRITICAL'
    });

    // Forced lockout simulation
    setTimeout(() => {
        handleLogout();
    }, 100);
  }, [currentUser]);

  if (securityViolation) {
    return (
      <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-8 text-center no-select">
        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mb-6 animate-pulse border-4 border-red-400">
            <i className="fa-solid fa-triangle-exclamation text-4xl text-white"></i>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 uppercase tracking-[0.3em]">Security Breach</h1>
        <p className="text-xl text-red-200 max-w-lg mb-8 font-mono">{securityViolation}</p>
        <button 
            onClick={() => window.location.reload()}
            className="bg-white text-red-900 px-10 py-4 rounded-lg font-black hover:bg-red-100 transition uppercase tracking-widest shadow-2xl"
        >
            RE-AUTHENTICATE
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen cyber-gradient relative transition-all duration-500 ${!isTabActive && isMonitoringActive ? 'blur-3xl grayscale' : ''}`}>
      <div className="scanline"></div>
      
      {!currentUser ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Top Navigation Bar */}
          <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-xl z-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <i className="fa-solid fa-shield-halved text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-bold tracking-tighter text-white">SENTRY <span className="text-cyan-500 font-mono text-xs ml-2 opacity-70">Z-TRUST ENGINE</span></h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-cyan-500 uppercase font-black tracking-widest leading-none mb-1">{currentUser.role}</span>
                <span className="text-sm font-medium text-slate-300 font-mono">{currentUser.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl border border-slate-800 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/50 group transition-all"
                title="Secure Sign Out"
              >
                <i className="fa-solid fa-power-off text-slate-500 group-hover:text-red-500"></i>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-hidden relative">
            {currentUser.role === UserRole.AUTHORISER ? (
              <AuthoriserDashboard user={currentUser} />
            ) : (
              <SetterDashboard 
                user={currentUser} 
                onMonitoringChange={setIsMonitoringActive} 
              />
            )}
          </main>

          {isMonitoringActive && currentUser && (
            <SecurityMonitor 
              currentUser={currentUser} 
              onAlert={handleSecurityAlert} 
            />
          )}

          {!isTabActive && isMonitoringActive && (
            <div className="fixed inset-0 z-[999] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center">
                <div className="text-center">
                    <i className="fa-solid fa-eye-slash text-6xl text-cyan-500 mb-6 animate-pulse"></i>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Environment Suspended</h2>
                    <p className="text-slate-400 mt-2">Content hidden for security while window is out of focus.</p>
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
