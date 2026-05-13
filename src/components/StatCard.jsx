import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, type }) => {
  return (
    <div className="glass-card stat-card col-span-3">
      <div className="stat-header">
        <span>{title}</span>
        <div className={`stat-icon ${type}`}><Icon size={20} /></div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        <span style={{ color: trend.includes('+') || trend === 'Active' ? 'var(--accent-emerald)' : 'var(--accent-red)', fontWeight: 'bold' }}>{trend}</span>
        <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.7rem' }}>Real-time Feed</span>
      </div>
    </div>
  );
};

export default StatCard;
