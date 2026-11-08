import type { SportTypeId } from '../components/sport/VitaGoSportView';

const STORAGE_KEY = 'vitago_active_sport_session_v1';
const GPS_GRANTED_KEY = 'vitago_gps_granted_v1';

export interface SportTrackerState {
  isRecording: boolean;
  startTimeMs: number | null;
  elapsedSec: number;
  selectedSport: SportTypeId;
  distanceKm: number;
  elevGainM: number;
  routeCoords: [number, number][];
  userPos: [number, number];
  gpsAccuracy: number | null;
  gpsReady: boolean;
  gpsPermissionDenied: boolean;
  locationLabel: string;
  destPos: [number, number] | null;
  destRouteCoords: [number, number][];
  routeDistanceKm: number | null;
  destReached: boolean;
}

type Listener = (state: SportTrackerState) => void;

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class SportTrackerManager {
  private static instance: SportTrackerManager;
  private listeners: Set<Listener> = new Set();
  private watchId: number | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private lastPos: [number, number] | null = null;
  private lastAlt: number | null = null;
  private wakeLock: any = null;
  private geocodedOnce = false;

  private state: SportTrackerState = {
    isRecording: false,
    startTimeMs: null,
    elapsedSec: 0,
    selectedSport: 'walk',
    distanceKm: 0,
    elevGainM: 0,
    routeCoords: [],
    userPos: [39.7747, 64.4286],
    gpsAccuracy: null,
    gpsReady: localStorage.getItem(GPS_GRANTED_KEY) === 'true',
    gpsPermissionDenied: false,
    locationLabel: localStorage.getItem('vitago_last_loc_label') || "O'zbekiston",
    destPos: null,
    destRouteCoords: [],
    routeDistanceKm: null,
    destReached: false,
  };

  private constructor() {
    this.restoreFromStorage();
    this.ensureTimerRunning();

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          if (this.state.isRecording && this.state.startTimeMs) {
            this.state = {
              ...this.state,
              elapsedSec: Math.max(0, Math.floor((Date.now() - this.state.startTimeMs) / 1000)),
            };
            this.notify();
          }
          if (this.state.isRecording || this.state.destPos || this.state.gpsReady) {
            this.startGpsWatch(true);
          }
        }
      });
    }
  }

  public static getInstance(): SportTrackerManager {
    if (!SportTrackerManager.instance) {
      SportTrackerManager.instance = new SportTrackerManager();
    }
    return SportTrackerManager.instance;
  }

  private restoreFromStorage() {
    try {
      const savedPos = localStorage.getItem('vitago_last_gps_pos');
      if (savedPos) {
        const parsedPos = JSON.parse(savedPos);
        if (Array.isArray(parsedPos) && parsedPos.length === 2) {
          this.state.userPos = [Number(parsedPos[0]), Number(parsedPos[1])];
        }
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.state.isRecording = Boolean(parsed.isRecording);
          this.state.startTimeMs = parsed.startTimeMs || null;
          this.state.selectedSport = parsed.selectedSport || 'walk';
          this.state.distanceKm = Number(parsed.distanceKm || 0);
          this.state.elevGainM = Number(parsed.elevGainM || 0);
          this.state.routeCoords = Array.isArray(parsed.routeCoords) ? parsed.routeCoords : [];
          this.state.destPos = parsed.destPos || null;
          this.state.destRouteCoords = Array.isArray(parsed.destRouteCoords) ? parsed.destRouteCoords : [];
          this.state.routeDistanceKm = parsed.routeDistanceKm ?? null;
          this.state.destReached = Boolean(parsed.destReached);

          if (this.state.routeCoords.length > 0) {
            this.lastPos = this.state.routeCoords[this.state.routeCoords.length - 1];
          }
          if (this.state.isRecording && this.state.startTimeMs) {
            this.state.elapsedSec = Math.max(0, Math.floor((Date.now() - this.state.startTimeMs) / 1000));
            this.startGpsWatch(true);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private persistToStorage() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isRecording: this.state.isRecording,
          startTimeMs: this.state.startTimeMs,
          selectedSport: this.state.selectedSport,
          distanceKm: this.state.distanceKm,
          elevGainM: this.state.elevGainM,
          routeCoords: this.state.routeCoords.slice(-400),
          destPos: this.state.destPos,
          destRouteCoords: this.state.destRouteCoords.slice(-400),
          routeDistanceKm: this.state.routeDistanceKm,
          destReached: this.state.destReached,
        })
      );
    } catch {
      // ignore
    }
  }

  private ensureTimerRunning() {
    if (this.timerId) return;
    this.timerId = setInterval(() => {
      if (this.state.isRecording && this.state.startTimeMs) {
        const nextSec = Math.max(0, Math.floor((Date.now() - this.state.startTimeMs) / 1000));
        if (nextSec !== this.state.elapsedSec) {
          this.state = { ...this.state, elapsedSec: nextSec };
          this.notify();
        }
      }
    }, 1000);
  }

  public getState(): SportTrackerState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const l of this.listeners) {
      l(this.state);
    }
  }

  public retryGpsPermission() {
    try {
      if (typeof window !== 'undefined' && (window as any).VitaGoNative?.requestLocationPermission) {
        (window as any).VitaGoNative.requestLocationPermission();
      }
    } catch {
      // ignore
    }
    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(this.watchId);
      } catch {}
      this.watchId = null;
    }
    this.state = { ...this.state, gpsPermissionDenied: false };
    this.notify();
    this.startGpsWatch(false);
  }

  public startGpsWatch(silent = false) {
    try {
      if (typeof window !== 'undefined' && (window as any).VitaGoNative?.requestLocationPermission) {
        if (!(window as any).VitaGoNative?.hasLocation?.()) {
          (window as any).VitaGoNative.requestLocationPermission();
        }
      }
    } catch {
      // ignore
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (!silent) {
        this.state = { ...this.state, gpsPermissionDenied: true };
        this.notify();
      }
      return;
    }

    if (this.watchId !== null) return;

    const handlePosition = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const alt = pos.coords.altitude;
      const acc = Math.round(pos.coords.accuracy || 10);

      localStorage.setItem(GPS_GRANTED_KEY, 'true');
      localStorage.setItem('vitago_last_gps_pos', JSON.stringify([lat, lng]));

      let nextDist = this.state.distanceKm;
      let nextElev = this.state.elevGainM;
      let nextRoute = this.state.routeCoords;
      let nextDestPos = this.state.destPos;
      let nextDestRoute = this.state.destRouteCoords;
      let nextDestReached = this.state.destReached;

      if (this.state.isRecording) {
        if (this.lastPos) {
          const dKm = haversineKm(this.lastPos[0], this.lastPos[1], lat, lng);
          // Count movement smoothly even at walking pace or off-center from route (1.2m to 1.5km)
          if (dKm >= 0.0012 && dKm < 1.5 && acc <= 150) {
            nextDist = Number((nextDist + dKm).toFixed(3));
            nextRoute = [...nextRoute, [lat, lng]];
            this.lastPos = [lat, lng];
          }
        } else {
          this.lastPos = [lat, lng];
          nextRoute = [[lat, lng]];
        }

        // Ensure net displacement from start point is always reflected
        if (nextRoute.length >= 2) {
          const firstPt = nextRoute[0];
          const netDispKm = haversineKm(firstPt[0], firstPt[1], lat, lng);
          if (netDispKm > nextDist && netDispKm < 50) {
            nextDist = Number(netDispKm.toFixed(3));
          }
        }

        if (alt !== null && this.lastAlt !== null) {
          const diffAlt = alt - this.lastAlt;
          if (diffAlt > 1.0 && diffAlt < 30) {
            nextElev = Math.round(nextElev + diffAlt);
          }
        }
        if (alt !== null) {
          this.lastAlt = alt;
        }
      } else {
        this.lastPos = [lat, lng];
      }

      // Off-Line Corridor & Destination Arrival Check:
      // Even if user walks slightly to the side of the blue line, trim passed points & detect arrival!
      if (nextDestPos) {
        const distToDestKm = haversineKm(lat, lng, nextDestPos[0], nextDestPos[1]);

        // Trim passed vertices along the blue route so the line updates dynamically
        if (nextDestRoute.length >= 2) {
          let closestIdx = 0;
          let minD = Infinity;
          for (let i = 0; i < nextDestRoute.length; i++) {
            const d = haversineKm(lat, lng, nextDestRoute[i][0], nextDestRoute[i][1]);
            if (d < minD) {
              minD = d;
              closestIdx = i;
            }
          }
          // If within 80m corridor of the route, trim behind the user's progress
          if (minD <= 0.08 && closestIdx > 0) {
            nextDestRoute = [[lat, lng], ...nextDestRoute.slice(closestIdx)];
          } else {
            nextDestRoute = [[lat, lng], ...nextDestRoute.slice(1)];
          }
        }

        // Check if user reached destination (within 42m radius OR covered planned distance near destination)
        const plannedKm = this.state.routeDistanceKm || 0;
        const coveredEnoughNearDest =
          plannedKm > 0 && nextDist >= plannedKm * 0.88 && distToDestKm <= 0.085;

        if (distToDestKm <= 0.042 || coveredEnoughNearDest) {
          if (plannedKm > 0 && nextDist < plannedKm) {
            nextDist = Number(plannedKm.toFixed(3));
          }
          nextDestReached = true;
          nextDestPos = null;
          nextDestRoute = [];
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([200, 100, 250]);
            }
          } catch {}
        }
      }

      this.state = {
        ...this.state,
        userPos: [lat, lng],
        gpsAccuracy: acc,
        gpsReady: true,
        gpsPermissionDenied: false,
        distanceKm: nextDist,
        elevGainM: nextElev,
        routeCoords: nextRoute,
        destPos: nextDestPos,
        destRouteCoords: nextDestRoute,
        destReached: nextDestReached,
      };
      this.persistToStorage();
      this.notify();

      if (!this.geocodedOnce) {
        this.geocodedOnce = true;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&accept-language=uz`)
          .then((r) => r.json())
          .then((data) => {
            if (data?.address) {
              const city =
                data.address.city ||
                data.address.town ||
                data.address.county ||
                data.address.state ||
                "O'zbekiston";
              const sub = data.address.suburb || data.address.neighbourhood || '';
              const label = sub ? `${sub}, ${city}` : city;
              localStorage.setItem('vitago_last_loc_label', label);
              this.state = { ...this.state, locationLabel: label };
              this.notify();
            }
          })
          .catch(() => {});
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      if (err.code === 1 && localStorage.getItem(GPS_GRANTED_KEY) !== 'true') {
        this.state = { ...this.state, gpsPermissionDenied: true };
        this.notify();
      }
    };

    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 15000,
    });

    this.watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 12000,
    });
  }

  public setSelectedSport(sport: SportTypeId) {
    this.state = { ...this.state, selectedSport: sport };
    this.persistToStorage();
    this.notify();
  }

  public clearDestReachedBanner() {
    this.state = { ...this.state, destReached: false };
    this.persistToStorage();
    this.notify();
  }

  public setDestination(
    destPos: [number, number] | null,
    destRouteCoords: [number, number][] = [],
    routeDistanceKm: number | null = null
  ) {
    this.state = {
      ...this.state,
      destPos,
      destRouteCoords,
      routeDistanceKm,
      destReached: false,
    };
    this.persistToStorage();
    this.notify();
  }

  public async startWorkout(sport?: SportTypeId) {
    const activeSport = sport || this.state.selectedSport;
    this.lastPos = this.state.userPos;
    this.state = {
      ...this.state,
      isRecording: true,
      startTimeMs: Date.now(),
      elapsedSec: 0,
      selectedSport: activeSport,
      distanceKm: 0,
      elevGainM: 0,
      routeCoords: [this.state.userPos],
      destReached: false,
    };
    this.persistToStorage();
    this.notify();
    this.startGpsWatch(true);

    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      }
    } catch {
      // ignore
    }
  }

  public stopWorkout(): SportTrackerState {
    const finalSnapshot = { ...this.state };
    this.state = {
      ...this.state,
      isRecording: false,
      startTimeMs: null,
      elapsedSec: 0,
      distanceKm: 0,
      elevGainM: 0,
      routeCoords: [],
      destReached: false,
    };
    this.persistToStorage();
    this.notify();

    try {
      if (this.wakeLock) {
        this.wakeLock.release();
        this.wakeLock = null;
      }
    } catch {
      // ignore
    }
    return finalSnapshot;
  }
}
