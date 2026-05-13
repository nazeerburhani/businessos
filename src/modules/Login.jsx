import React, { useState } from 'react';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true); setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      onLogin(cred.user.email);
    } catch (err) {
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
          ? 'Invalid email or password.'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Try again later.'
          : err.code === 'auth/network-request-failed'
          ? 'No internet connection.'
          : err.code === 'auth/invalid-api-key' || err.code === 'auth/api-key-not-valid'
          ? 'Firebase not configured. Using Demo Mode instead.'
          : 'Login failed. Check your Firebase config.';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card glass" style={{ padding: '40px 36px' }}>
        <div className="login-head">
          <div className="login-icon"><Zap size={28} color="#fff" /></div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 6 }}>
            <span className="text-cyan">Business</span>OS
          </h1>
          <p style={{ color: 'var(--txt3)', fontSize: '0.85rem' }}>Enterprise Suite — Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-wrap">
            <label className="input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)' }} />
              <input className="input" style={{ paddingLeft: 36 }} type="email" placeholder="admin@yourbusiness.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="input-wrap">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)' }} />
              <input className="input" style={{ paddingLeft: 36, paddingRight: 40 }} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', display: 'flex' }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--rose-s)', border: '1px solid var(--rose-g)', borderRadius: 'var(--r)', fontSize: '0.8rem', color: 'var(--rose)' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--txt3)', fontSize: '0.75rem' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            or
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <button type="button" className="btn btn-ghost w-full" onClick={() => onLogin('demo@businessos.app')}>
            Continue in Demo Mode (no login needed)
          </button>
        </form>

        <div style={{ marginTop: 20, padding: 14, background: 'rgba(0,200,240,0.04)', border: '1px solid rgba(0,200,240,0.1)', borderRadius: 'var(--r)', fontSize: '0.75rem', color: 'var(--txt3)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--cyan)' }}>Setup Firebase:</strong><br />
          1. Go to <strong>console.firebase.google.com</strong><br />
          2. Create project → Add Web App → Copy config<br />
          3. Paste in <strong>src/firebase.js</strong><br />
          4. Enable <strong>Authentication → Email/Password</strong>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: '0.7rem', color: 'var(--txt3)' }}>
          Developed by <strong style={{ color: 'var(--cyan)' }}>Nazeer Ahmad</strong>
        </div>
      </div>
    </div>
  );
}
