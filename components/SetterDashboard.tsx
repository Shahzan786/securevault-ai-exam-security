
import React, { useState, useEffect } from 'react';
import { User, ExamPaper, UnlockRequest } from '../types';
import { store } from '../store';
import PaperEditor from './PaperEditor';

interface SetterDashboardProps {
  user: User;
  onMonitoringChange: (active: boolean) => void;
}

const SetterDashboard: React.FC<SetterDashboardProps> = ({ user, onMonitoringChange }) => {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [editingPaper, setEditingPaper] = useState<ExamPaper | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState<ExamPaper | null>(null);
  const [unlockKey, setUnlockKey] = useState('');

  useEffect(() => {
    setPapers(store.getPapers().filter(p => p.setterId === user.id));
  }, [user.id, editingPaper]);

  const handleCreatePaper = () => {
    const newPaper: ExamPaper = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Untilted Exam Paper',
      content: 'Start writing exam questions here...',
      setterId: user.id,
      createdAt: Date.now(),
      isLocked: false,
      watermarkId: `W-ST-${user.id.substr(0,4)}-${Date.now().toString().substr(-6)}`
    };
    const updated = [newPaper, ...store.getPapers()];
    store.setPapers(updated);
    setPapers(updated.filter(p => p.setterId === user.id));
    setEditingPaper(newPaper);
    onMonitoringChange(true);
  };

  const handleOpenPaper = (paper: ExamPaper) => {
    if (paper.isLocked) {
      setShowUnlockModal(paper);
      return;
    }
    setEditingPaper(paper);
    onMonitoringChange(true);
  };

  const handleRequestUnlock = (paper: ExamPaper) => {
    const requests = store.getRequests();
    const existing = requests.find(r => r.paperId === paper.id && r.status === 'PENDING');
    if (existing) {
        alert("Authorization request already pending with Authoriser.");
        return;
    }
    const newReq: UnlockRequest = {
        id: Math.random().toString(36).substr(2, 9),
        paperId: paper.id,
        setterId: user.id,
        status: 'PENDING'
    };
    store.setRequests([...requests, newReq]);
    alert("Unlock request sent to Authoriser dashboard.");
  };

  const handleVerifyUnlockKey = () => {
    if (!showUnlockModal) return;
    const requests = store.getRequests();
    const validRequest = requests.find(r => r.paperId === showUnlockModal.id && r.dynamicKey === unlockKey && r.status === 'APPROVED');
    
    if (validRequest) {
        setEditingPaper(showUnlockModal);
        setShowUnlockModal(null);
        setUnlockKey('');
        onMonitoringChange(true);
        // Delete key after use (One-time use)
        store.setRequests(requests.filter(r => r.id !== validRequest.id));
    } else {
        alert("Invalid or expired authorization key.");
    }
  };

  if (editingPaper) {
    return (
      <PaperEditor 
        paper={editingPaper} 
        onClose={() => {
            setEditingPaper(null);
            onMonitoringChange(false);
        }} 
        user={user}
      />
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Setter Command Center</h2>
          <p className="text-slate-400 uppercase text-xs font-bold tracking-[0.2em]">Encrypted Storage & Forensic Authoring</p>
        </div>
        <button 
          onClick={handleCreatePaper}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          NEW SECURE PAPER
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {papers.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center opacity-30">
            <i className="fa-solid fa-file-shield text-7xl mb-6"></i>
            <p className="text-xl font-medium">No examination papers found.</p>
            <p className="text-sm mt-2">Initialize a new secure document to begin.</p>
          </div>
        )}

        {papers.map(paper => (
          <div 
            key={paper.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group relative overflow-hidden"
          >
            {paper.isLocked && (
               <div className="absolute top-0 right-0 p-3 bg-red-500/10 text-red-500 rounded-bl-xl border-l border-b border-red-500/20">
                    <i className="fa-solid fa-lock"></i>
               </div>
            )}
            
            <div className="mb-6">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">ID: {paper.id.toUpperCase()}</span>
              <h3 className="text-xl font-bold text-slate-200 group-hover:text-cyan-400 transition-colors truncate">{paper.title}</h3>
            </div>

            <div className="flex items-center gap-2 mb-8">
                <div className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <i className="fa-solid fa-barcode mr-1"></i> {paper.watermarkId}
                </div>
            </div>

            <button 
              onClick={() => handleOpenPaper(paper)}
              className={`w-full font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${paper.isLocked ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500 hover:text-white'}`}
            >
              <i className={`fa-solid ${paper.isLocked ? 'fa-unlock' : 'fa-pen-to-square'}`}></i>
              {paper.isLocked ? 'REQUEST ACCESS' : 'OPEN EDITOR'}
            </button>
          </div>
        ))}
      </div>

      {showUnlockModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                    <i className="fa-solid fa-shield-halved text-2xl text-red-500"></i>
                </div>
                <h3 className="text-2xl font-bold text-center text-white mb-2">Restricted Access</h3>
                <p className="text-slate-400 text-center text-sm mb-8">This paper is currently locked. Enter the dynamic authorization key provided by the Authoriser.</p>

                <div className="space-y-4">
                    <input 
                        type="text"
                        value={unlockKey}
                        onChange={(e) => setUnlockKey(e.target.value.toUpperCase())}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-center text-2xl font-mono font-bold text-cyan-400 tracking-widest focus:outline-none focus:border-cyan-500"
                        placeholder="XXXXXX"
                        maxLength={6}
                    />
                    <div className="flex gap-3">
                        <button 
                            onClick={() => { setShowUnlockModal(null); setUnlockKey(''); }}
                            className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition"
                        >
                            CANCEL
                        </button>
                        <button 
                            onClick={handleVerifyUnlockKey}
                            className="flex-1 bg-cyan-600 text-white font-bold py-3 rounded-lg hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 transition"
                        >
                            VERIFY KEY
                        </button>
                    </div>
                    <button 
                        onClick={() => handleRequestUnlock(showUnlockModal)}
                        className="w-full text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-cyan-400 py-2"
                    >
                        Request New Key from Authoriser
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SetterDashboard;
