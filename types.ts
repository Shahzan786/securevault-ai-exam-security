
export enum UserRole {
  AUTHORISER = 'AUTHORISER',
  SETTER = 'SETTER'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  isWhitelisted: boolean;
  password?: string; // Encrypted/Hashed string placeholder
  faceSignature?: string; // Base64 of enrollment face
}

export interface ExamPaper {
  id: string;
  title: string;
  content: string;
  setterId: string;
  createdAt: number;
  isLocked: boolean;
  lockDate?: number;
  watermarkId: string;
}

export interface UnlockRequest {
  id: string;
  paperId: string;
  setterId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  dynamicKey?: string;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  type: 'LOGIN' | 'EDIT' | 'SECURITY_ALERT' | 'UNLOCK' | 'FORENSICS';
  userId: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
