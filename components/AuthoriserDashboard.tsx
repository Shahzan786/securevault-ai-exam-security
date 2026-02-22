
import React, { useState, useEffect } from 'react';
import { User, AuditLog, UnlockRequest, UserRole } from '../types';
import { store } from '../store';
import ForensicLab from './ForensicLab';
import SecurityDashboard from './SecurityDashboard';

const AuthoriserDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'WHITELIST' | 'REQUESTS' | 'FORENSICS' | 'LOGS'>('WHITELIST');
  const [whitelistEmail, setWhitelistEmail] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [requests, setRequests] = useState<UnlockRequest[]>([]);

  useEffect(() => {
    setLogs(store.getLogs());
    setRequests(store.getRequests());
    const interval = setInterval(() => {
        setLogs(store.getLogs());
        setRequests(store.getRequests());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleWhitelist = () => {
    if (!whitelistEmail.includes('@')) return;
    store.addToWhitelist(whitelistEmail);
    setWhitelistEmail('');
    store.addLog({
      timestamp: Date.now(),
      type: 'SECURITY_ALERT',
      userId: user.id,
      details: `New identity whitelisted: ${whitelistEmail}`,
      severity: 'LOW'
    });
    alert(`${whitelistEmail} has been whitelisted.`);
  };

  const handleApproveRequest = (reqId: string) => {
    const allRequests = store.getRequests();
    const dynamicKey = Math.random().toString(36).substr(2, 6).toUpperCase();
    const updated = allRequests.map(r => r.id === reqId ? { ...r, status: 'APPROVED' as const, dynamicKey } : r);
    store.setRequests(updated);
    setRequests(updated);

    store.addLog({
      timestamp: Date.now(),
      type: 'UNLOCK',
      userId: user.id,
      details: `Unlock request approved. Dynamic key generated.`,
      severity: 'MEDIUM'
    });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 space-y-2">
        <button 
          onClick={() => setActiveTab('WHITELIST')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${activeTab === 'WHITELIST' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <i className="fa-solid fa-user-plus w-5"></i>
          Identity Whitelist
        </button>
        <button 
          onClick={() => setActiveTab('REQUESTS')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${activeTab === 'REQUESTS' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <i className="fa-solid fa-key w-5"></i>
          Access Requests
          {requests.filter(r => r.status === 'PENDING').length > 0 && (
            <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {requests.filter(r => r.status === 'PENDING').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('LOGS')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${activeTab === 'LOGS' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <i className="fa-solid fa-shield-halved w-5"></i>
          Risk Monitoring
        </button>
        <button 
          onClick={() => setActiveTab('FORENSICS')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${activeTab === 'FORENSICS' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <i className="fa-solid fa-magnifying-glass-chart w-5"></i>
          Forensic Lab
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-950">
        {activeTab === 'WHITELIST' && (
          <div className="max-w-4xl space-y-8">
            <header>
              <h2 className="text-3xl font-bold text-white mb-2">Identity Whitelist</h2>
              <p className="text-slate-400">Manage personnel allowed to interact with examination papers.</p>
            </header>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Add New Authorized Personnel</label>
              <div className="flex gap-4">
                <input 
                  type="email"
                  value={whitelistEmail}
                  onChange={(e) => setWhitelistEmail(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="setter-identity@gmail.com"
                />
                <button 
                  onClick={handleWhitelist}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 rounded-lg transition-all"
                >
                  AUTHORIZE
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Identity (Email)</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Permissions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {store.getWhitelist().map(email => (
                            <tr key={email} className="text-sm">
                                <td className="px-6 py-4 text-slate-200 font-medium">{email}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-[10px] font-bold uppercase tracking-wide">Authorized</span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">EXAM_SETTER_LEVEL_1</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {activeTab === 'REQUESTS' && (
          <div className="max-w-4xl space-y-8">
            <header>
              <h2 className="text-3xl font-bold text-white mb-2">Unlock Requests</h2>
              <p className="text-slate-400">Zero-Trust dynamic authorization for restricted paper editing.</p>
            </header>

            <div className="grid gap-4">
              {requests.length === 0 ? (
                <div className="py-20 flex flex-col items-center opacity-40">
                    <i className="fa-solid fa-inbox text-5xl mb-4"></i>
                    <p>No pending authorization requests.</p>
                </div>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-mono text-cyan-400">REQ-{req.id.substr(0, 6)}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-500'}`}>{req.status}</span>
                      </div>
                      <p className="text-white font-medium">Setter <span className="text-slate-400">{req.setterId}</span> requested access to paper.</p>
                    </div>
                    
                    {req.status === 'PENDING' ? (
                      <button 
                        onClick={() => handleApproveRequest(req.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 rounded-lg transition-all text-sm"
                      >
                        APPROVE & GEN KEY
                      </button>
                    ) : (
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Generated Key</p>
                        <p className="text-lg font-mono text-cyan-400 font-bold tracking-widest">{req.dynamicKey}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'LOGS' && <SecurityDashboard logs={logs} />}
        {activeTab === 'FORENSICS' && <ForensicLab />}
      </div>
    </div>
  );
};

export default AuthoriserDashboard;
