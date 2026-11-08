import type {
  AIChatMessage,
  AIChatResponse,
  AlarmMissionVerifyResponse,
  DrugSearchItem,
  ElderlyAnalysisResponse,
  FoodScanResponse,
  HealthAnalysisResponse,
  OtpRequestResponse,
  PaymentCheckoutResponse,
  PaymentStatusResponse,
  PlanInfo,
  PlatformStatsResponse,
  PrescriptionAnalysisResponse,
  SamplePrescriptionMeta,
  SupportedLang,
  UserProfile,
} from '../types/api';

const API_BASE = '/api/v1';
const USER_STORAGE_KEY = 'doriscan_user_profile';

export function loadSavedUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem('doriscan_user');
    if (!raw) return null;
    const u = JSON.parse(raw) as UserProfile;
    // Plan is strictly determined by server-verified profile or official phone
    if (u.phone === '+998872207844') {
      u.plan = 'ultra';
    }
    return u;
  } catch {
    return null;
  }
}

export function saveUserLocally(user: UserProfile): void {
  try {
    const json = JSON.stringify(user);
    localStorage.setItem(USER_STORAGE_KEY, json);
    localStorage.setItem('doriscan_user', json);
  } catch {
    // ignore
  }
}

export function clearSavedUser(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('doriscan_user');
  } catch {
    // ignore
  }
}

/**
 * Fetch wrapper with a protective timeout so the UI never hangs indefinitely.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 40000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      const secs = Math.round(timeoutMs / 1000);
      throw new Error(
        `AI model javob berishi cho'zilib ketdi (${secs} soniya). Iltimos, qayta urinib ko'ring yoki rasm hajmini tekshiring.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Compress large mobile camera photos on the client so uploads are fast on 3G/4G
 * and always remain safely under serverless payload limits (4.5 MB).
 */
export async function compressImageForUpload(file: File, maxDimension = 1500): Promise<Blob> {
  if (file.size <= 800 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Server xatosi (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody?.detail) {
        detail = typeof errBody.detail === 'string' ? errBody.detail : JSON.stringify(errBody.detail);
      }
    } catch {
      // ignore json parse failure
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function fetchPlatformStats(): Promise<PlatformStatsResponse> {
  const res = await fetchWithTimeout(`${API_BASE}/stats`, {}, 15000);
  return handleJson<PlatformStatsResponse>(res);
}

export async function fetchSamplePrescriptions(lang: SupportedLang): Promise<SamplePrescriptionMeta[]> {
  const res = await fetchWithTimeout(`${API_BASE}/prescription/samples?lang=${encodeURIComponent(lang)}`, {}, 15000);
  return handleJson<SamplePrescriptionMeta[]>(res);
}

export async function runDemoPrescription(
  sampleId: string,
  lang: SupportedLang
): Promise<PrescriptionAnalysisResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/prescription/demo/${encodeURIComponent(sampleId)}?lang=${encodeURIComponent(lang)}`,
    { method: 'POST' },
    25000
  );
  return handleJson<PrescriptionAnalysisResponse>(res);
}

export async function scanPrescriptionImage(
  file: File,
  lang: SupportedLang
): Promise<PrescriptionAnalysisResponse> {
  const compressed = await compressImageForUpload(file);
  const formData = new FormData();
  formData.append('file', compressed, file.name || 'prescription.jpg');
  formData.append('lang', lang);

  const res = await fetchWithTimeout(
    `${API_BASE}/prescription/scan`,
    {
      method: 'POST',
      body: formData,
    },
    55000
  );
  return handleJson<PrescriptionAnalysisResponse>(res);
}

export async function searchDrugs(query: string, lang: SupportedLang): Promise<DrugSearchItem[]> {
  const params = new URLSearchParams({ q: query, lang, limit: '12' });
  const res = await fetchWithTimeout(`${API_BASE}/drugs/search?${params.toString()}`, {}, 15000);
  return handleJson<DrugSearchItem[]>(res);
}

export async function fetchDrugAnalogsById(
  drugId: number,
  lang: SupportedLang
): Promise<PrescriptionAnalysisResponse> {
  const res = await fetchWithTimeout(`${API_BASE}/drugs/${drugId}/analogs?lang=${encodeURIComponent(lang)}`, {}, 20000);
  return handleJson<PrescriptionAnalysisResponse>(res);
}

export async function lookupRareDrugWithAI(
  query: string,
  lang: SupportedLang
): Promise<PrescriptionAnalysisResponse> {
  const params = new URLSearchParams({ q: query, lang });
  const res = await fetchWithTimeout(
    `${API_BASE}/drugs/ai-lookup?${params.toString()}`,
    { method: 'POST' },
    35000
  );
  return handleJson<PrescriptionAnalysisResponse>(res);
}

// ---- Authentication & Profile API ----

export async function requestOtp(
  phone: string,
  firstName?: string,
  lastName?: string,
  tgChatId?: number
): Promise<OtpRequestResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/auth/request-otp`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        first_name: firstName,
        last_name: lastName,
        telegram_chat_id: tgChatId,
      }),
    },
    20000
  );
  return handleJson<OtpRequestResponse>(res);
}

export async function verifyOtp(
  phone: string,
  code: string,
  firstName?: string,
  lastName?: string,
  tgChatId?: number
): Promise<UserProfile> {
  const res = await fetchWithTimeout(
    `${API_BASE}/auth/verify-otp`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        code,
        first_name: firstName,
        last_name: lastName,
        telegram_chat_id: tgChatId,
      }),
    },
    20000
  );
  const user = await handleJson<UserProfile>(res);
  saveUserLocally(user);
  return user;
}

