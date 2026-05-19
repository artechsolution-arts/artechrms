import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Monitor, Laptop, Smartphone, Tablet, Headphones, MousePointer, CreditCard, Wifi, Package } from 'lucide-react';

const ASSET_ICONS = {
  Laptop:              Laptop,
  Desktop:             Monitor,
  Mobile:              Smartphone,
  Tablet:              Tablet,
  'Mouse & Keyboard':  MousePointer,
  Monitor:             Monitor,
  Headset:             Headphones,
  'Access Card':       CreditCard,
  'Sim Card':          Wifi,
  Other:               Package,
};

const CONDITION_COLOR = {
  New:     'bg-green-50 text-green-700 border border-green-200',
  Good:    'bg-blue-50 text-blue-700 border border-blue-200',
  Fair:    'bg-amber-50 text-amber-700 border border-amber-200',
  Poor:    'bg-red-50 text-red-700 border border-red-200',
  Damaged: 'bg-red-100 text-red-800 border border-red-300',
};

export default function EmpAssets({ toast }) {
  const [assets, setAssets]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('GET', '/api/portal/profile')
      .then(p => api('GET', `/api/hrm/assets?employee_id=${p.id}&status=Allocated`))
      .then(setAssets)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  );

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Assets</h2>
          <span className="text-sm text-gray-400">{assets.length} item{assets.length !== 1 ? 's' : ''} allocated</span>
        </div>

        {assets.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Monitor size={36} className="text-gray-200 mb-2"/>
              <p className="text-sm text-gray-500">No assets currently assigned to you</p>
              <p className="text-xs text-gray-400 mt-1">Contact HR if you need equipment</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map(a => {
              const Icon = ASSET_ICONS[a.asset_type] || Package;
              return (
                <div key={a.id} className="card p-5 flex gap-4 items-start hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--accent-50)', color: 'var(--accent)' }}>
                    <Icon size={20}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">{a.asset_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{a.asset_type}</div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${CONDITION_COLOR[a.condition] || 'bg-gray-100 text-gray-600'}`}>
                        {a.condition}
                      </span>
                    </div>
                    <div className="mt-2.5 space-y-1">
                      {a.serial_number && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="text-gray-400">Serial</span>
                          <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">{a.serial_number}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="text-gray-400">Allocated</span>
                        <span>{new Date(a.allocated_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {a.notes && (
                        <div className="text-xs text-gray-400 italic">{a.notes}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          For any issues with assigned assets, please contact your IT department or HR.
        </p>
      </div>
    </div>
  );
}
