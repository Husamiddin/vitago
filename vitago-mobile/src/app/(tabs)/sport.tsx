import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import {
  Navigation,
  Play,
  Square,
  Pause,
  MapPin,
  Flame,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { getSavedToken, syncActivity } from '../../services/api';

export default function SportScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Metrics
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elevationM, setElevationM] = useState(0);
  const [calories, setCalories] = useState(0);
  const [sportType, setSportType] = useState<'walk' | 'run' | 'bike'>('walk');

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<any>(null);
  const lastLocation = useRef<Location.LocationObject | null>(null);

  // Request location permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    return () => {
      stopTracker();
    };
  }, []);

  const startTracker = async () => {
    if (!hasPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ruxsat kerak', 'Sport marshrutini aniq chizish uchun joylashuvga ruxsat bering.');
        return;
      }
      setHasPermission(true);
    }

    setIsTracking(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setDistanceKm(0);
    setElevationM(0);
    setCalories(0);
    lastLocation.current = null;

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Watch live location
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 2,
        },
        (loc) => {
          if (lastLocation.current) {
            const lat1 = lastLocation.current.coords.latitude;
            const lon1 = lastLocation.current.coords.longitude;
            const lat2 = loc.coords.latitude;
            const lon2 = loc.coords.longitude;

            // Haversine formula
            const R = 6371; // km
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLon = ((lon2 - lon1) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const deltaKm = R * c;

            if (deltaKm > 0.001 && deltaKm < 0.2) {
              setDistanceKm((prev) => {
                const updated = prev + deltaKm;
                const calFactor = sportType === 'run' ? 65 : sportType === 'bike' ? 35 : 40;
                setCalories(Math.round(updated * calFactor));
                return Number(updated.toFixed(3));
              });
            }

            // Elevation calculation
            if (loc.coords.altitude && lastLocation.current.coords.altitude) {
              const altDiff = loc.coords.altitude - lastLocation.current.coords.altitude;
              if (altDiff > 0) {
                setElevationM((prev) => prev + Math.round(altDiff));
              }
            }
          }
          lastLocation.current = loc;
        }
      );
    } catch (err: any) {
      Alert.alert('GPS xatosi', err.message || 'Joylashuvni aniqlab bo`lmadi');
    }
  };

  const pauseTracker = () => {
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const resumeTracker = async () => {
    setIsPaused(false);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 2,
      },
      (loc) => {
        lastLocation.current = loc;
      }
    );
  };

  const stopTracker = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    if (isTracking && distanceKm > 0.01) {
      const token = await getSavedToken();
      if (token) {
        try {
          await syncActivity(Math.round(distanceKm * 1350), distanceKm, token);
        } catch {
          // ignore
        }
      }
      Alert.alert(
        'Mashg`ulot yakunlandi! 🏆',
        `Masofa: ${distanceKm} km\nVaqt: ${formatTime(elapsedSeconds)}\nKaloriya: ${calories} kkal`
      );
    }

    setIsTracking(false);
    setIsPaused(false);
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sport GPS</Text>
        <View style={styles.gpsStatusPill}>
          <View style={styles.liveDot} />
          <Text style={styles.gpsStatusText}>
            {hasPermission ? 'GPS Faol' : 'GPS Ruxsat kutilmoqda'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 2. Sport Type Selector */}
        {!isTracking && (
          <View style={styles.selectorCard}>
            <Text style={styles.selectorTitle}>Mashg'ulot turi</Text>
            <View style={styles.typeRow}>
              {[
                { id: 'walk', label: 'Piyoda', cal: '~40 kkal/km' },
                { id: 'run', label: 'Yugurish', cal: '~65 kkal/km' },
                { id: 'bike', label: 'Velosiped', cal: '~35 kkal/km' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.typeBtn, sportType === item.id && styles.typeBtnActive]}
                  onPress={() => setSportType(item.id as any)}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      sportType === item.id && styles.typeBtnTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.typeBtnCal,
                      sportType === item.id && styles.typeBtnCalActive,
                    ]}
                  >
                    {item.cal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 3. Large Timer & Metrics Display */}
        <View style={styles.metricsBox}>
          <Text style={styles.metricLabel}>VAQT</Text>
          <Text style={styles.timeBig}>{formatTime(elapsedSeconds)}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>MASOFA</Text>
              <Text style={styles.statVal}>{distanceKm} km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>BALANDLIK</Text>
              <Text style={styles.statVal}>{elevationM} m</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>KALORIYA</Text>
              <Text style={[styles.statVal, { color: '#EA580C' }]}>{calories} kkal</Text>
            </View>
          </View>
        </View>

        {/* 4. Controls */}
        <View style={styles.actionsBox}>
          {!isTracking ? (
            <TouchableOpacity style={styles.startBtn} onPress={startTracker}>
              <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startBtnText}>Boshlash</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.controlRow}>
              {isPaused ? (
                <TouchableOpacity style={styles.resumeBtn} onPress={resumeTracker}>
                  <Play size={22} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.btnText}>Davom ettirish</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.pauseBtn} onPress={pauseTracker}>
                  <Pause size={22} color="#FFFFFF" />
                  <Text style={styles.btnText}>Pauza</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.stopBtn} onPress={stopTracker}>
                <Square size={20} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.btnText}>To'xtatish & Saqlash</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  gpsStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  gpsStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  content: {
    padding: 20,
  },
  selectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  typeBtnCal: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  typeBtnCalActive: {
    color: '#BFDBFE',
  },
  metricsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  timeBig: {
    fontSize: 54,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
    marginVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  actionsBox: {
    alignItems: 'center',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    width: '100%',
    height: 56,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    height: 52,
    borderRadius: 16,
    gap: 6,
  },
  resumeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    height: 52,
    borderRadius: 16,
    gap: 6,
  },
  stopBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    height: 52,
    borderRadius: 16,
    gap: 6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
