import { useState, useCallback } from 'react';

let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'info') => {
    const id = ++_id;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return { toasts, toast };
}
