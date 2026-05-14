import React, { useState } from 'react';
import { Star, Gift, Users, TrendingUp, CheckCircle, Award } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

export default function Loyalty() {
  const { data, saveSettings, redeemLoyaltyPoints } = useBusiness();
  const { settings, khata } = data;
  const cur = settings.currency;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loyaltyForm, setLoyaltyForm] = useState({
    loyaltyEnabled: settings.loyaltyEnabled || false,
    loyaltyPointsPerRs: settings.loyaltyPointsPerRs || 1,
    loyaltyRedeemValue: settings.loyaltyRedeemValue || 1,
    loyaltyMinRedeem: settings.loyaltyMinRedeem || 100,
  });
  const [redeemModal, setRedeemModal] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState('');

  const customersWithPoints = khata.filter(k => (k.loyaltyPoints || 0) > 0)
    .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0));
  const totalPoints = khata.reduce((a, k) => a + (k.loyaltyPoints || 0), 0);

  const handleSaveLoyalty = () => {
    saveSettings({ ...loyaltyForm, loyaltyPointsPerRs: Number(loyaltyForm.loyaltyPointsPerRs), loyaltyRedeemValue: Number(loyaltyForm.loyaltyRedeemValue), loyaltyMinRedeem: Number(loyaltyForm.loyaltyMinRedeem) });
    setSettingsOpen(false);
  };

  const handleRedeem = () => {
    const pts = Number(redeemPoints);
    if (!pts || pts < (settings.loyaltyMinRedeem || 100)) { alert(`Minimum ${settings.loyaltyMinRedeem || 100} points required`); return; }
    if (pts > (redeemModal.loyaltyPoints || 0)) { alert('Not enough points'); return; }
    redeemLoyaltyPoints(redeemModal.id, pts);
    const discount = Math.floor(pts * (settings.loyaltyRedeemValue || 1));
    alert(`✅ Redeemed ${pts} points = ${cur} ${discount} discount! Apply this in POS as a flat discount.`);
    setRedeemModal(null);
    setRedeemPoints('');
  };

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loyalty Program</h1>
          <div className="page-subtitle">Reward your regular customers with points</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setSettingsOpen(true)}>
            ⚙️ Program Settings
          </button>
          {!settings.loyaltyEnabled && (
            <button className="btn btn-primary" onClick={() => { saveSettings({ loyaltyEnabled: true }); }}>
              <Star size={15} /> Enable Loyalty
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div style={{ padding: '14px 20px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
        background: settings.loyaltyEnabled ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${settings.loyaltyEnabled ? 'var(--emerald-g)' : 'var(--border)'}` }}>
        <div style={{ fontSize: '2rem' }}>{settings.loyaltyEnabled ? '🌟' : '💤'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>
            Loyalty Program is {settings.loyaltyEnabled ? <span style={{ color: 'var(--emerald)' }}>ACTIVE</span> : <span style={{ color: 'var(--txt3)' }}>DISABLED</span>}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--txt3)' }}>
            {settings.loyaltyEnabled
              ? `Customers earn ${settings.loyaltyPointsPerRs || 1} point per ${cur} 1 spent · ${settings.loyaltyMinRedeem || 100} points = ${cur} ${(settings.loyaltyMinRedeem || 100) * (settings.loyaltyRedeemValue || 1)} discount`
              : 'Enable loyalty to start rewarding customers automatically on every purchase'}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Customers with Points', value: customersWithPoints.length, icon: Users, color: 'c' },
          { label: 'Total Points Issued', value: totalPoints.toLocaleString(), icon: Star, color: 'a' },
          { label: 'Redeemable Value', value: `${cur} ${Math.floor(totalPoints * (settings.loyaltyRedeemValue || 1)).toLocaleString()}`, icon: Gift, color: 'v' },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-card-top">
              <div className="stat-card-label">{s.label}</div>
              <div className={`stat-card-icon ${s.color}`}><s.icon size={18} /></div>
            </div>
            <div className="stat-card-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Customer points leaderboard */}
      <div className="glass" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={18} color="var(--amber)" />
          <span style={{ fontWeight: 700 }}>Customer Points Leaderboard</span>
        </div>
        {customersWithPoints.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <Star size={40} style={{ opacity: 0.3 }} />
            <p>{settings.loyaltyEnabled ? 'No customers have earned points yet. Make a sale with a Khata customer to start.' : 'Enable the loyalty program first.'}</p>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>#</th><th>Customer</th><th>Points</th><th>Redeem Value</th><th>Action</th></tr></thead>
              <tbody>
                {customersWithPoints.map((k, i) => {
                  const redeemValue = Math.floor((k.loyaltyPoints || 0) * (settings.loyaltyRedeemValue || 1));
                  const canRedeem = (k.loyaltyPoints || 0) >= (settings.loyaltyMinRedeem || 100);
                  return (
                    <tr key={k.id}>
                      <td style={{ color: i < 3 ? 'var(--amber)' : 'var(--txt3)', fontWeight: 700 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td style={{ fontWeight: 600 }}>{k.name}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 800, color: 'var(--amber)', fontSize: '1rem' }}>
                          ⭐ {(k.loyaltyPoints || 0).toLocaleString()}
                        </span>
                      </td>
                      <td style={{ color: 'var(--emerald)', fontWeight: 600 }}>{cur} {redeemValue.toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{ background: canRedeem ? 'var(--emerald-s)' : 'transparent', border: `1px solid ${canRedeem ? 'var(--emerald-g)' : 'var(--border)'}`, color: canRedeem ? 'var(--emerald)' : 'var(--txt3)', fontSize: '0.72rem' }}
                          onClick={() => canRedeem && setRedeemModal(k)}
                          disabled={!canRedeem}
                        >
                          <Gift size={12} /> Redeem
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Loyalty Settings Modal */}
      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Loyalty Program Settings" wide>
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 10 }}>
            <span style={{ fontWeight: 600, flex: 1 }}>Enable Loyalty Program</span>
            <button
              className={`btn btn-sm ${loyaltyForm.loyaltyEnabled ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setLoyaltyForm(f => ({ ...f, loyaltyEnabled: !f.loyaltyEnabled }))}
            >
              {loyaltyForm.loyaltyEnabled ? '✅ Enabled' : '⭕ Disabled'}
            </button>
          </div>
          <div className="form-grid">
            <div className="input-wrap">
              <label className="input-label">Points per {cur} 1 Spent</label>
              <input className="input" type="number" min="0.1" step="0.1" value={loyaltyForm.loyaltyPointsPerRs} onChange={e => setLoyaltyForm(f => ({ ...f, loyaltyPointsPerRs: e.target.value }))} />
              <span style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>e.g. 1 = 1 point per Rs. 1 spent</span>
            </div>
            <div className="input-wrap">
              <label className="input-label">1 Point = {cur} ?</label>
              <input className="input" type="number" min="0.1" step="0.1" value={loyaltyForm.loyaltyRedeemValue} onChange={e => setLoyaltyForm(f => ({ ...f, loyaltyRedeemValue: e.target.value }))} />
              <span style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>e.g. 1 = 1 point worth Rs. 1</span>
            </div>
            <div className="input-wrap">
              <label className="input-label">Minimum Points to Redeem</label>
              <input className="input" type="number" min="1" value={loyaltyForm.loyaltyMinRedeem} onChange={e => setLoyaltyForm(f => ({ ...f, loyaltyMinRedeem: e.target.value }))} />
              <span style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>Customer must have at least this many points</span>
            </div>
          </div>
          <div style={{ padding: '12px 16px', marginTop: 16, borderRadius: 10, background: 'rgba(0,200,240,0.06)', border: '1px solid var(--cyan-g)', fontSize: '0.8rem', color: 'var(--txt2)' }}>
            💡 With current settings: A customer spending {cur} 100 earns <strong style={{ color: 'var(--amber)' }}>{Number(loyaltyForm.loyaltyPointsPerRs) * 100} points</strong>. Minimum {loyaltyForm.loyaltyMinRedeem} points = <strong style={{ color: 'var(--emerald)' }}>{cur} {Number(loyaltyForm.loyaltyMinRedeem) * Number(loyaltyForm.loyaltyRedeemValue)} discount</strong>.
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setSettingsOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveLoyalty}><CheckCircle size={15} /> Save Settings</button>
        </div>
      </Modal>

      {/* Redeem Modal */}
      <Modal isOpen={!!redeemModal} onClose={() => setRedeemModal(null)} title={`Redeem Points — ${redeemModal?.name}`}>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎁</div>
          <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--amber)', marginBottom: 4 }}>⭐ {(redeemModal?.loyaltyPoints || 0).toLocaleString()} Points</div>
          <div style={{ color: 'var(--txt3)', fontSize: '0.82rem', marginBottom: 20 }}>Available for {redeemModal?.name}</div>
          <div className="input-wrap" style={{ textAlign: 'left', maxWidth: 280, margin: '0 auto' }}>
            <label className="input-label">Points to Redeem (min: {settings.loyaltyMinRedeem || 100})</label>
            <input className="input" type="number" min={settings.loyaltyMinRedeem || 100} max={redeemModal?.loyaltyPoints || 0} value={redeemPoints} onChange={e => setRedeemPoints(e.target.value)} placeholder={`e.g. ${settings.loyaltyMinRedeem || 100}`} autoFocus />
          </div>
          {redeemPoints > 0 && (
            <div style={{ marginTop: 16, padding: '10px 20px', background: 'var(--emerald-s)', borderRadius: 8, border: '1px solid var(--emerald-g)', fontWeight: 700, color: 'var(--emerald)' }}>
              = {cur} {Math.floor(Number(redeemPoints) * (settings.loyaltyRedeemValue || 1))} discount
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setRedeemModal(null)}>Cancel</button>
          <button className="btn btn-success" onClick={handleRedeem}><Gift size={15} /> Redeem Points</button>
        </div>
      </Modal>
    </div>
  );
}
