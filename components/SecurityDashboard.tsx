
import React from 'react';
import { AuditLog } from '../types';
import { store } from '../store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const SecurityDashboard: React.FC<{ logs: AuditLog[] }> = ({ logs }) => {
  const criticalCount = logs.filter(l => l.severity === 'CRITICAL').length;
  const highCount = logs.filter(l => l.severity === 'HIGH').length;

  const data = logs.slice(0, 20).reverse().map(l => ({
    time: new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    severity: l.severity === 'CRITICAL' ? 100 : l.severity === 'HIGH' ? 70 : l.severity === 'MEDIUM' ? 40 : 10
  }));

  return (
    <div className="max-w-6xl space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Security Analytics</h2>
          <p className="text-slate-400">Real-time threat detection and forensic activity tracking.</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Threat Score</p>
                <p className={`text-2xl font-bold ${criticalCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{criticalCount > 0 ? 'CRITICAL' : 'STABLE'}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Violations</p>
                <p className="text-2xl font-bold text-white">{criticalCount + highCount}</p>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Activity Intensity (Last 20 Events)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorSev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="#475569" fontSize={10} />
                        <YAxis stroke="#475569" fontSize={10} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                            itemStyle={{ color: '#06b6d4' }}
                        />
                        <Area type="monotone" dataKey="severity" stroke="#06b6d4" fillOpacity={1} fill="url(#colorSev)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Active Security Logs</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {logs.map(log => (
                    <div key={log.id} className="border-l-2 border-slate-800 pl-4 py-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${log.severity === 'CRITICAL' ? 'bg-red-500 text-white' : log.severity === 'HIGH' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                                {log.severity}
                            </span>
                            <span className="text-[10px] text-slate-600 mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{log.details}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Audit Trail Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
                { label: 'Unlocks', val: logs.filter(l => l.type === 'UNLOCK').length, color: 'cyan' },
                { label: 'Security Alerts', val: logs.filter(l => l.type === 'SECURITY_ALERT').length, color: 'red' },
                { label: 'Identities', val: store.getWhitelist().length, color: 'emerald' },
                { label: 'Forensic Runs', val: logs.filter(l => l.type === 'FORENSICS').length, color: 'indigo' },
            ].map(stat => (
                <div key={stat.label} className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-3xl font-bold text-${stat.color}-400`}>{stat.val}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
