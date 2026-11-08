import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { AlarmClock, Plus, ShieldCheck, Zap, Brain, Camera } from 'lucide-react-native';

interface AlarmItem {
  id: string;
  time: string;
  label: string;
  days: string;
  active: boolean;
  mission: 'math' | 'photo' | 'shake';
}

export default function AlarmScreen() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([
    {
      id: '1',
      time: '06:30',
      label: 'Ertalabki yugurish',
      days: 'Du, Se, Ch, Pa, Ju',
      active: true,
      mission: 'math',
    },
    {
      id: '2',
      time: '23:00',
      label: 'Uxlash vaqti',
      days: 'Har kuni',
      active: false,
      mission: 'shake',
    },
  ]);

  const toggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const handleTestMission = (mission: string) => {
    Alert.alert(
      'Budilnik Missiyasi',
      mission === 'math'
        ? 'Missiya: 37 + 58 = ? javobini topmaguningizcha signal o`chmaydi!'
        : 'Missiya: Oyna yoki tish cho`tkasi rasmini olmaguningizcha signal to`xtamaydi!'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.badgeBanner}>
        <Zap size={18} color="#D97706" fill="#D97706" />
        <View style={{ flex: 1 }}>
          <Text style={styles.badgeBannerTitle}>O'chirib bo'lmas Ultra Budilnik</Text>
          <Text style={styles.badgeBannerSub}>
            Uyg'onishni o'tkazib yubormaslik uchun matematik va foto missiyalar
          </Text>
        </View>
      </View>

      <View style={styles.alarmsList}>
        {alarms.map((a) => (
          <View key={a.id} style={styles.alarmCard}>
            <View style={styles.alarmMain}>
              <Text style={styles.alarmTime}>{a.time}</Text>
              <Text style={styles.alarmLabel}>{a.label}</Text>
              <Text style={styles.alarmDays}>{a.days}</Text>

              <TouchableOpacity
                style={styles.missionTag}
                onPress={() => handleTestMission(a.mission)}
              >
                {a.mission === 'math' ? (
                  <Brain size={14} color="#7C3AED" />
                ) : (
                  <Camera size={14} color="#7C3AED" />
                )}
                <Text style={styles.missionTagText}>
                  Missiya: {a.mission === 'math' ? 'Matematika' : 'Foto'}
                </Text>
              </TouchableOpacity>
            </View>

            <Switch
              value={a.active}
              onValueChange={() => toggleAlarm(a.id)}
              trackColor={{ false: '#CBD5E1', true: '#8B5CF6' }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  badgeBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
    alignItems: 'center',
  },
  badgeBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#92400E',
  },
  badgeBannerSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  alarmsList: {
    gap: 12,
  },
  alarmCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alarmMain: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  alarmLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginTop: 2,
  },
  alarmDays: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
    fontWeight: '600',
  },
  missionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 8,
  },
  missionTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B21A8',
  },
});
