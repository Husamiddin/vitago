import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'lucide-react-native' ? require('react-native') : null;
import { useRouter } from 'expo-router';
import { Colors } from '../../theme/colors';
import { verifySyncCode } from '../../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [syncCode, setSyncCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async () => {
    if (!syncCode.trim() || syncCode.trim().length !== 6) {
      Alert.alert('Xatolik', 'Iltimos, Telegram botdan olingan 6 xonali kodni to`liq kiriting.');
      return;
    }
    setLoading(true);
    try {
      await verifySyncCode(syncCode.trim());
      Alert.alert('Muvaffaqiyatli', 'Telegram profilingiz ilovaga muvaffaqiyatli ulandi!');
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Ulanish xatosi', err.message || 'Kodni tasdiqlab bo`lmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.logoTitle}>VitaGo</Text>
          <Text style={styles.subTitle}>Telegram Bot orqali tezkor kirish</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.instructionTitle}>1. Telegram botga kiring</Text>
          <Text style={styles.instructionDesc}>
            Telegramda @vitago_robot botiga kiring va /kod buyrug'ini yuboring.
          </Text>

          <Text style={[styles.instructionTitle, { marginTop: 16 }]}>2. 6 xonali kodni kiriting</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={6}
            value={syncCode}
            onChangeText={setSyncCode}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            disabled={loading}
            onPress={handleVerifyCode}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnText}>Tasdiqlash va Kirish ➔</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.guestBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.guestText}>Mehmon rejimida davom etish</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  instructionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 8,
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 20,
  },
  btn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  guestBtn: {
    alignItems: 'center',
    marginTop: 24,
    padding: 12,
  },
  guestText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
});
