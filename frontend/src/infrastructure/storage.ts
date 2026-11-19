import * as SecureStore from 'expo-secure-store';
import type { SessionStorage } from '../application/session';

const key = 'mh.admin.session.v1';
export const sessionStorage: SessionStorage = {
  read: () => SecureStore.getItemAsync(key),
  write: value => SecureStore.setItemAsync(key, value),
  clear: () => SecureStore.deleteItemAsync(key),
};
