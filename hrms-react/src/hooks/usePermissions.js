import { useState, useEffect } from 'react';
import { api } from '../api';

// Cache permissions per role for the lifetime of the tab
export const _permissionsCache = {};

export function usePermissions(role) {
  const [allowed, setAllowed] = useState(null); // null = loading

  useEffect(() => {
    if (!role) return;
    if (role === 'SuperAdmin') { setAllowed('*'); return; }
    if (_permissionsCache[role]) { setAllowed(_permissionsCache[role]); return; }

    api('GET', '/api/portal/my-permissions')
      .then(data => {
        const features = data.allowed_features || [];
        _permissionsCache[role] = features;
        setAllowed(features);
      })
      .catch(() => setAllowed([]));
  }, [role]);

  // Returns true if the feature is allowed (SuperAdmin always passes)
  const can = (feature) => {
    if (allowed === '*') return true;
    if (!allowed) return true; // still loading — don't hide yet
    return allowed.includes(feature);
  };

  return { allowed, can, loading: allowed === null };
}
