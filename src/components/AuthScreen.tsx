import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  AlertCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthScreenProps {
  onSuccess: () => void;
  onDemoMode?: () => void;
}

export default function AuthScreen({ onSuccess, onDemoMode }: AuthScreenProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      // Scopes can be added if needed, default is profile and email
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      console.error('Firebase Google Auth Error:', err);
      const errCode = err?.code || 'unknown';
      let errorMsg = `An error occurred during Google Sign-In. (Error Code: ${errCode})`;

      if (errCode === 'auth/popup-blocked') {
        errorMsg = 'Popups are blocked by your browser. Please allow popups for this site to log in. (កម្មវិធីរុករករបស់អ្នកបានរារាំងផ្ទាំងបើកឡើង។ សូមអនុញ្ញាតឱ្យបើកផ្ទាំងឡើងដើម្បីចូលប្រព័ន្ធ)';
      } else if (errCode === 'auth/popup-closed-by-user') {
        errorMsg = 'The login popup was closed before completion. Please try again. (ផ្ទាំងចូលប្រព័ន្ធត្រូវបានបិទមុនពេលបញ្ចប់។ សូមព្យាយាមម្តងទៀត)';
      } else if (errCode === 'auth/operation-not-allowed') {
        errorMsg = 'Google Sign-In is not enabled yet in your Firebase Project. Please enable it in Firebase Console > Authentication > Sign-in method, or click "Demo Mode" below to continue offline. (មុខងារ Google Sign-In មិនទាន់ត្រូវបានបើកនៅក្នុងគម្រោង Firebase របស់លោកអ្នកនៅឡើយទេ។ សូមបើកវាក្នុង Firebase Console ឬចុចយក "Demo Mode" ខាងក្រោមដើម្បីសាកល្បងប្រើប្រាស់)';
      } else if (errCode === 'auth/network-request-failed') {
        errorMsg = 'Network connection failed. Please check your internet connection. (ការតភ្ជាប់បណ្តាញបានបរាជ័យ សូមពិនិត្យការតភ្ជាប់អ៊ីនធឺណិត)';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#0b0f19] text-white overflow-hidden relative font-sans">
      {/* Mesh Gradient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[130px] pointer-events-none z-0"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md p-8 bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-10 text-center"
      >
        {/* Header/Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center border border-white/20 shadow-xl mb-4">
            <Activity className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent uppercase">
            RAKOT TCS
          </h1>
          <p className="text-cyan-300 text-[10px] uppercase tracking-widest mt-1 font-semibold">
            Distribution Management System
          </p>
          <div className="w-12 h-[2px] bg-cyan-500/35 mt-3.5 mb-2 rounded-full"></div>
          <p className="text-slate-400 text-xs">
            Sign In with your Google Account / ចូលប្រើប្រាស់ជាមួយគណនី Google
          </p>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl flex items-start gap-2.5 text-xs font-sans text-left leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
          </motion.div>
        )}

        {/* Action Button Section */}
        <div className="space-y-4">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 active:scale-[0.99] disabled:bg-slate-300 text-slate-900 font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-white/5 cursor-pointer flex items-center justify-center gap-3 transition-all border border-slate-200"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
            ) : (
              <>
                {/* Google Colored Logo G */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Google Sign-In / ចូលប្រព័ន្ធ</span>
              </>
            )}
          </button>
        </div>

        {/* Help tips description inside a subtle container */}
        <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/5 text-left text-[11px] text-slate-400 space-y-2 leading-relaxed">
          <p className="font-semibold text-slate-300 text-xs">How it works / របៀបប្រើប្រាស់៖</p>
          <div className="flex gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>Automatic continuous cloud data synchronization to secure your customers and pricing lists. (រក្សាទុកទិន្នន័យរបស់អ្នកដោយស្វ័យប្រវត្តិទៅកាន់ Cloud)</span>
          </div>
          <div className="flex gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>Encrypted secured cloud storage linked securely with your verified Google Auth credentials. (ការផ្ទុកទិន្នន័យមានសុវត្ថិភាពខ្ពស់)</span>
          </div>
        </div>

        {/* Demo Mode Bypass */}
        {onDemoMode && (
          <div className="mt-6 pt-5 border-t border-white/5 flex flex-col items-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-2.5">Or Continue Offline / ឬសាកល្បងប្រព័ន្ធ (ទុកចិត្តបាន)</span>
            <button
              type="button"
              onClick={onDemoMode}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-cyan-300 hover:text-cyan-200 border border-cyan-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-indigo-500/5 shadow-inner animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Demo Mode / ប្រើប្រាស់សាកល្បង (Offline)
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
