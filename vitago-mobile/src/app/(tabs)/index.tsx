import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Footprints,
  Flame,
  HeartPulse,
  Dumbbell,
  Pill,
  BarChart3,
  Sparkles,
  Bot,
  AlarmClock,
  Utensils,
  ChevronRight,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchUserProfile, getSavedToken, MobileUserProfile } from '../../services/api';

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<MobileUserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const token = await getSavedToken();
    if (token) {
      try {
        const u = await fetchUserProfile(token);
        setUser(u);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const steps = user?.daily_steps ?? 0;
  const targetSteps = user?.daily_target_steps || 10000;
  const percent = targetSteps > 0 ? Math.min(100, Math.round((steps / targetSteps) * 100)) : 0;
  const streak = user?.streak_count ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 1. Header with Greeting and Streak */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Salom, {user?.first_name || 'Foydalanuvchi'}! 👋</Text>
          <Text style={styles.subGreeting}>Bugungi kun uchun tayyor tavsiyalar</Text>
        </View>
        <View style={styles.streakBadge}>
          <Flame size={16} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.streakText}>{streak} kun</Text>
        </View>
      </View>

      {/* 2. Apple Activity Ring Card */}
      <View style={styles.activityCard}>
        <View style={styles.cardHeader}>
          <View style={styles.row}>
            <Footprints size={16} color="#93C5FD" />
            <Text style={styles.cardTag}>BUGUNGI FAOLIYAT</Text>
          </View>
          <Text style={styles.percentBadge}>{percent}% bajarildi</Text>
        </View>

        <View style={styles.stepsRow}>
          <View>
            <View style={styles.rowAlign}>
              <Text style={styles.stepsBig}>{steps.toLocaleString()}</Text>
              <Text style={styles.stepsTarget}>/{targetSteps.toLocaleString()}</Text>
            </View>
            <Text style={styles.stepsSub}>qadam bosib o'tildi</Text>
          </View>

          <TouchableOpacity
            style={styles.sportMiniBtn}
            onPress={() => router.push('/(tabs)/sport')}
          >
            <Dumbbell size={18} color="#FFFFFF" />
            <Text style={styles.sportMiniBtnText}>Yugurish</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${percent}%` }]} />
        </View>
      </View>

      {/* 3. 4 Action Grid */}
      <View style={styles.grid4}>
        <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/sport')}>
          <View style={[styles.gridIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Dumbbell size={20} color="#2563EB" />
          </View>
          <Text style={styles.gridLabel}>Sport</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/health')}>
          <View style={[styles.gridIconBox, { backgroundColor: '#ECFDF5' }]}>
            <HeartPulse size={20} color="#10B981" />
          </View>
          <Text style={styles.gridLabel}>Sog'liq</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/medicines')}>
          <View style={[styles.gridIconBox, { backgroundColor: '#F5F3FF' }]}>
            <Pill size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.gridLabel}>Dorilar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/statistics')}>
          <View style={[styles.gridIconBox, { backgroundColor: '#FFFBEB' }]}>
            <BarChart3 size={20} color="#F59E0B" />
          </View>
          <Text style={styles.gridLabel}>Statistika</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Smart AI Capabilities Shortcuts */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Barcha imkoniyatlar</Text>
      </View>

      <TouchableOpacity
        style={styles.featureCard}
        onPress={() => router.push('/pharmacy-ai')}
      >
        <View style={[styles.featureIconBox, { backgroundColor: '#10B981' }]}>
          <Bot size={22} color="#FFFFFF" />
        </View>
        <View style={styles.featureInfo}>
          <View style={styles.row}>
            <Text style={styles.featureTitle}>24/7 AI Farmatsevt</Text>
            <Text style={styles.pillPremium}>Premium</Text>
          </View>
          <Text style={styles.featureDesc}>
            Dori mosligi, nojo'ya ta'sirlari va shaxsiy tavsiyalar
          </Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.featureCard}
        onPress={() => router.push('/alarm')}
      >
        <View style={[styles.featureIconBox, { backgroundColor: '#8B5CF6' }]}>
          <AlarmClock size={22} color="#FFFFFF" />
        </View>
        <View style={styles.featureInfo}>
          <View style={styles.row}>
            <Text style={styles.featureTitle}>Aqlli Budilnik & Missiyalar</Text>
            <Text style={styles.pillUltra}>⚡ Ultra</Text>
          </View>
          <Text style={styles.featureDesc}>
            Matematik va foto missiyali o'chmaydigan budilnik
          </Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.featureCard}
        onPress={() => router.push('/nutrition')}
      >
        <View style={[styles.featureIconBox, { backgroundColor: '#F97316' }]}>
          <Utensils size={22} color="#FFFFFF" />
        </View>
        <View style={styles.featureInfo}>
          <View style={styles.row}>
            <Text style={styles.featureTitle}>AI Ovqatlanish & Kaloriya</Text>
            <Text style={styles.pillUltra}>Ultra</Text>
          </View>
          <Text style={styles.featureDesc}>
            Taom suratidan oqsil, uglevod va kaloriyani bir zumda aniqlang
          </Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>
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
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-y-1',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subGreeting: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B45309',
  },
  activityCard: {
    backgroundColor: '#1E40AF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  cardTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  percentBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  stepsBig: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  stepsTarget: {
    fontSize: 14,
    fontWeight: '700',
    color: '#93C5FD',
  },
  stepsSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#BFDBFE',
    marginTop: 2,
  },
  sportMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  sportMiniBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 4,
  },
  grid4: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 12,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  featureDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  pillPremium: {
    fontSize: 9,
    fontWeight: '900',
    color: '#065F46',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    textTransform: 'uppercase',
  },
  pillUltra: {
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
