import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Sparkles,
  Check,
  ShieldCheck,
  Lock,
  Zap,
} from 'lucide-react-native';

export default function PlansScreen() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = (planName: string, price: string) => {
    Alert.alert(
      `${planName} obunasi`,
      `Tanlangan tarif: ${planName} (${price})\nTo'lov tizimi orqali to'lov sahifasiga o'tasizmi?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'To`lov qilish (Payme / Click)', onPress: () => Alert.alert('To`lov', 'To`lov shlyuzi ochilmoqda...') },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tariflar va Imkoniyatlar</Text>
        <Text style={styles.headerSub}>
          O'zingizga mos salomatlik va sport rejasini tanlang
        </Text>
      </View>

      {/* Cycle Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, billingCycle === 'monthly' && styles.toggleBtnActive]}
          onPress={() => setBillingCycle('monthly')}
        >
          <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>
            Oylik
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, billingCycle === 'yearly' && styles.toggleBtnActive]}
          onPress={() => setBillingCycle('yearly')}
        >
          <View style={styles.row}>
            <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.toggleTextActive]}>
              Yillik
            </Text>
            <Text style={styles.discountBadge}>-30 000 so'm Chegirma</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 1. PREMIUM PLAN (15 000 UZS / 150 000 UZS) */}
      <View style={styles.planCard}>
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>TAVSIYA ETILADI</Text>
        </View>

        <Text style={styles.planTitle}>Premium</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceNumber}>
            {billingCycle === 'monthly' ? '15 000' : '150 000'}
          </Text>
          <Text style={styles.priceUnit}>
            so'm / {billingCycle === 'monthly' ? 'oy' : 'yil'}
          </Text>
        </View>

        <View style={styles.featuresList}>
          {[
            'Cheksiz AI retsept skaneri',
            '24/7 AI Farmatsevt konsultatsiyasi',
            'Shaxsiy kunlik salomatlik rejasi',
            'Oila a`zolari profili',
            'Kunlik qadamlar va Olovcha (streak) hisobi',
          ].map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.checkCircle}>
                <Check size={12} color="#2563EB" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.planBtnPrimary}
          onPress={() =>
            handleSubscribe(
              'Premium',
              billingCycle === 'monthly' ? '15 000 so`m/oy' : '150 000 so`m/yil'
            )
          }
        >
          <Text style={styles.planBtnPrimaryText}>Premium boshlash ➔</Text>
        </TouchableOpacity>
      </View>

      {/* 2. ULTRA PLAN (40 000 UZS / 450 000 UZS) */}
      <View style={[styles.planCard, styles.ultraCard]}>
        <View style={[styles.planBadge, styles.ultraBadge]}>
          <Text style={styles.ultraBadgeText}>MAKSIMAL IMKONIYAT</Text>
        </View>

        <View style={styles.row}>
          <Zap size={22} color="#F59E0B" fill="#F59E0B" />
          <Text style={[styles.planTitle, { color: '#0F172A' }]}>Ultra</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceNumber}>
            {billingCycle === 'monthly' ? '40 000' : '450 000'}
          </Text>
          <Text style={styles.priceUnit}>
            so'm / {billingCycle === 'monthly' ? 'oy' : 'yil'}
          </Text>
        </View>

        <View style={styles.featuresList}>
          {[
            'Barcha Premium imkoniyatlari',
            'Aqlli Budilnik & Matematik missiya',
            'Taom suratidan kaloriya tahlili',
            'Sport GPS & Jonli marshrut navigatori',
            'Guruhlar, musobaqalar va yugurish klublari',
            'Tezkor VIP texnik yordam',
          ].map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={[styles.checkCircle, { backgroundColor: '#FEF3C7' }]}>
                <Check size={12} color="#D97706" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.ultraBtn}
          onPress={() =>
            handleSubscribe(
              'Ultra',
              billingCycle === 'monthly' ? '40 000 so`m/oy' : '450 000 so`m/yil'
            )
          }
        >
          <Text style={styles.ultraBtnText}>⚡ Ultra ga ulanish</Text>
        </TouchableOpacity>
      </View>

      {/* Refund Guarantee */}
      <View style={styles.guaranteeBox}>
        <ShieldCheck size={22} color="#059669" />
        <View style={{ flex: 1 }}>
          <Text style={styles.guaranteeTitle}>100% Pulni qaytarish kafolati</Text>
          <Text style={styles.guaranteeDesc}>
            Agar ilova ko'rsatilgandek ishlamasa, 14 kun ichida to'lovingiz so'rovsiz 100% qaytarib beriladi.
          </Text>
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
    paddingTop: 52,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#2563EB',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discountBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  ultraCard: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  planBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ultraBadge: {
    backgroundColor: '#D97706',
  },
  ultraBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 16,
    gap: 4,
  },
  priceNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
  },
  priceUnit: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  featuresList: {
    gap: 10,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  planBtnPrimary: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  ultraBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ultraBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  guaranteeBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
  },
  guaranteeTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#065F46',
  },
  guaranteeDesc: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
});
