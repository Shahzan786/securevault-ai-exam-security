
import React, { useRef, useEffect, useState } from 'react';
import { User } from '../types';
import { geminiService } from '../services/geminiService';

interface SecurityMonitorProps {
  currentUser: User;
  onAlert: (type: string, details: string) => void;
}

const SecurityMonitor: React.FC<SecurityMonitorProps> = ({ currentUser, onAlert }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<any>(null);
  const [status, setStatus] = useState<'ACTIVE' | 'WARNING' | 'ALERT'>('ACTIVE');

  useEffect(() => {
    startMonitoring();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  /**
   * Performs basic pixel analysis to detect if the camera is covered (Blindness)
   */
  const detectBlindness = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let brightnessSum = 0;
    
    for (let i = 0; i < data.length; i += 40) { // Sample every 10 pixels
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      brightnessSum += (r + g + b) / 3;
    }
    
    const avgBrightness = brightnessSum / (data.length / 40);
    return avgBrightness < 15; // Threshold for "covered" or "very dark"
  };

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;

      // INCREASED FREQUENCY: Every 3 seconds for national-level security
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        
        // 1. LOCAL BLINDNESS CHECK (Instant response)
        const isBlind = detectBlindness(ctx, canvasRef.current.width, canvasRef.current.height);
        if (isBlind) {
            onAlert("CAMERA_OBSTRUCTED", "Security violation: Camera is covered or obscured.");
            return;
        }

        const frame = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
        
        // 2. AI BEHAVIORAL CHECK
        const status = await geminiService.detectSuspiciousActivity(frame);
        if (status.suspicious) {
            onAlert(status.type, status.details);
            return;
        }

        // 3. AI IDENTITY CONSISTENCY
        const matchResult = await geminiService.verifyFace(frame, currentUser.faceSignature!);
        if (!matchResult.matched && matchResult.confidence > 0.6) {
             onAlert("IDENTITY_MISMATCH", "Identity breach: Session owner no longer detected in frame.");
        }

      }, 3000); 
    } catch (err) {
      onAlert("HARDWARE_TAMPER", "Mandatory biometric stream interrupted.");
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 w-44 aspect-video bg-black border-2 rounded-2xl overflow-hidden shadow-2xl z-50 pointer-events-none transition-all ${status === 'ACTIVE' ? 'border-cyan-500' : 'border-red-500'}`}>
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
      <div className="absolute inset-0 bg-cyan-500/5"></div>
      <div className="absolute top-2 left-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_#dc2626]"></div>
          <span className="text-[9px] font-black text-white uppercase tracking-tighter bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">Live Secure Stream</span>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default SecurityMonitor;
