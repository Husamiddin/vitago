import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Footprints, Flame, Clock, Moon } from 'lucide-react-native';

export default function StatisticsScreen() {
  const [filter, setFilter] = useState<'week' | 'month' | 'year'>('week');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {(['week', 'month', 'year'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.tabBtn, filter === f && styles.tabBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.tabBtnText, filter === f && styles.tabBtnTextActive]}>
              {f === 'week' ? 'Hafta' : f === 'month' ? 'Oy' : 'Yil'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Metrics */}
      <View style={styles.statsCard}>
        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>12.5 km</Text>
            <Text style={styles.statLabel}>Masofa</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>820 kkal</Text>
            <Text style={styles.statLabel}>Kaloriya</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>2h 15m</Text>
            <Text style={styles.statLabel}>Vaqt</Text>
          </View>
        </View>

        {/* Weekly Bar Chart */}
        <View style={styles.barChartContainer}>
          {[
            { day: 'Du', val: 55 },
            { day: 'Se', val: 78 },
            { day: 'Ch', val: 92 },
            { day: 'Pa', val: 40 },
            { day: 'Ju', val: 85 },
            { day: 'Sh', val: 100 },
            { day: 'Ya', val: 65 },
          ].map((bar, i) => (
            <View key={i} style={styles.barItem}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${bar.val}%` }]} />
              </View>
              <Text style={styles.barDayText}>{bar.day}</Text>
            </View>
          ))}
        </View>
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#2563EB',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  barChartContainer: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: 18,
    height: 100,
    backgroundColor: '#EFF6FF',
    borderRadius: 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 9,
  },
  barDayText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
});
