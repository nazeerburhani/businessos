import React, { useState, useEffect } from 'react';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, User, ArrowRight } from 'lucide-react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
} from 'firebase/auth';

const provider = new GoogleAuthProvider();

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const friendlyError = (code) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later.';
      case 'auth/network-request-failed':
        return 'No internet connection.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled.';
      case 'auth/invalid-api-key':
      case 'auth/api-key-not-valid':
        return 'Firebase not configured. Use Demo Mode below.';
      case 'auth/operation-not-allowed':
        return 'Google sign-in is not enabled in Firebase Console.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for Firebase Auth.';
      default:
        return `Error: ${code}. Please check Firebase settings.`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup') {
      if (!name.trim()) { setError('Please enter your name.'); return; }
      if (password !== confirmPw) { setError('Passwords do not match.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    }
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        onLogin(cred.user.email);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
        onLogin(cred.user.email);
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError('');
    try {
      const gProvider = new GoogleAuthProvider();
      // Set custom parameters to force account selection if needed
      gProvider.setCustomParameters({ prompt: 'select_account' });
      
      const cred = await signInWithPopup(auth, gProvider);
      if (cred?.user) {
        onLogin(cred.user.email);
      }
    } catch (err) {
      console.error("Google Auth Error:", err.code, err.message);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err.code));
      }
    } finally { 
      setGoogleLoading(false); 
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass">
        {/* Logo */}
        <div className="login-head">
          <div className="login-icon"><Zap size={26} color="#fff" /></div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 900, marginBottom: 4 }}>
            <span style={{ color: 'var(--accent)' }}>Business</span>OS
          </h1>
          <p style={{ color: 'var(--txt3)', fontSize: '0.82rem' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 20 }}>
          {[['login', 'Sign In'], ['signup', 'Sign Up']].map(([m, l]) => (
            <button key={m} type="button" onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontWeight: 700,
                fontSize: '0.85rem', transition: 'all 0.2s',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#000' : 'var(--txt3)',
              }}>
              {l}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <div className="input-wrap">
              <label className="input-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)' }} />
                <input className="input" style={{ paddingLeft: 36 }} type="text" placeholder="Your full name"
                  value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
            </div>
          )}

          <div className="input-wrap">
            <label className="input-label">Email Address *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)' }} />
              <input className="input" style={{ paddingLeft: 36 }} type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} autoFocus={mode === 'login'} />
            </div>
          </div>

          <div className="input-wrap">
            <label className="input-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)' }} />
              <input className="input" style={{ paddingLeft: 36, paddingRight: 44 }} type={showPw ? 'text' : 'password'}
                placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div className="input-wrap">
              <label className="input-label">Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)' }} />
                <input className="input" style={{ paddingLeft: 36 }} type="password" placeholder="Re-enter password"
                  value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: 'var(--rose-s)', border: '1px solid var(--rose-g)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--rose)' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}

          <button type="submit" className="btn btn-lg w-full" disabled={loading}
            style={{ background: 'var(--accent)', color: '#000', fontWeight: 800, fontSize: '0.95rem', gap: 8, justifyContent: 'center', minHeight: 48 }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--txt3)', fontSize: '0.75rem' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            or continue with
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Google Auth */}
          <button type="button" onClick={handleGoogle} disabled={googleLoading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '12px 20px', borderRadius: 10, border: '1.5px solid var(--border)',
              background: 'var(--bg-input)', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              color: 'var(--txt)', transition: 'all 0.2s', minHeight: 48,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {/* Google logo SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Connecting…' : 'Sign in with Google'}
          </button>

          {/* Demo mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--txt3)', fontSize: '0.72rem' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            or
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <button type="button" className="btn btn-ghost w-full"
            style={{ fontSize: '0.82rem', minHeight: 44 }}
            onClick={() => onLogin('demo@businessos.app')}>
            Continue in Demo Mode (no login needed)
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.7rem', color: 'var(--txt3)' }}>
          Developed by <strong style={{ color: 'var(--accent)' }}>Nazeer Ahmad</strong> · BusinessOS v3.0
        </div>
      </div>
    </div>
  );
}
