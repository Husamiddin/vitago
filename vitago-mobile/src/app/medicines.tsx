import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Pill,
  Plus,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Bell,
  X,
  Clock,
} from 'lucide-react-native';

interface MobileMedication {
  id: string;
  condition: string;
  drugName: string;
  dose: string;
  timesPerDay: number;
  time: string;
  durationDays: number;
  done: boolean;
}

const STORAGE_KEY = 'vitago_mobile_user_meds';
const NO_MEDS_KEY = 'vitago_mobile_has_no_meds';

export default function MedicinesScreen() {
  const [meds, setMeds] = useState<MobileMedication[]>([]);
  const [hasNoMeds, setHasNoMeds] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [condition, setCondition] = useState('');
  const [drugName, setDrugName] = useState('');
  const [dose, setDose] = useState('1 tabletka');
  const [timesPerDay, setTimesPerDay] = useState(2);
  const [time, setTime] = useState('08:00');
  const [durationDays, setDurationDays] = useState(7);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) setMeds(JSON.parse(data));
    });
    AsyncStorage.getItem(NO_MEDS_KEY).then((val) => {
      setHasNoMeds(val === 'true');
    });
  }, []);

  const saveMeds = async (updated: MobileMedication[]) => {
    setMeds(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAddMed = async () => {
    if (!drugName.trim()) {
      Alert.alert('Xatolik', 'Iltimos, dori nomini kiriting');
      return;
    }
    const newMed: MobileMedication = {
      id: String(Date.now()),
      condition: condition.trim() || 'Umumiy salomatlik',
      drugName: drugName.trim(),
      dose: dose.trim() || '1 tabletka',
      timesPerDay,
      time,
      durationDays,
      done: false,
    };
    const next = [...meds, newMed];
    await saveMeds(next);
    setHasNoMeds(false);
    await AsyncStorage.removeItem(NO_MEDS_KEY);

    setDrugName('');
    setCondition('');
    setModalVisible(false);
  };

  const toggleDone = async (id: string) => {
    const next = meds.map((m) => (m.id === id ? { ...m, done: !m.done } : m));
    await saveMeds(next);
  };

  const handleDelete = async (id: string) => {
    const next = meds.filter((m) => m.id !== id);
    await saveMeds(next);
  };

  const handleSetNoMeds = async () => {
    setHasNoMeds(true);
    await saveMeds([]);
    await AsyncStorage.setItem(NO_MEDS_KEY, 'true');
  };

  const nextMed = meds.find((m) => !m.done) || meds[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner */}
      {meds.length > 0 ? (
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Bell size={20} color="#FDE047" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerSub}>Keyingi qabul vaqti</Text>
            <Text style={styles.bannerTitle}>
              {nextMed ? `${nextMed.drugName} • ${nextMed.time}` : 'Barcha dorilar ichildi!'}
            </Text>
          </View>
          <TouchableOpacity style={styles.addMiniBtn} onPress={() => setModalVisible(true)}>
            <Plus size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Main Content */}
      {meds.length > 0 ? (
        <View style={styles.listSection}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Bugungi qabul rejasi</Text>
            <Text style={styles.counterBadge}>
              {meds.filter((m) => m.done).length} / {meds.length} ichildi
            </Text>
          </View>

          {meds.map((m) => (
            <View key={m.id} style={[styles.medCard, m.done && styles.medCardDone]}>
              <TouchableOpacity
                style={styles.medCardContent}
                onPress={() => toggleDone(m.id)}
              >
                <View
                  style={[
                    styles.medIconBox,
                    m.done ? { backgroundColor: '#10B981' } : { backgroundColor: '#EFF6FF' },
                  ]}
                >
                  <Pill size={20} color={m.done ? '#FFFFFF' : '#2563EB'} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.row}>
                    <Text style={[styles.medTitle, m.done && styles.medTitleDone]}>
                      {m.drugName}
                    </Text>
                    <Text style={styles.conditionBadge}>{m.condition}</Text>
                  </View>
                  <Text style={styles.medSub}>
                    {m.dose} • {m.timesPerDay} mahal • {m.time}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(m.id)}
              >
                <Trash2 size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addBigBtn}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={18} color="#2563EB" />
            <Text style={styles.addBigBtnText}>Yana dori qo'shish</Text>
          </TouchableOpacity>
        </View>
      ) : hasNoMeds ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyShield}>
            <ShieldCheck size={36} color="#059669" />
          </View>
          <Text style={styles.emptyTitle}>Ichadigan dorilarim yo'q</Text>
          <Text style={styles.emptyDesc}>
            Sizda hozircha doimiy ichiladigan dorilar belgilanmagan. Tanangiz sog'lom va tetik holatda!
          </Text>
          <TouchableOpacity
            style={styles.addBigBtn}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={18} color="#2563EB" />
            <Text style={styles.addBigBtnText}>Zarurat bo'lsa dori qo'shish</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={[styles.emptyShield, { backgroundColor: '#EFF6FF' }]}>
            <Pill size={36} color="#2563EB" />
          </View>
          <Text style={styles.emptyTitle}>Dorilar va kasalliklar grafigi</Text>
          <Text style={styles.emptyDesc}>
            Biron kasallik (masalan, qon bosimi, shamollash) yoki doimiy ichadigan dorilaringiz bormi?
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Dorilarni kiritish</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleSetNoMeds}
          >
            <CheckCircle2 size={18} color="#059669" />
            <Text style={styles.secondaryBtnText}>Ichadigan dorilarim yo'q</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dori va kasallik qo'shish</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Kasallik yoki sabab</Text>
            <TextInput
              style={styles.input}
              placeholder="Masalan: Shamollash, Qon bosimi..."
              placeholderTextColor="#94A3B8"
              value={condition}
              onChangeText={setCondition}
            />

            <Text style={styles.label}>Dori nomi *</Text>
            <TextInput
              style={styles.input}
              placeholder="Masalan: Paratsetamol, Kardiomagnil..."
              placeholderTextColor="#94A3B8"
              value={drugName}
              onChangeText={setDrugName}
            />

            <View style={styles.rowGap}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Doza</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1 tabletka"
                  placeholderTextColor="#94A3B8"
                  value={dose}
                  onChangeText={setDose}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Vaqti</Text>
                <TextInput
                  style={styles.input}
                  placeholder="08:00"
                  placeholderTextColor="#94A3B8"
                  value={time}
                  onChangeText={setTime}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddMed}>
              <Text style={styles.submitBtnText}>Saqlash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#BFDBFE',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  addMiniBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSection: {
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  counterBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medCardDone: {
    opacity: 0.6,
    backgroundColor: '#F8FAFC',
  },
  medCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  medIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  medTitleDone: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  conditionBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  medSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 8,
  },
  addBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
    marginTop: 8,
  },
  addBigBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyShield: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
    maxWidth: 280,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    width: '100%',
    height: 48,
    borderRadius: 16,
    gap: 6,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    width: '100%',
    height: 48,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  secondaryBtnText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
  },
  rowGap: {
    flexDirection: 'row',
    gap: 10,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
