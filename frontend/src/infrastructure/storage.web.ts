import type { SessionStorage } from '../application/session';

// Browser preview uses tab-scoped storage. Native builds use SecureStore.
const key = 'mh.admin.session.v1';
export const sessionStorage: SessionStorage = {
  read: async () => window.sessionStorage.getItem(key),
  write: async value => { window.sessionStorage.setItem(key, value); },
  clear: async () => { window.sessionStorage.removeItem(key); },
};
