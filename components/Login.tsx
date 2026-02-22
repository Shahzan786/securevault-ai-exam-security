
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../types';
import { store } from '../store';
import { geminiService } from '../services/geminiService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.AUTHORISER);
  const [step, setStep] = useState<'IDENTITY' | 'AUTH' | 'OTP' | 'FACE' | 'VERIFYING'>('IDENTITY');
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (step === 'FACE') startCamera();
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError("CAMERA REQUIRED: Zero-Trust access is strictly biometric-only.");
    }
  };

  const handleIdentityCheck = () => {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError("Invalid Email Structure.");
      return;
    }

    const whitelist = store.getWhitelist();
    if (!whitelist.includes(normalizedEmail)) {
      setError("UNAUTHORIZED: Your identity is not in the system whitelist.");
      return;
    }

    const existingUser = store.getUsers().find(u => u.email === normalizedEmail);
    if (existingUser && existingUser.role !== role) {
      setError(`Identity clash: Registered as ${existingUser.role}.`);
      return;
    }

    setError(null);
    setIsNewUser(!existingUser);
    setStep('AUTH');
  };

  const handleAuth = () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!isNewUser) {
        const existingUser = store.getUsers().find(u => u.email === email.toLowerCase().trim());
        if (existingUser?.password !== password) {
            setError("INVALID CREDENTIALS: Password match failed.");
            return;
        }
    }

    setError(null);
    setStep('OTP');
    // Simulated OTP notification
    console.log("SECURE OTP: 882931");
  };

  const handleOtp = () => {
    if (otp !== '882931' && otp !== '123456') { // Allow 123456 as master bypass for demo
        setError("INVALID OTP: Token verification failed.");
        return;
    }
    setError(null);
    setStep('FACE');
  };

  const handleFaceCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setStep('VERIFYING');

    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0);
    
    const frame = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
    const existingUsers = store.getUsers();
    const existingUser = existingUsers.find(u => u.email === email.toLowerCase().trim());

    if (existingUser && existingUser.faceSignature) {
      const result = await geminiService.verifyFace(frame, existingUser.faceSignature);
      if (result.matched && result.confidence > 0.6) {
        onLogin(existingUser);
      } else {
        setError(`BIOMETRIC FAIL: Identity mismatch detected.`);
        setStep('IDENTITY');
      }
    } else {
      // Enrollment
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase().trim(),
        role,
        fullName: email.split('@')[0].toUpperCase(),
        isWhitelisted: true,
        password, // Save password on enrollment
        faceSignature: frame
      };
      store.setUsers([...existingUsers.filter(u => u.email !== newUser.email), newUser]);
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_15px_#06b6d4]"></div>
        
        <div className="p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto border border-cyan-500/20">
            <i className={`fa-solid ${step === 'FACE' ? 'fa-id-card' : step === 'OTP' ? 'fa-shield' : 'fa-lock'} text-2xl text-cyan-500`}></i>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">SENTRY AUTH</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Multi-Layer Zero-Trust</p>
        </div>

        <div className="px-10 pb-12 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg flex items-center gap-3">
              <i className="fa-solid fa-triangle-exclamation text-sm"></i>
              {error}
            </div>
          )}

          {step === 'IDENTITY' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
               <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button onClick={() => setRole(UserRole.AUTHORISER)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${role === UserRole.AUTHORISER ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>Authoriser</button>
                    <button onClick={() => setRole(UserRole.SETTER)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${role === UserRole.SETTER ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>Setter</button>
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Email Identity</label>
                 <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all text-sm" placeholder="name@gmail.com" />
               </div>
               <button onClick={handleIdentityCheck} className="w-full bg-white text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Verify Whitelist</button>
            </div>
          )}

          {step === 'AUTH' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">{isNewUser ? 'Set Account Password' : 'Account Password'}</label>
                 <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all text-sm" placeholder="••••••••" />
               </div>
               <button onClick={handleAuth} className="w-full bg-cyan-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-cyan-500 transition-all">
                   {isNewUser ? 'Create Secure Key' : 'Authorize Key'}
               </button>
            </div>
          )}

          {step === 'OTP' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="text-center">
                   <p className="text-xs text-slate-400">An OTP has been sent to your registered device.</p>
                   <p className="text-[10px] text-cyan-500 mt-1 font-mono">Use 882931 for testing</p>
               </div>
               <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-cyan-500 outline-none transition-all text-center text-2xl font-black tracking-[0.5em]" placeholder="000000" />
               <button onClick={handleOtp} className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all">Validate Token</button>
            </div>
          )}

          {step === 'FACE' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
               <div className="relative aspect-square rounded-full overflow-hidden border-4 border-cyan-500/30">
                  <video ref={videoRef} autoPlay muted className="w-full h-full object-cover scale-x-[-1]" />
                  <div className="absolute inset-0 border-[20px] border-slate-900/60 rounded-full pointer-events-none"></div>
               </div>
               <button onClick={handleFaceCapture} className="w-full bg-white text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-slate-200">Authenticate Biometrics</button>
            </div>
          )}

          {step === 'VERIFYING' && (
            <div className="py-12 flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black text-cyan-500 uppercase tracking-widest animate-pulse">Neural verification in progress...</p>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Login;
