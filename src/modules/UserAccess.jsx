import React, { useState } from 'react';
import { Shield, Plus, Trash2, Eye, EyeOff, Lock, CheckCircle, Users } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

const ROLES = [
  { value: 'owner',   label: 'Owner',    desc: 'Full access — all modules, settings, reports', color: 'var(--cyan)' },
  { value: 'manager', label: 'Manager',  desc: 'Sales, Inventory, Khata, Reports — no Settings/Data', color: 'var(--violet)' },
  { value: 'cashier', label: 'Cashier',  desc: 'POS only — cannot view reports or settings', color: 'var(--emerald)' },
];

const emptyUser = { name: '', pin: '', role: 'cashier' };

export default function UserAccess() {
  const { data, saveUser, deleteUser } = useBusiness();
  const users = data.settings.users || [];
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyUser);
  const [showPins, setShowPins] = useState({});
  const [saved, setSaved] = useState(false);

  const openAdd  = () => { setForm(emptyUser); setModal(true); };
  const openEdit = (u) => { setForm({ ...u }); setModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name || !form.pin) { alert('Name and PIN are required'); return; }
    if (!/^\d{4}$/.test(form.pin)) { alert('PIN must be exactly 4 digits'); return; }
    // Check duplicate PIN (except self)
    const dup = users.find(u => u.pin === form.pin && u.id !== form.id);
    if (dup) { alert(`PIN ${form.pin} is already used by "${dup.name}". Use a different PIN.`); return; }
    saveUser({ ...form });
    setSaved(true);
    setTimeout(() => { setSaved(false); setModal(false); }, 800);
  };

  const toggleShowPin = (id) => setShowPins(prev => ({ ...prev, [id]: !prev[id] }));

  const roleColor = (role) => ROLES.find(r => r.value === role)?.color || 'var(--txt3)';
  const roleDesc  = (role) => ROLES.find(r => r.value === role)?.desc || '';

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Access & PINs</h1>
          <div className="page-subtitle">Manage who can access your business — each user has their own 4-digit PIN</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add User</button>
      </div>

      {/* Role guide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {ROLES.map(r => (
          <div key={r.value} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${r.color}33` }}>
            <div style={{ fontWeight: 700, color: r.color, fontSize: '0.9rem', marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>{r.desc}</div>
          </div>
        ))}
      </div>

      {/* Users list */}
      {users.length === 0 ? (
        <div className="glass empty-state" style={{ padding: 60 }}>
          <Users size={48} style={{ opacity: 0.3 }} />
          <p>No users yet. Add your first user with a PIN.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {users.map(u => (
            <div key={u.id} className="card" style={{ padding: '20px', borderLeft: `3px solid ${roleColor(u.role)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: roleColor(u.role), fontWeight: 600, marginTop: 2 }}>
                    {u.role?.toUpperCase()}
                  </div>
                </div>
                <div style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 10, background: `${roleColor(u.role)}22`, color: roleColor(u.role), fontWeight: 700 }}>
                  {u.id === 1 ? '👑 Main' : u.role}
                </div>
              </div>

              <div style={{ marginBottom: 12, fontSize: '0.72rem', color: 'var(--txt3)' }}>{roleDesc(u.role)}</div>

              {/* PIN display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 8, marginBottom: 14 }}>
                <Lock size={14} color="var(--txt3)" />
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.3em', flex: 1 }}>
                  {showPins[u.id] ? u.pin : '••••'}
                </span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', display: 'flex' }} onClick={() => toggleShowPin(u.id)}>
                  {showPins[u.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(u)}>Edit</button>
                {u.id !== 1 && (
                  <button className="btn btn-sm btn-icon" style={{ background: 'var(--rose-s)', border: '1px solid var(--rose-g)', color: 'var(--rose)' }} onClick={() => { if (window.confirm(`Delete user "${u.name}"?`)) deleteUser(u.id); }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit User Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={form.id ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Full Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ahmed (Cashier)" autoFocus />
              </div>

              <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">4-Digit PIN *</label>
                <input
                  className="input"
                  type="number"
                  required
                  maxLength={4}
                  value={form.pin}
                  onChange={e => setForm({ ...form, pin: e.target.value.slice(0, 4) })}
                  placeholder="e.g. 1234"
                  style={{ fontFamily: 'monospace', fontSize: '1.3rem', letterSpacing: '0.3em' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginTop: 4 }}>Must be exactly 4 digits. Each user needs a unique PIN.</span>
              </div>

              <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Role *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.value })}
                      style={{
                        padding: '10px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                        border: `2px solid ${form.role === r.value ? r.color : 'var(--border)'}`,
                        background: form.role === r.value ? `${r.color}18` : 'var(--bg-input)',
                        color: form.role === r.value ? r.color : 'var(--txt3)',
                        fontWeight: form.role === r.value ? 700 : 400,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '0.82rem' }}>{r.label}</div>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--txt3)' }}>{roleDesc(form.role)}</div>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {saved ? <><CheckCircle size={15} /> Saved!</> : form.id ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
