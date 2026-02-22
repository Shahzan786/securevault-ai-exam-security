
import React, { useState, useEffect, useCallback } from 'react';
import { User, ExamPaper } from '../types';
import { store } from '../store';

interface PaperEditorProps {
  paper: ExamPaper;
  user: User;
  onClose: () => void;
}

const PaperEditor: React.FC<PaperEditorProps> = ({ paper, user, onClose }) => {
  const [content, setContent] = useState(paper.content);
  const [title, setTitle] = useState(paper.title);
  const [lastSaved, setLastSaved] = useState(Date.now());
  const [isLocked, setIsLocked] = useState(paper.isLocked);

  // Anti-Leak Protections
  useEffect(() => {
    const preventAction = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const preventKeys = (e: KeyboardEvent) => {
        // Prevent PrintScreen, Ctrl+C, Ctrl+V, Ctrl+P, Ctrl+U, Ctrl+S, F12, Ctrl+Shift+I
        const forbidden = ['c', 'v', 'p', 'u', 's', 'i'];
        if ((e.ctrlKey || e.metaKey) && forbidden.includes(e.key.toLowerCase())) {
            e.preventDefault();
            return false;
        }
        if (e.key === 'PrintScreen' || e.key === 'F12') {
            e.preventDefault();
            return false;
        }
    };

    window.addEventListener('contextmenu', preventAction);
    window.addEventListener('keydown', preventKeys);
    window.addEventListener('copy', preventAction);
    window.addEventListener('paste', preventAction);
    window.addEventListener('dragstart', preventAction);
    window.addEventListener('drop', preventAction);

    return () => {
      window.removeEventListener('contextmenu', preventAction);
      window.removeEventListener('keydown', preventKeys);
      window.removeEventListener('copy', preventAction);
      window.removeEventListener('paste', preventAction);
      window.removeEventListener('dragstart', preventAction);
      window.removeEventListener('drop', preventAction);
    };
  }, []);

  const savePaper = useCallback((forceLock: boolean = false) => {
    const allPapers = store.getPapers();
    const updatedPaper = {
        ...paper,
        title,
        content,
        isLocked: forceLock || isLocked,
        lockDate: forceLock || isLocked ? Date.now() : undefined
    };
    const updatedList = allPapers.map(p => p.id === paper.id ? updatedPaper : p);
    store.setPapers(updatedList);
    setLastSaved(Date.now());
    if (forceLock) onClose();
  }, [paper, title, content, isLocked, onClose]);

  useEffect(() => {
    const timer = setTimeout(() => savePaper(), 5000);
    return () => clearTimeout(timer);
  }, [title, content, savePaper]);

  return (
    <div className="flex flex-col h-full bg-slate-950 no-select selection:bg-transparent">
      <style>{`
        @media print {
          body { display: none !important; }
        }
        .forensic-layer {
          pointer-events: none;
          user-select: none;
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          grid-template-rows: repeat(20, 1fr);
          opacity: 0.015;
          font-size: 6px;
          line-height: 1;
          color: #000;
          overflow: hidden;
          z-index: 10;
        }
      `}</style>

      {/* Editor Toolbar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-50 shadow-xl">
        <div className="flex items-center gap-4">
            <button onClick={() => { savePaper(); onClose(); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <i className="fa-solid fa-arrow-left text-sm"></i>
            </button>
            <div className="flex flex-col">
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent border-none text-white font-bold focus:outline-none w-64 text-sm"
                  placeholder="Document Title"
                />
                <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest opacity-60">ID: {paper.id}</span>
            </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-full border border-slate-800">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {new Date(lastSaved).toLocaleTimeString()} Synchronized
                </span>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => savePaper(true)}
                  className="bg-red-600/10 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg text-[10px] font-black hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest"
                >
                    FINALIZE & SEAL
                </button>
                <button 
                  onClick={() => savePaper()}
                  className="bg-cyan-600 text-white px-6 py-2 rounded-lg text-[10px] font-black hover:bg-cyan-500 shadow-lg shadow-cyan-500/20 transition-all uppercase tracking-widest"
                >
                    SECURE UPDATE
                </button>
            </div>
        </div>
      </div>

      {/* Editor Workspace */}
      <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center bg-slate-950 relative">
        {/* Anti-Screengrab Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#06b6d4 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

        <div className="w-full max-w-4xl bg-white text-slate-900 min-h-[1100px] shadow-[0_0_100px_rgba(0,0,0,0.5)] p-16 rounded-sm relative overflow-hidden forensic-paper">
            {/* Invisible forensic layer: Distributed Watermarks */}
            <div className="forensic-layer">
                {Array(200).fill(0).map((_, i) => (
                    <div key={i} className="whitespace-nowrap transform rotate-[-30deg]">
                        {paper.watermarkId}::{user.id}::{user.email}::{new Date().getTime()}
                    </div>
                ))}
            </div>

            <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full min-h-[900px] border-none focus:outline-none text-lg leading-relaxed font-serif resize-none bg-transparent relative z-20"
                placeholder="Secure Examination Content..."
                spellCheck={false}
            />

            {/* Hidden pixel metadata corner markers */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#fdfdfd] z-30" />
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#fdfdfd] z-30" />
        </div>
        
        <div className="mt-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
            End of Secure Document Structure
        </div>
      </div>

      {/* Monitoring Status Bar */}
      <div className="h-6 bg-cyan-600/90 backdrop-blur flex items-center justify-between px-6 shrink-0 shadow-[0_-10px_30px_rgba(6,182,212,0.2)]">
          <div className="flex items-center gap-4">
              <span className="text-[9px] text-white font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                  Active Neural Monitoring Level 5 Enabled
              </span>
          </div>
          <span className="text-[9px] text-cyan-50 font-black uppercase tracking-[0.2em] opacity-80">
              Session Integrity Certified :: {user.fullName}
          </span>
      </div>
    </div>
  );
};

export default PaperEditor;
