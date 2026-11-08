import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Utensils, Sparkles, CheckCircle2, Flame } from 'lucide-react-native';

export default function NutritionScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ruxsat kerak', 'Taom suratini olish uchun kamera ruxsati kerak.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets[0].uri) {
      setImage(res.assets[0].uri);
      analyzeFood();
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets[0].uri) {
      setImage(res.assets[0].uri);
      analyzeFood();
    }
  };

  const analyzeFood = () => {
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        name: 'Tovuqli salat va sabzavotlar',
        calories: 380,
        protein: 34,
        carbs: 18,
        fat: 12,
        healthTip: 'Oqsilga boy, mashg`ulotdan keyingi mushak tiklanishi uchun juda maqbul!',
      });
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Daily Calorie Gauge */}
      <View style={styles.dailyCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Bugungi kaloriya hisobi</Text>
          <Text style={styles.badgeKcal}>850 / 2,000 kkal</Text>
        </View>

        <View style={styles.track}>
          <View style={[styles.bar, { width: '42.5%' }]} />
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroVal}>48g</Text>
            <Text style={styles.macroLabel}>Oqsil</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroVal}>22g</Text>
            <Text style={styles.macroLabel}>Yog'</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroVal}>110g</Text>
            <Text style={styles.macroLabel}>Uglevod</Text>
          </View>
        </View>
      </View>

      {/* Camera Capture Section */}
      <View style={styles.scanCard}>
        <Text style={styles.scanTitle}>Taomni suratga oling</Text>
        <Text style={styles.scanDesc}>
          AI fotosurat orqali taom tarkibini aniqlaydi va kaloriyasini hisoblaydi
        </Text>

        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholderBox}>
            <Utensils size={40} color="#94A3B8" />
          </View>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
            <Camera size={18} color="#FFFFFF" />
            <Text style={styles.btnText}>Kamera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
            <Text style={styles.galleryBtnText}>Galereyadan</Text>
          </TouchableOpacity>
        </View>

        {analyzing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>AI taomni tahlil qilmoqda...</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultBox}>
            <View style={styles.row}>
              <CheckCircle2 size={18} color="#059669" />
              <Text style={styles.resultName}>{result.name}</Text>
            </View>

            <View style={styles.resultMacros}>
              <Text style={styles.resultKcal}>{result.calories} kkal</Text>
              <Text style={styles.resultSub}>
                Oqsil: {result.protein}g • Yog': {result.fat}g • Uglevod: {result.carbs}g
              </Text>
            </View>

            <Text style={styles.resultTip}>💡 {result.healthTip}</Text>
          </View>
        )}
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
  dailyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  badgeKcal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  track: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 5,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  scanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  scanDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  placeholderBox: {
    width: '100%',
    height: 160,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 16,
    gap: 6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  galleryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: 16,
  },
  galleryBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  loadingText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
  resultBox: {
    width: '100%',
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 16,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#065F46',
  },
  resultMacros: {
    marginTop: 6,
    marginBottom: 8,
  },
  resultKcal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#047857',
  },
  resultSub: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 2,
    fontWeight: '600',
  },
  resultTip: {
    fontSize: 11,
    color: '#065F46',
    lineHeight: 16,
    fontWeight: '600',
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
    paddingTop: 8,
  },
});