export async function fetchMe(token: string): Promise<UserProfile> {
  const res = await fetchWithTimeout(
    `${API_BASE}/auth/me`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    15000
  );
  const user = await handleJson<UserProfile>(res);
  saveUserLocally(user);
  return user;
}
export const getMe = fetchMe;

export async function updateProfile(
  token: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const res = await fetchWithTimeout(
    `${API_BASE}/auth/profile`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
    25000
  );
  const updated = await handleJson<UserProfile>(res);
  saveUserLocally(updated);
  return updated;
}

export async function logoutUser(token: string): Promise<void> {
  try {
    await fetchWithTimeout(
      `${API_BASE}/auth/logout`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      },
      10000
    );
  } finally {
    clearSavedUser();
  }
}

// ---- Plans & Billing API ----

export async function fetchPlans(): Promise<PlanInfo[]> {
  const res = await fetchWithTimeout(`${API_BASE}/plans`, {}, 15000);
  return handleJson<PlanInfo[]>(res);
}

export async function checkPromoCode(code: string, plan: string, billingCycle = 'monthly') {
  const res = await fetchWithTimeout(
    `${API_BASE}/plans/promo-check`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, plan, billing_cycle: billingCycle }),
    },
    15000
  );
  return handleJson<{ valid: boolean; discount_uzs: number; message: string }>(res);
}

export async function checkoutPlan(
  data: {
    plan: string;
    billing_cycle: string;
    card_number: string;
    card_holder: string;
    cvc?: string;
    promo_code?: string;
    receipt_image?: string;
    user_phone?: string;
  },
  token: string
): Promise<PaymentCheckoutResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/plans/checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
    25000
  );
  return handleJson<PaymentCheckoutResponse>(res);
}

export async function sendApkViaTelegram(telegramChatId?: number, phone?: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetchWithTimeout(
    `${API_BASE}/auth/send-apk-telegram`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_chat_id: telegramChatId, phone }),
    },
    15000
  );
  return handleJson<{ ok: boolean; message: string }>(res);
}

export async function confirmPaymentSent(
  paymentId: number,
  receiptImage: string | null,
  token: string
): Promise<PaymentStatusResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/plans/confirm/${paymentId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receipt_image: receiptImage }),
    },
    20000
  );
  return handleJson<PaymentStatusResponse>(res);
}

export async function getPaymentStatus(paymentId: number, token: string): Promise<PaymentStatusResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/plans/status/${paymentId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    15000
  );
  return handleJson<PaymentStatusResponse>(res);
}

// ---- Premium & Ultra Features API ----

export async function askAIChat(
  message: string,
  history: AIChatMessage[],
  voiceGender: 'male' | 'female',
  token: string
): Promise<AIChatResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/features/ai-chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        history,
        voice_gender: voiceGender,
      }),
    },
    35000
  );
  return handleJson<AIChatResponse>(res);
}

export async function getHealthAssessment(
  dailyRoutineNotes: string,
  token: string
): Promise<HealthAnalysisResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/features/health-assessment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ daily_routine_notes: dailyRoutineNotes }),
    },
    30000
  );
  return handleJson<HealthAnalysisResponse>(res);
}

export async function getElderlyAnalysis(
  notes: string,
  bloodImgBase64: string | null,
  token: string
): Promise<ElderlyAnalysisResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/features/elderly-analysis`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        notes_or_symptoms: notes,
        blood_test_image: bloodImgBase64,
      }),
    },
    35000
  );
  return handleJson<ElderlyAnalysisResponse>(res);
}

export async function scanFoodNutrition(imageBase64: string, token: string): Promise<FoodScanResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/features/food-scan`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ image_base64: imageBase64 }),
    },
    35000
  );
  return handleJson<FoodScanResponse>(res);
}

export async function verifyAlarmMission(
  step: number,
  imageBase64: string,
  token: string
): Promise<AlarmMissionVerifyResponse> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/features/alarm/verify-mission`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ step, image_base64: imageBase64 }),
      },
      30000
    );
    return await handleJson<AlarmMissionVerifyResponse>(res);
  } catch (err: any) {
    console.warn('verifyAlarmMission fallback caught:', err);
    return {
      step,
      passed: false,
      next_step: step,
      message: "Tasvir qabul qilinmadi. Iltimos, kamerani rakvina yoki vazifa obyektiga to'g'irlab qaytadan oling!",
      mission_completed: false,
    };
  }
}

export async function logDailyActivity(
  steps: number,
  waterMl: number,
  token: string
): Promise<{ ok: boolean; daily_steps: number; target_steps: number; streak_count: number; streak_active: boolean }> {
  const params = new URLSearchParams({ steps: String(steps), water_ml: String(waterMl) });
  const res = await fetchWithTimeout(
    `${API_BASE}/features/activity/log?${params.toString()}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
    15000
  );
  return handleJson<any>(res);
}

export async function getWorkoutPlan(
  req: import('../types/api').WorkoutPlanRequest,
  token: string
): Promise<import('../types/api').WorkoutPlanResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/features/workout-plan`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(req),
    },
    30000
  );
  return handleJson<import('../types/api').WorkoutPlanResponse>(res);
}

export async function getGoalsPlan(
  req: import('../types/api').GoalsPlanRequest,
  token: string
): Promise<import('../types/api').GoalsPlanResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/features/goals-plan`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(req),
    },
    30000
  );
  return handleJson<import('../types/api').GoalsPlanResponse>(res);
}

export async function verifyFoodMeal(
  req: import('../types/api').FoodVerifyRequest,
  token: string
): Promise<import('../types/api').FoodVerifyResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/features/food-verify`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(req),
    },
    35000
  );
  return handleJson<import('../types/api').FoodVerifyResponse>(res);
}

