import { useState, useEffect, useRef } from 'react';
import { api, apiForm } from '../../api';
import { User, Mail, Phone, Calendar, Briefcase, Building2, CreditCard, Camera, Loader2 } from 'lucide-react';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: 'var(--accent-50)' }}>
        <Icon size={13} style={{ color: 'var(--accent)' }} />
      </div>
      <div>
        <div className="text-xs text-gray-400 mb-0.5">{label}</div>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{value || '—'}</div>
      </div>
    </div>
  );
}

export default function EmpProfile({ toast, onPhotoUpdate }) {
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () =>
    api('GET', '/api/portal/profile')
      .then(setEmp)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handlePhotoChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast('Photo must be under 5 MB', 'warning');
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const { profile_photo } = await apiForm('/api/portal/profile/photo', fd);
      setEmp(prev => ({ ...prev, profile_photo }));
      onPhotoUpdate?.(profile_photo);
      toast('Profile photo updated', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  if (!emp) return null;

  const initials = emp.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Profile header */}
        <div className="card p-6 flex items-center gap-5">
          {/* Avatar with upload overlay */}
          <div className="relative flex-shrink-0">
            {emp.profile_photo ? (
              <img src={emp.profile_photo} alt={emp.full_name}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-2xl text-white flex items-center justify-center text-2xl font-bold shadow-lg"
                style={{ background: `linear-gradient(135deg, var(--accent-dark), var(--accent))` }}>
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-900 shadow flex items-center justify-center hover:scale-110 transition-transform"
              style={{ color: 'var(--accent)' }}
              title="Change photo"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{emp.full_name}</h2>
            <div className="text-sm text-gray-500 mt-0.5">{emp.designation} · {emp.department}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                style={{ backgroundColor: 'var(--accent-50)', color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                {emp.employee_id}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                emp.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600'
              }`}>
                {emp.status}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card">
          <div className="card-head"><span className="card-title">Personal Information</span></div>
          <div className="px-5 pb-2">
            <InfoRow icon={Mail}     label="Email Address"   value={emp.email} />
            <InfoRow icon={Phone}    label="Mobile Number"   value={emp.mobile} />
            <InfoRow icon={User}     label="Gender"          value={emp.gender} />
            <InfoRow icon={Calendar} label="Date of Birth"   value={emp.date_of_birth} />
          </div>
        </div>

        {/* Employment Info */}
        <div className="card">
          <div className="card-head"><span className="card-title">Employment Details</span></div>
          <div className="px-5 pb-2">
            <InfoRow icon={Building2} label="Department"      value={emp.department} />
            <InfoRow icon={Briefcase} label="Designation"     value={emp.designation} />
            <InfoRow icon={Briefcase} label="Employment Type" value={emp.employment_type} />
            <InfoRow icon={Calendar}  label="Date of Joining" value={emp.date_of_joining} />
          </div>
        </div>

        {/* Bank Info */}
        <div className="card">
          <div className="card-head"><span className="card-title">Bank Details</span></div>
          <div className="px-5 pb-2">
            <InfoRow icon={CreditCard} label="Bank Name"      value={emp.bank_name} />
            <InfoRow icon={CreditCard} label="Account Number" value={emp.bank_account_no ? '••••' + emp.bank_account_no.slice(-4) : null} />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">To update your information, contact HR.</p>
      </div>
    </div>
  );
}
