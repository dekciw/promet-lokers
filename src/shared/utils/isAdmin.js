import { ADMIN_EMAIL } from '../constants/admin';

export function isAdmin(email) {
  return email === ADMIN_EMAIL;
}
