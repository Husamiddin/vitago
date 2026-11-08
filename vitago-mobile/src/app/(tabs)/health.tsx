import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Heart,
  Moon,
  Sparkles,
  Bot,
  AlarmClock,
  Utensils,
  ChevronRight,
  Sun,
  ShieldCheck,
} from 'lucide-react-native';

export default function HealthScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Period Selector */}
      <View style={styles.pillRow}>
        {(['today', 'week', 'month'] as const).map((p) => {
          const labels = { today: 'Bugun', week: 'Hafta', month: 'Oy' };
          const active = period === p;
          return (
            <TouchableOpacity
              key={p}
              style={[styles.pillBtn, active && styles.pillBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.pillBtnText, active && styles.pillBtnTextActive]}>
                {labels[p]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Health Score 98 Yaxshi */}
      <View style={styles.scoreCard}>
        <View style={styles.circleGauge}>
          <View style={styles.heartBox}>
            <Heart size={18} color="#F43F5E" fill="#F43F5E" />
          </View>
          <Text style={styles.scoreNumber}>98</Text>
          <Text style={styles.scoreStatus}>Yaxshi</Text>
        </View>
        <Text style={styles.scoreDesc}>
          Barcha fiziologik va uyqu ko'rsatkichlaringiz xavfsiz va barqaror diapazonda
        </Text>
      </View>

      {/* 3. Real Uyqu (Sleep) Monitoring Card */}
      <View style={styles.sleepCard}>
        <View style={styles.sleepHeader}>
          <View style={styles.row}>
            <View style={styles.moonBox}>
              <Moon size={20} color="#C4B5FD" fill="#C4B5FD" />
            </View>
            <View>
              <View style={styles.row}>
                <Text style={styles.sleepTitle}>Uyqu Monitoringi</Text>
                <Text style={styles.qualityPill}>89% Chuqur</Text>
              </View>
              <Text style={styles.sleepSub}>Tungi tiklanish va gormonal muvozanat</Text>
            </View>
          </View>
        </View>

        <View style={styles.sleepGrid}>
          <View style={styles.sleepCol}>
            <Text style={styles.sleepColLabel}>DAVOMIYLIGI</Text>
            <Text style={styles.sleepColVal}>7h 48m</Text>
            <Text style={styles.sleepColSub}>Me'yorda (7-9h)</Text>
          </View>
          <View style={styles.sleepCol}>
            <Text style={styles.sleepColLabel}>UXLASH</Text>
            <Text style={styles.sleepColVal}>23:30</Text>
            <Text style={styles.sleepColSub}>Rejim bo'yicha</Text>
          </View>
          <View style={styles.sleepCol}>
            <Text style={styles.sleepColLabel}>UYG'ONISH</Text>
            <Text style={styles.sleepColVal}>07:18</Text>
            <Text style={styles.sleepColSub}>Tetiklangan</Text>
          </View>
        </View>
      </View>

      {/* 4. Weekly Sleep Hours Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.row}>
            <Moon size={16} color="#6366F1" />
            <Text style={styles.chartTitle}>Uyqu grafigi (haftalik)</Text>
          </View>
          <Text style={styles.chartAverage}>O'rtacha 7.9h / kun</Text>
        </View>

        <View style={styles.barsRow}>
          {[
            { day: 'Du', h: '7.5h', p: 75 },
            { day: 'Se', h: '8.0h', p: 80 },
            { day: 'Ch', h: '7.2h', p: 72 },
            { day: 'Pa', h: '8.2h', p: 82 },
            { day: 'Ju', h: '7.8h', p: 78 },
            { day: 'Sh', h: '8.5h', p: 85 },
            { day: 'Ya', h: '8.0h', p: 80 },
          ].map((item, idx) => (
            <View key={idx} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${item.p}%` }]} />
              </View>
              <Text style={styles.barVal}>{item.h}</Text>
              <Text style={styles.barDay}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 5. Health Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>Premium & Ultra Imkoniyatlar</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/pharmacy-ai')}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#10B981' }]}>
            <Bot size={22} color="#FFFFFF" />
          </View>
          <View style={styles.actionInfo}>
            <View style={styles.row}>
              <Text style={styles.actionTitle}>24/7 AI Farmatsevt</Text>
              <Text style={styles.badgePremium}>Premium</Text>
            </View>
            <Text style={styles.actionDesc}>
              Dori mosligi, doza va nojo'ya ta'sirlarni tahlil qilish
            </Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/alarm')}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#8B5CF6' }]}>
            <AlarmClock size={22} color="#FFFFFF" />
          </View>
          <View style={styles.actionInfo}>
            <View style={styles.row}>
              <Text style={styles.actionTitle}>Aqlli Budilnik & Missiyalar</Text>
              <Text style={styles.badgeUltra}>⚡ Ultra</Text>
            </View>
            <Text style={styles.actionDesc}>
              O'chirib bo'lmaydigan matematik va kamera missiyalari
            </Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>
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
    paddingTop: 52,
    paddingBottom: 40,
  },
  pillRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pillBtnActive: {
    backgroundColor: '#2563EB',
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  pillBtnTextActive: {
    color: '#FFFFFF',
  },
  scoreCard: {
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
    marginBottom: 20,
  },
  circleGauge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heartBox: {
    marginBottom: 2,
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  scoreStatus: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  scoreDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
    maxWidth: 280,
    lineHeight: 18,
  },
  sleepCard: {
    backgroundColor: '#312E81',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
    marginBottom: 20,
  },
  sleepHeader: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moonBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sleepSub: {
    fontSize: 11,
    color: '#C7D2FE',
    marginTop: 2,
  },
  qualityPill: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0E7FF',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sleepGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  sleepCol: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sleepColLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A5B4FC',
    marginBottom: 4,
  },
  sleepColVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sleepColSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#86EFAC',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  chartAverage: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
  },
  barsRow: {
    flexDirection: 'row',
    height: 120,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: 14,
    height: 80,
    backgroundColor: '#EEF2FF',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    backgroundColor: '#6366F1',
    borderRadius: 7,
    width: '100%',
  },
  barVal: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  barDay: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  featuresSection: {
    gap: 10,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  badgePremium: {
    fontSize: 9,
    fontWeight: '900',
    color: '#065F46',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    textTransform: 'uppercase',
  },
  badgeUltra: {
    fontSize: 9,
    fontWeight: '900',
    color: '#6B21A8',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    textTransform: 'uppercase',
  },
});
