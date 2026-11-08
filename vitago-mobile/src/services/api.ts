import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'https://doriscan.vercel.app/api/v1';

const TOKEN_KEY = 'vitago_auth_token';
const USER_KEY = 'vitago_user_profile';

export interface MobileUserProfile {
  id: number;
  phone: string;
  first_name: string;
  last_name?: string;
  plan: 'standard' | 'premium' | 'ultra';
  streak_count: number;
  daily_steps: number;
  daily_target_steps: number;
  token?: string;
}

export async function getSavedToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export async function clearAuth(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch {
    // ignore
  }
}

export async function verifySyncCode(code: string): Promise<{ ok: boolean; user: MobileUserProfile; token: string }> {
  const resp = await fetch(`${API_BASE}/auth/verify-sync-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || 'Sinxronizatsiya kodi noto`g`ri yoki muddati o`tgan');
  }
  const data = await resp.json();
  const token = data.token || data.user?.token || '';
  if (token) {
    await saveToken(token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
  return data;
}

export async function fetchUserProfile(token: string): Promise<MobileUserProfile> {
  const resp = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    throw new Error('Profilni yuklab bo`lmadi');
  }
  const user = await resp.json();
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function syncActivity(steps: number, distanceKm: number, token: string): Promise<any> {
  const resp = await fetch(`${API_BASE}/activity/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ steps, distance_km: distanceKm }),
  });
  return resp.json();
}
