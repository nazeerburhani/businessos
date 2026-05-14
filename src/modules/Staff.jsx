import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

const emptyEmp = { name: '', role: '', department: '', salary: '', phone: '', email: '', joinDate: '', address: '' };

export default function Staff() {
  const { data, saveEmployee, deleteEmployee, markAttendance, processPayroll } = useBusiness();
  const { employees, settings } = data;
  const cur = settings.currency;
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyEmp);
  const [payrollModal, setPayrollModal] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  const openAdd = () => { setForm(emptyEmp); setModal(true); };
  const openEdit = (e) => { setForm({ ...e }); setModal(true); };
  const handleSave = (e) => { e.preventDefault(); saveEmployee({ ...form, salary: Number(form.salary) }); setModal(false); };

  const getAttendanceToday = (emp) => emp.attendance?.find(a => a.date === today)?.status || null;
  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  const totalPayroll = employees.reduce((a, e) => a + (e.salary || 0), 0);

  // Monthly attendance summary per employee
  const thisMonth = today.slice(0, 7);
  const getMonthAttendance = (emp) => {
    const monthAttendance = (emp.attendance || []).filter(a => a.date?.startsWith(thisMonth));
    const present = monthAttendance.filter(a => a.status === 'present').length;
    const absent  = monthAttendance.filter(a => a.status === 'absent').length;
    const leave   = monthAttendance.filter(a => a.status === 'leave').length;
    const total   = monthAttendance.length;
    const pct     = total > 0 ? Math.round((present / total) * 100) : null;
    // Deduction: absent days * (salary / 30)
    const perDay  = (emp.salary || 0) / 30;
    const deduction = Math.round(absent * perDay);
    return { present, absent, leave, total, pct, deduction };
  };

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <div className="page-subtitle">{employees.length} employees · Payroll: {cur} {totalPayroll.toLocaleString()}/month</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Employee</button>
      </div>

      {employees.length === 0 ? (
        <div className="glass empty-state" style={{ padding: 60 }}>
          <Users size={48} /><p>No employees added. Click "Add Employee" to start.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {employees.map(emp => {
            const todayAtt = getAttendanceToday(emp);
            const thisMonthPay = emp.payrollHistory?.find(p => p.date?.slice(0, 7) === today.slice(0, 7));
            return (
              <div key={emp.id} className="card emp-card">
                <div className="emp-avatar">{initials(emp.name)}</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{emp.name}</div>
                <div style={{ color: 'var(--violet)', fontSize: '0.8rem', fontWeight: 600, marginTop: 2 }}>{emp.role}</div>
                {emp.department && <div style={{ color: 'var(--txt3)', fontSize: '0.75rem' }}>{emp.department}</div>}
                <div style={{ margin: '14px 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--cyan)' }}>
                  {cur} {emp.salary?.toLocaleString()}<span style={{ fontSize: '0.75rem', color: 'var(--txt3)', fontWeight: 400 }}>/mo</span>
                </div>
                {emp.phone && <div style={{ fontSize: '0.75rem', color: 'var(--txt3)', marginBottom: 4 }}>{emp.phone}</div>}
                {emp.joinDate && <div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>Joined: {emp.joinDate}</div>}

                {/* Monthly Attendance Summary */}
                {(() => {
                  const att = getMonthAttendance(emp);
                  return att.total > 0 ? (
                    <div style={{ margin: '10px 0', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginBottom: 6, fontWeight: 600 }}>THIS MONTH</div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: '0.72rem', background: 'var(--emerald-s)', color: 'var(--emerald)', padding: '2px 6px', borderRadius: 4 }}>✓ {att.present}P</span>
                        <span style={{ fontSize: '0.72rem', background: 'var(--rose-s)', color: 'var(--rose)', padding: '2px 6px', borderRadius: 4 }}>✗ {att.absent}A</span>
                        <span style={{ fontSize: '0.72rem', background: 'var(--amber-s)', color: 'var(--amber)', padding: '2px 6px', borderRadius: 4 }}>○ {att.leave}L</span>
                        {att.pct !== null && <span style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginLeft: 'auto' }}>{att.pct}%</span>}
                      </div>
                      {att.deduction > 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--rose)' }}>Deduction: - {cur} {att.deduction.toLocaleString()} ({att.absent} absent days)</div>
                      )}
                    </div>
                  ) : null;
                })()}

                {/* Today's Attendance */}
                <div style={{ margin: '14px 0', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--r)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--txt3)' }}>Today's Attendance</span>
                  {todayAtt ? (
                    <span className={`badge ${todayAtt === 'present' ? 'badge-success' : todayAtt === 'absent' ? 'badge-danger' : 'badge-warning'}`}>
                      {todayAtt}
                    </span>
                  ) : <span className="badge badge-neutral">Not marked</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                  <button className="btn btn-sm" style={{ background: 'var(--emerald-s)', border: '1px solid var(--emerald-g)', color: 'var(--emerald)', fontSize: '0.7rem' }} onClick={() => markAttendance(emp.id, 'present')}>
                    <CheckCircle size={12} /> Present
                  </button>
                  <button className="btn btn-sm" style={{ background: 'var(--rose-s)', border: '1px solid var(--rose-g)', color: 'var(--rose)', fontSize: '0.7rem' }} onClick={() => markAttendance(emp.id, 'absent')}>
                    <XCircle size={12} /> Absent
                  </button>
                  <button className="btn btn-sm" style={{ background: 'var(--amber-s)', border: '1px solid var(--amber-g)', color: 'var(--amber)', fontSize: '0.7rem' }} onClick={() => markAttendance(emp.id, 'leave')}>
                    <Clock size={12} /> Leave
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-ghost" style={{ flex: 1 }} onClick={() => openEdit(emp)}><Edit2 size={13} /> Edit</button>
                  <button
                    className="btn btn-sm"
                    style={{ flex: 1, background: thisMonthPay ? 'rgba(255,255,255,0.04)' : 'var(--cyan-s)', border: `1px solid ${thisMonthPay ? 'var(--border)' : 'var(--cyan-g)'}`, color: thisMonthPay ? 'var(--txt3)' : 'var(--cyan)', fontSize: '0.78rem' }}
                    onClick={() => setPayrollModal(emp)}
                    disabled={!!thisMonthPay}
                  >
                    <DollarSign size={13} /> {thisMonthPay ? 'Paid' : 'Pay Salary'}
                  </button>
                  <button className="btn btn-sm btn-icon" style={{ background: 'var(--rose-s)', border: '1px solid var(--rose-g)', color: 'var(--rose)' }} onClick={() => deleteEmployee(emp.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={form.id ? 'Edit Employee' : 'Add Employee'} wide>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Full Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Employee full name" />
              </div>
              <div className="input-wrap">
                <label className="input-label">Role / Position *</label>
                <input className="input" required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Sales Manager" />
              </div>
              <div className="input-wrap">
                <label className="input-label">Department</label>
                <input className="input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Operations" />
              </div>
              <div className="input-wrap">
                <label className="input-label">Monthly Salary ({cur}) *</label>
                <input className="input" type="number" required min="0" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Phone</label>
                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="03XXXXXXXXX" />
              </div>
              <div className="input-wrap">
                <label className="input-label">Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Join Date</label>
                <input className="input" type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{form.id ? 'Update' : 'Add Employee'}</button>
          </div>
        </form>
      </Modal>

      {/* Payroll Confirm Modal */}
      <Modal isOpen={!!payrollModal} onClose={() => setPayrollModal(null)} title="Process Payroll">
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <DollarSign size={40} color="var(--emerald)" style={{ marginBottom: 12 }} />
          <p>Pay <strong>{payrollModal?.name}</strong>'s salary of</p>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--emerald)', margin: '12px 0' }}>{cur} {payrollModal?.salary?.toLocaleString()}</div>
          <p style={{ color: 'var(--txt3)', fontSize: '0.85rem' }}>This will be logged as a Payroll expense.</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setPayrollModal(null)}>Cancel</button>
          <button className="btn btn-success" onClick={() => { processPayroll(payrollModal.id); setPayrollModal(null); }}>Confirm Payment</button>
        </div>
      </Modal>
    </div>
  );
}
