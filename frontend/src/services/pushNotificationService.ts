/**
 * VitaGo Web Push API Service with VAPID Key Cryptographic Subscription
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPushPermissionState(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function fetchVapidPublicKey(): Promise<string> {
  try {
    const res = await fetch('/api/v1/notifications/vapid-public-key');
    if (res.ok) {
      const data = await res.json();
      if (data.public_key) {
        return data.public_key;
      }
    }
  } catch (err) {
    console.warn('[Push] Failed to fetch VAPID public key from backend:', err);
  }
  // Default fallback key
  return 'BDa1Sk079ht8Io-HCBblLYs1VOIINHBv_9Jkz__DjwonLHUOX36KOY_Dozt2Y2U3eu0f8PQ8wOOVU0vRFmXT8J4';
}

export async function subscribeToWebPush(token: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  if (!isPushSupported()) {
    return { ok: false, error: "Ushbu qurilma yoki brauzerda Web Push qo'llab-quvvatlanmaydi." };
  }

  try {
    // 1. Request Browser Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        ok: false,
        error: "Bildirishnomalarga ruxsat berilmadi. Iltimos, brauzer sozlamalaridan sayt uchun ruxsatni yoqing.",
      };
    }

    // 2. Ensure Service Worker is Active
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      return { ok: false, error: "Service Worker faol emas. Sahifani qayta yuklang." };
    }

    // 3. Obtain VAPID Public Key
    const vapidKey = await fetchVapidPublicKey();
    const appServerKey = urlBase64ToUint8Array(vapidKey);

    // 4. Create or fetch subscription
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return { ok: false, error: "Push kalitlarini shakllantirishda xatolik yuz berdi." };
    }

    // 5. Send to VitaGo Backend
    const res = await fetch('/api/v1/notifications/push-subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }),
    });

    if (res.ok) {
      return { ok: true, message: "Web Push bildirishnomalari muvaffaqiyatli ulandi!" };
    } else {
      const errData = await res.json().catch(() => ({}));
      return { ok: false, error: errData.detail || "Serverga obunani saqlashda xatolik." };
    }
  } catch (err: any) {
    console.error('[Push] subscribeToWebPush error:', err);
    return { ok: false, error: err?.message || "Web Push ulanishida noma'lum xatolik." };
  }
}

export async function unsubscribeFromWebPush(token: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await fetch('/api/v1/notifications/push-unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
      return true;
    }
  } catch (err) {
    console.warn('[Push] unsubscribeFromWebPush error:', err);
  }
  return false;
}
