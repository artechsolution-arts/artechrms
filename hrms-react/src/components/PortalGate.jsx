import { useState, useEffect } from 'react';
import { api } from '../api';
import { UserCircle, ArrowRight } from 'lucide-react';

export default function PortalGate({ children, onNavigate }) {
  const [status, setStatus] = useState('loading'); // loading | ok | no-record

  useEffect(() => {
    api('GET', '/api/portal/profile')
      .then(() => setStatus('ok'))
      .catch(e => {
        if (e.message?.includes('No employee record') || e.message?.includes('404')) {
          setStatus('no-record');
        } else {
          setStatus('ok'); // let the child page handle other errors
        }
      });
  }, []);

  if (status === 'loading') {
    return <div className="page-content flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  }

  if (status === 'no-record') {
    return (
      <div className="page-content flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--accent-50)' }}>
            <UserCircle size={32} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Employee Record Linked</h2>
          <p className="text-sm text-gray-500 mb-1">
            Your admin account doesn't have an employee record yet.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Go to <strong>Employees</strong> and create your profile using the same email address as your login account.
          </p>
          <button
            onClick={() => onNavigate?.('employees')}
            className="btn btn-primary btn-sm gap-2"
          >
            Go to Employees <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  return children;
}
