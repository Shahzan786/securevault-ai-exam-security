
import { User, ExamPaper, UnlockRequest, AuditLog, UserRole } from './types';

const STORAGE_KEYS = {
  USERS: 'sentry_users',
  PAPERS: 'sentry_papers',
  REQUESTS: 'sentry_requests',
  LOGS: 'sentry_logs',
  WHITELIST: 'sentry_whitelist'
};

export const store = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
  setUsers: (users: User[]) => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)),

  getPapers: (): ExamPaper[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.PAPERS) || '[]'),
  setPapers: (papers: ExamPaper[]) => localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(papers)),

  getRequests: (): UnlockRequest[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]'),
  setRequests: (requests: UnlockRequest[]) => localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests)),

  getLogs: (): AuditLog[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]'),
  addLog: (log: Omit<AuditLog, 'id'>) => {
    const logs = store.getLogs();
    const newLog = { ...log, id: Math.random().toString(36).substr(2, 9) };
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([newLog, ...logs].slice(0, 500)));
    return newLog;
  },

  getWhitelist: (): string[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.WHITELIST) || '[]'),
  addToWhitelist: (email: string) => {
    const list = store.getWhitelist();
    if (!list.includes(email)) {
      localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify([...list, email.toLowerCase()]));
    }
  },

  init: () => {
    // Standard whitelisting for the requested user and system account
    const whitelist = store.getWhitelist();
    if (whitelist.length === 0) {
      store.addToWhitelist('authoriser@sentry.ai');
      store.addToWhitelist('shahzanshaikh786@gmail.com');
    }
    
    // Ensure no orphan sessions
    if (!localStorage.getItem('sentry_active_session')) {
        localStorage.removeItem('sentry_active_session');
    }
  }
};
