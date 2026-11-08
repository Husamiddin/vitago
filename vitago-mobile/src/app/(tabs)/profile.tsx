import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  ShieldCheck,
  Globe,
  Bell,
  Scale,
  LogOut,
  Send,
  ChevronRight,
  Flame,
} from 'lucide-react-native';
import { clearAuth, fetchUserProfile, getSavedToken, MobileUserProfile } from '../../services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<MobileUserProfile | null>(null);

  useEffect(() => {
    getSavedToken().then((token) => {
      if (token) {
        fetchUserProfile(token).then(setUser).catch(() => {});
      }
    });
  }, []);

  const handleLogout = () => {
    Alert.alert('Hisobdan chiqish', 'Hisobingizdan chiqib, mehmon rejimiga o`tasizmi?', [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: 'Chiqish',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          setUser(null);
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleOpenLegal = (title: string, content: string) => {
    Alert.alert(title, content, [{ text: 'Tushunarli' }]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <User size={36} color="#2563EB" />
        </View>
        <Text style={styles.userName}>{user?.first_name || 'Mehmon'}</Text>
        <Text style={styles.userPhone}>{user?.phone || 'Telegram bot orqali ulanmagan'}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>
              {user?.plan === 'ultra' ? '⚡ Ultra' : user?.plan === 'premium' ? '⭐ Premium' : 'Standart'}
            </Text>
          </View>
          <View style={styles.streakBadge}>
            <Flame size={14} color="#EA580C" fill="#EA580C" />
            <Text style={styles.streakText}>{user?.streak_count || 0} kun streak</Text>
          </View>
        </View>
      </View>

      {/* 2. Telegram Bot Sync Banner */}
      {!user ? (
        <TouchableOpacity
          style={styles.tgSyncCard}
          onPress={() => router.push('/(auth)/login')}
        >
          <View style={styles.tgIconBox}>
            <Send size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tgSyncTitle}>Telegram bot bilan ulash</Text>
            <Text style={styles.tgSyncSub}>
              @vitago_robot orqali 6 xonali kod olib akkauntingizni sinxron qiling
            </Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>
      ) : null}

      {/* 3. Settings & Legal Section */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>SOZLAMALAR VA HUQUQLAR</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            handleOpenLegal(
              'Huquqlar & Foydalanish shartlari',
              'VitaGo platformasining rasmiy foydalanuvchi ofertasi. Barcha xizmatlar YaTT GULNOZA QULDASHEVA KOMILOVNA tomonidan kafolatlangan va qonuniy asosda taqdim etiladi.'
            )
          }
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
            <Scale size={18} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemTitle}>Huquqlar & Shartlar (Oferta)</Text>
            <Text style={styles.menuItemSub}>Foydalanish qoidalari va xavfsizlik</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            handleOpenLegal(
              'Maxfiylik siyosati',
              'Sizning sog`liq, GPS marshrut va tibbiy retsept ma`lumotlaringiz shifrlangan holda saqlanadi va uchinchi shaxslarga hech qachon berilmaydi.'
            )
          }
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
            <ShieldCheck size={18} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemTitle}>Maxfiylik siyosati (Privacy)</Text>
            <Text style={styles.menuItemSub}>Shaxsiy ma`lumotlar himoyasi</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            handleOpenLegal(
              '100% Pulni qaytarish kafolati',
              'Agar xizmat ta`riflanganidek ishlamasa, 14 kun ichida murojaat qilsangiz, to`langan mablag` to`liq qaytariladi.'
            )
          }
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
            <ShieldCheck size={18} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemTitle}>Pulni qaytarish kafolati (Refund)</Text>
            <Text style={styles.menuItemSub}>14 kunlik 100% kafolat</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* 4. Logout / Login */}
      {user ? (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#E11D48" />
          <Text style={styles.logoutText}>Hisobdan chiqish</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginBtnText}>Kirish yoki Ro'yxatdan o'tish</Text>
        </TouchableOpacity>
      )}

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 VitaGo.uz • Versiya 1.0.0</Text>
        <Text style={styles.footerSub}>YaTT GULNOZA QULDASHEVA KOMILOVNA</Text>
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
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  userPhone: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  planBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2563EB',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B45309',
  },
  tgSyncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginBottom: 20,
  },
  tgIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tgSyncTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  tgSyncSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  menuSectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  menuItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    height: 50,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  logoutText: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: '800',
  },
  loginBtn: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  footerSub: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2,
  },
});
