import React, { useState } from 'react';
import { Truck, Plus, Trash2, Search, Phone, Mail, MapPin, DollarSign, ArrowRightLeft } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

export default function Suppliers() {
  const { data, saveSupplier, deleteSupplier } = useBusiness();
  const { suppliers, settings } = data;
  const cur = settings.currency;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSup, setCurrentSup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const sup = {
      id: currentSup?.id,
      name: formData.get('name'),
      company: formData.get('company'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      category: formData.get('category'),
      balance: currentSup?.balance || 0
    };
    saveSupplier(sup);
    setIsModalOpen(false);
  };

  const filtered = (suppliers || []).filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Supplier Management</h1>
          <div className="page-subtitle">Track your vendors and purchasing accounts</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setCurrentSup(null); setIsModalOpen(true); }}>
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      <div className="glass" style={{ padding: 12, marginBottom: 20 }}>
        <div className="search-box">
          <Search size={18} color="var(--txt3)" />
          <input 
            className="search-input" 
            placeholder="Search by name or company..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Truck size={48} />
          <p>No suppliers found. Start by adding your first vendor.</p>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map(s => (
            <div key={s.id} className="card khata-card">
              <div style={{ display: 'flex', gap: 14 }}>
                <div className="khata-avatar">{s.company?.charAt(0) || s.name?.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{s.company || s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>Contact: {s.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className={s.balance >= 0 ? 'khata-balance-positive' : 'khata-balance-negative'}>
                        {cur} {Math.abs(s.balance || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--txt3)' }}>{s.balance >= 0 ? 'YOU OWE' : 'CREDIT'}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--txt2)' }}>
                      <Phone size={12} color="var(--cyan)" /> {s.phone || 'N/A'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--txt2)' }}>
                      <Mail size={12} color="var(--cyan)" /> {s.email || 'N/A'}
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => { setCurrentSup(s); setIsModalOpen(true); }}>Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, color: 'var(--rose)' }} onClick={() => deleteSupplier(s.id)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentSup ? 'Edit Supplier' : 'Add New Supplier'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="input-wrap">
                <label className="input-label">Company Name</label>
                <input className="input" name="company" defaultValue={currentSup?.company} required placeholder="e.g. Acme Corp" />
              </div>
              <div className="input-wrap">
                <label className="input-label">Contact Person</label>
                <input className="input" name="name" defaultValue={currentSup?.name} required placeholder="e.g. John Doe" />
              </div>
            </div>
            <div className="grid-2 mt-4">
              <div className="input-wrap">
                <label className="input-label">Phone</label>
                <input className="input" name="phone" defaultValue={currentSup?.phone} placeholder="e.g. +123456789" />
              </div>
              <div className="input-wrap">
                <label className="input-label">Email</label>
                <input className="input" name="email" defaultValue={currentSup?.email} placeholder="e.g. contact@acme.com" />
              </div>
            </div>
            <div className="input-wrap mt-4">
              <label className="input-label">Address</label>
              <textarea className="input" name="address" defaultValue={currentSup?.address} rows="2" placeholder="Full business address..." />
            </div>
            <div className="input-wrap mt-4">
              <label className="input-label">Category</label>
              <input className="input" name="category" defaultValue={currentSup?.category} placeholder="e.g. Raw Materials, Logistics" />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Supplier</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
