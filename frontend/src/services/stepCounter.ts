import { logDailyActivity } from './apiClient';

const STEPS_KEY_PREFIX = 'doriscan_steps_';

export function getTodayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getSavedDailySteps(): number {
  try {
    const key = STEPS_KEY_PREFIX + getTodayDateKey();
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveDailySteps(steps: number): void {
  try {
    const key = STEPS_KEY_PREFIX + getTodayDateKey();
    localStorage.setItem(key, String(steps));
  } catch {
    // ignore
  }
}

export interface StepCounterOptions {
  onStep: (totalStepsToday: number) => void;
  userToken?: string;
}

export class StepCounterManager {
  private static instance: StepCounterManager | null = null;
  private currentSteps = 0;
  private listeners: ((steps: number) => void)[] = [];
  private lastStepTime = 0;
  private lastAccelMagnitude = 9.8;
  private motionHandler: ((e: DeviceMotionEvent) => void) | null = null;
  private userToken = '';
  private syncTimer: number | null = null;
  private activeDateKey = getTodayDateKey();

  private constructor() {
    this.currentSteps = getSavedDailySteps();
  }

  private checkMidnightRollover(): void {
    const today = getTodayDateKey();
    if (this.activeDateKey !== today) {
      this.activeDateKey = today;
      this.currentSteps = getSavedDailySteps();
      this.notify();
    }
  }

  public static getInstance(): StepCounterManager {
    if (!StepCounterManager.instance) {
      StepCounterManager.instance = new StepCounterManager();
    }
    StepCounterManager.instance.checkMidnightRollover();
    return StepCounterManager.instance;
  }

  public setToken(token: string) {
    this.userToken = token;
  }

  public getSteps(): number {
    this.checkMidnightRollover();
    return this.currentSteps;
  }

  public syncFromServer(serverSteps: number) {
    if (typeof serverSteps === 'number' && serverSteps >= 0) {
      if (serverSteps !== this.currentSteps) {
        this.currentSteps = Math.max(this.currentSteps, serverSteps);
        saveDailySteps(this.currentSteps);
        this.notify();
      }
    }
  }

  public subscribe(cb: (steps: number) => void): () => void {
    this.listeners.push(cb);
    if (this.currentSteps > 0) {
      cb(this.currentSteps);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public async requestSensorPermission(): Promise<boolean> {
    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
      try {
        const resp = await (DeviceMotionEvent as any).requestPermission();
        return resp === 'granted';
      } catch {
        return false;
      }
    }
    return true;
  }

  public startListening() {
    if (this.motionHandler || typeof window === 'undefined') return;

    this.motionHandler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

      const x = acc.x;
      const y = acc.y;
      const z = acc.z;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const delta = Math.abs(magnitude - this.lastAccelMagnitude);

      const now = Date.now();
      // Human step peak detection: delta > 2.2 m/s^2 and at least 320ms since previous step
      if (delta > 2.2 && now - this.lastStepTime > 320) {
        this.lastStepTime = now;
        this.addSteps(1);
      }

      this.lastAccelMagnitude = magnitude;
    };

    window.addEventListener('devicemotion', this.motionHandler, { passive: true });
  }

  public stopListening() {
    if (this.motionHandler) {
      window.removeEventListener('devicemotion', this.motionHandler);
      this.motionHandler = null;
    }
  }

  public addSteps(count: number) {
    this.checkMidnightRollover();
    this.currentSteps += count;
    saveDailySteps(this.currentSteps);
    this.notify();
    this.scheduleBackendSync();
  }

  private notify() {
    for (const cb of this.listeners) {
      try {
        cb(this.currentSteps);
      } catch {
        // ignore
      }
    }
  }

  private scheduleBackendSync() {
    if (!this.userToken) return;
    if (this.syncTimer) window.clearTimeout(this.syncTimer);

    this.syncTimer = window.setTimeout(async () => {
      try {
        await logDailyActivity(this.currentSteps, 0, this.userToken);
      } catch {
        // ignore
      }
    }, 5000);
  }
}
