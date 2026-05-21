import { useState, useEffect } from 'react';
import { api } from '../../api';
import Select from '../../components/Select';
import {
  Plus, Pencil, Trash2, KeyRound, Search, ChevronDown,
  UserCheck, UserX, ShieldCheck, X, Eye, EyeOff,
} from 'lucide-react';

const ROLES = ['SuperAdmin', 'CEO', 'HR', 'Employee'];

const ROLE_COLORS = {
  SuperAdmin: 'bg-violet-100 text-violet-700',
  CEO:        'bg-rose-100 text-rose-700',
  HR:         'bg-blue-100 text-blue-700',
  Employee:   'bg-gray-100 text-gray-600',
};

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600'}`}>
      <ShieldCheck size={10} />
      {role}
    </span>
  );
}

function Modal({ title, onClose, children, width = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full ${width} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

const INPUT = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500';
const SELECT = INPUT + ' cursor-pointer';
const BTN_PRIMARY = 'px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors';
const BTN_GHOST = 'px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors';

function CreateUserModal({ onClose, onSave, toast }) {
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '', role: 'HR' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.username || !form.full_name || !form.password) {
      toast('Username, full name and password are required', 'error');
      return;
    }
    setSaving(true);
    try {
      await api('POST', '/api/admin/users', form);
      toast('User created successfully', 'success');
      onSave();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create User Account" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Username *">
            <input className={INPUT} value={form.username} onChange={set('username')} placeholder="e.g. john.doe" />
          </Field>
          <Field label="Role">
            <Select
              value={form.role}
              onChange={v => setForm(f => ({ ...f, role: v }))}
              options={ROLES}
            />
          </Field>
        </div>
        <Field label="Full Name *">
          <input className={INPUT} value={form.full_name} onChange={set('full_name')} placeholder="John Doe" />
        </Field>
        <Field label="Email">
          <input type="email" className={INPUT} value={form.email} onChange={set('email')} placeholder="john@company.com" />
        </Field>
        <Field label="Password *">
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} className={INPUT + ' pr-10'} value={form.password} onChange={set('password')} placeholder="Min 6 characters" />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={BTN_GHOST} onClick={onClose}>Cancel</button>
          <button type="submit" className={BTN_PRIMARY} disabled={saving}>
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSave, toast }) {
  const [form, setForm] = useState({
    username: user.username || '',
    full_name: user.full_name || '',
    email: user.email || '',
    role: user.role || 'HR User',
    is_active: user.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.username.trim()) { toast('Username is required', 'error'); return; }
    setSaving(true);
    try {
      await api('PUT', `/api/admin/users/${user.id}`, form);
      toast('User updated successfully', 'success');
      onSave();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Edit — ${user.username}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Username *">
            <input className={INPUT} value={form.username} onChange={set('username')} placeholder="e.g. john.doe" />
          </Field>
          <Field label="Full Name *">
            <input className={INPUT} value={form.full_name} onChange={set('full_name')} placeholder="John Doe" />
          </Field>
        </div>
        <Field label="Email">
          <input type="email" className={INPUT} value={form.email} onChange={set('email')} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Role">
            <Select
              value={form.role}
              onChange={v => setForm(f => ({ ...f, role: v }))}
              options={ROLES}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.is_active ? 'active' : 'inactive'}
              onChange={v => setForm(f => ({ ...f, is_active: v === 'active' }))}
              options={[
                { value: 'active',   label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={BTN_GHOST} onClick={onClose}>Cancel</button>
          <button type="submit" className={BTN_PRIMARY} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose, toast }) {
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    setSaving(true);
    try {
      await api('POST', `/api/admin/users/${user.id}/reset-password`, { new_password: password });
      toast('Password reset successfully', 'success');
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Reset Password — ${user.username}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-500">Set a new password for <strong className="text-gray-800 dark:text-gray-200">{user.full_name}</strong>.</p>
        <Field label="New Password">
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} className={INPUT + ' pr-10'} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={BTN_GHOST} onClick={onClose}>Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors" disabled={saving}>
            {saving ? 'Resetting…' : 'Reset Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteConfirmModal({ user, onClose, onConfirm, deleting }) {
  return (
    <Modal title="Delete User Account" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <Trash2 size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">This action cannot be undone.</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
              User <strong>{user.username}</strong> ({user.full_name}) will be permanently deleted.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button className={BTN_GHOST} onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete User'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function UserManagement({ toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState(null); // { type, user? }
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api('GET', '/api/admin/users')
      .then(setUsers)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchR = !roleFilter || u.role === roleFilter;
    return matchQ && matchR;
  });

  async function deleteUser(user) {
    setDeleting(true);
    try {
      await api('DELETE', `/api/admin/users/${user.id}`);
      toast('User deleted', 'success');
      setModal(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  const close = () => setModal(null);
  const saved = () => { close(); load(); };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">User Accounts</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ type: 'create' })}>
          <Plus size={15} /> Add User
        </button>
      </div>

      <div className="page-content space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Search by name, username or email…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div>
            <Select
              value={roleFilter}
              onChange={v => setRoleFilter(v)}
              options={[{ value: '', label: 'All Roles' }, ...ROLES.map(r => ({ value: r, label: r }))]}
              placeholder="All Roles"
            />
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2">
          {ROLES.map(r => {
            const count = users.filter(u => u.role === r).length;
            if (!count) return null;
            return (
              <button key={r} onClick={() => setRoleFilter(prev => prev === r ? '' : r)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${roleFilter === r ? (ROLE_COLORS[r] || 'bg-gray-200 text-gray-700') + ' ring-2 ring-offset-1 ring-current' : (ROLE_COLORS[r] || 'bg-gray-100 text-gray-600')}`}>
                <ShieldCheck size={10} />
                {r} — {count}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Linked Employee</th>
                  <th>Created</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-400 text-sm">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-400 text-sm">No users found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id}>
                    <td className="font-medium text-gray-900 dark:text-white">{u.full_name}</td>
                    <td><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs text-gray-600 dark:text-gray-400">{u.username}</code></td>
                    <td className="text-gray-500 text-xs">{u.email || '—'}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                        ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.is_active ? <UserCheck size={10} /> : <UserX size={10} />}
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-gray-500 text-xs">{u.linked_employee || '—'}</td>
                    <td className="text-gray-400 text-xs whitespace-nowrap">{u.created_at || '—'}</td>
                    <td className="text-gray-400 text-xs whitespace-nowrap">{u.updated_at || '—'}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button title="Edit" onClick={() => setModal({ type: 'edit', user: u })}
                          className="p-1.5 rounded-md text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button title="Reset Password" onClick={() => setModal({ type: 'reset', user: u })}
                          className="p-1.5 rounded-md text-gray-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/30 transition-colors">
                          <KeyRound size={13} />
                        </button>
                        <button title="Delete" onClick={() => setModal({ type: 'delete', user: u })}
                          className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
              {filtered.length} of {users.length} accounts
            </div>
          )}
        </div>
      </div>

      {modal?.type === 'create' && <CreateUserModal onClose={close} onSave={saved} toast={toast} />}
      {modal?.type === 'edit'   && <EditUserModal   user={modal.user} onClose={close} onSave={saved} toast={toast} />}
      {modal?.type === 'reset'  && <ResetPasswordModal user={modal.user} onClose={close} toast={toast} />}
      {modal?.type === 'delete' && (
        <DeleteConfirmModal user={modal.user} onClose={close} deleting={deleting}
          onConfirm={() => deleteUser(modal.user)} />
      )}
    </>
  );
}
