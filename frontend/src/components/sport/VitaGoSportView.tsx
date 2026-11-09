import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Home,
  MapPin,
  Disc,
  Users,
  User as UserIcon,
  Search,
  MessageCircle,
  Bell,
  ChevronRight,
  Zap,
  Lock,
  Play,
  Square,
  Navigation,
  X,
  Check,
  Award,
  Flame,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Send,
  Utensils,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import type { SupportedLang, UserProfile } from '../../types/api';
import { SportTrackerManager, isValidWorkout, type SportTrackerState } from '../../services/sportTracker';
import { AIWorkoutModal } from './AIWorkoutModal';

const DEFAULT_API_BASE =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'doriscan.vercel.app')
    ? '/api/v1'
    : 'https://doriscan.vercel.app/api/v1';

export type SportBottomTab = 'home' | 'maps' | 'record' | 'groups' | 'you';

export type SportTypeId =
  | 'run'
  | 'trail_run'
  | 'walk'
  | 'hike'
  | 'ride'
  | 'mtb_ride'
  | 'gravel_ride';

export interface SportCategoryOption {
  id: SportTypeId;
  group: 'foot' | 'cycle';
  speedKmh: number;
  kcalPerKgKm: number;
  elevKcalPerM: number;
  names: Record<SupportedLang, string>;
}

export const SPORT_OPTIONS: SportCategoryOption[] = [
  {
    id: 'run',
    group: 'foot',
    speedKmh: 10.5,
    kcalPerKgKm: 1.08,
    elevKcalPerM: 0.12,
    names: {
      uz: 'Yugurish',
      uz_cyrl: 'Югуриш',
      ru: 'Бег',
    },
  },
  {
    id: 'trail_run',
    group: 'foot',
    speedKmh: 8.5,
    kcalPerKgKm: 1.32,
    elevKcalPerM: 0.18,
    names: {
      uz: "Tog'da yugurish (Trail)",
      uz_cyrl: 'Тоғда югуриш (Trail)',
      ru: 'Трейлраннинг',
    },
  },
  {
    id: 'walk',
    group: 'foot',
    speedKmh: 5.0,
    kcalPerKgKm: 0.62,
    elevKcalPerM: 0.09,
    names: {
      uz: 'Piyoda yurish',
      uz_cyrl: 'Пиёда юриш',
      ru: 'Ходьба',
    },
  },
  {
    id: 'hike',
    group: 'foot',
    speedKmh: 4.2,
    kcalPerKgKm: 0.95,
    elevKcalPerM: 0.16,
    names: {
      uz: "Tog' sayohati (Hike)",
      uz_cyrl: 'Тоғ саёҳати (Hike)',
      ru: 'Хайкинг (Поход)',
    },
  },
  {
    id: 'ride',
    group: 'cycle',
    speedKmh: 22.0,
    kcalPerKgKm: 0.45,
    elevKcalPerM: 0.1,
    names: {
      uz: 'Velosiped haydash',
      uz_cyrl: 'Велосипед ҳайдаш',
      ru: 'Велоспорт',
    },
  },
  {
    id: 'mtb_ride',
    group: 'cycle',
    speedKmh: 16.0,
    kcalPerKgKm: 0.82,
    elevKcalPerM: 0.15,
    names: {
      uz: "Tog' velosipedi (MTB)",
      uz_cyrl: 'Тоғ велосипеди (MTB)',
      ru: 'Горный велосипед (MTB)',
    },
  },
  {
    id: 'gravel_ride',
    group: 'cycle',
    speedKmh: 19.0,
    kcalPerKgKm: 0.64,
    elevKcalPerM: 0.12,
    names: {
      uz: "Shag'al yo'lda velosiped",
      uz_cyrl: 'Шағал йўлда велосипед',
      ru: 'Гравийный велосипед',
    },
  },
];

export interface SportActivityItem {
  id: string;
  sport_type: string;
  title: string;
  location_name: string;
  distance_km: number;
  elev_gain_m: number;
  duration_sec: number;
  calories: number;
  kudos: number;
  created_at: string;
  route_coords?: [number, number][];
}

interface SportClubItem {
  id: number;
  name: string;
  description: string;
  sport_type: string;
  location: string;
  invite_url: string;
  members_count: number;
  is_joined: boolean;
}

interface SportAthleteUser {
  id: number;
  name: string;
  avatar_data?: string | null;
  plan: string;
  daily_steps: number;
  streak_count: number;
  activities_count: number;
  total_distance_km: number;
  total_calories: number;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  sender_name: string;
  is_target_personal: boolean;
  is_read: boolean;
  created_at?: string | null;
}

export interface TetikSportViewProps {
  currentUser: UserProfile | null;
  lang: SupportedLang;
  onLangChange: (lang: SupportedLang) => void;
  onBackToMain: () => void;
  onOpenPlans: () => void;
  onOpenAIChat: () => void;
  onUserUpdated: (user: UserProfile) => void;
  onRequireAuth?: () => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

export type VitaGoSportViewProps = TetikSportViewProps;

const SPORT_I18N: Record<
  SupportedLang,
  {
    backBtn: string;
    tabHome: string;
    tabMaps: string;
    tabRecord: string;
    tabGroups: string;
    tabYou: string;
    streakTitle: string;
    viewCalendar: string;
    yourStreak: string;
    daysUnit: string;
    recordNow: string;
    noActivitiesTitle: string;
    noActivitiesDesc: string;
    startFirstWorkout: string;
    distance: string;
    elevGain: string;
    time: string;
    calories: string;
    openOnMap: string;
    filterBySport: string;
    searchSportPlaceholder: string;
    footSports: string;
    cycleSports: string;
    gpsActive: string;
    gpsSearching: string;
    gpsMandatoryTitle: string;
    gpsMandatoryDesc: string;
    gpsEnableBtn: string;
    mapTapHint: string;
    searchPlacePlaceholder: string;
    searchBtn: string;
    selectedDestination: string;
    startNavToDest: string;
    clearRoute: string;
    directionLabel: string;
    changeSportBtn: string;
    startBtn: string;
    stopAndSaveBtn: string;
    savingBtn: string;
    navActiveBanner: string;
    remainingDist: string;
    leaderboardTitle: string;
    clubsTitle: string;
    noClubsYet: string;
    joinClub: string;
    joinedClub: string;
    membersUnit: string;
    searchUsersTitle: string;
    searchUsersPlaceholder: string;
    noUsersFound: string;
    notificationsTitle: string;
    noNotifications: string;
    aiCoachTitle: string;
    aiCoachSubtitle: string;
    aiAnalyzeMyRunBtn: string;
    aiInputPlaceholder: string;
    profileTitle: string;
    stepsToday: string;
    workoutsCount: string;
    totalKm: string;
    totalKcal: string;
    calendarModalTitle: string;
    closeBtn: string;
    dayLabels: string[];
  }
> = {
  uz: {
    backBtn: 'Asosiy',
    tabHome: 'Asosiy',
    tabMaps: 'Xarita',
    tabRecord: 'Yozish',
    tabGroups: 'Guruhlar',
    tabYou: 'Profil',
    streakTitle: 'Haftalik Faollik',
    viewCalendar: "Kalendarni ko'rish",
    yourStreak: 'Ketma-ket faollik',
    daysUnit: 'Kun',
    recordNow: 'Boshlash',
    noActivitiesTitle: "Hozircha mashg'ulotlar yo'q",
    noActivitiesDesc:
      "Haqiqiy vaqtda GPS orqali yugurish, yurish yoki velosiped mashg'ulotingizni yozib oling — natijalar shu yerda chiqadi.",
    startFirstWorkout: "GPS Mashg'ulotni Boshlash",
    distance: 'Masofa',
    elevGain: 'Balandlik',
    time: 'Vaqt',
    calories: 'Kaloriya',
    openOnMap: 'GPS Xaritada ochish',
    filterBySport: "Sport yo'nalishini tanlash",
    searchSportPlaceholder: "Sport yo'nalishini qidirish...",
    footSports: 'Yugurish va Yurish sporti',
    cycleSports: "Velosport yo'nalishlari",
    gpsActive: 'GPS Faol',
    gpsSearching: 'GPS aniqlanmoqda...',
    gpsMandatoryTitle: 'Joylashuvni (GPS) yoqish majburiy!',
    gpsMandatoryDesc:
      "Tetik ⚡ Sport bo'limida real vaqtda xarita navigatori, masofa va kaloriya hisobi ishlashi uchun qurilmangizda Joylashuv (GPS) ruxsatini bir marta yoqishingiz shart.",
    gpsEnableBtn: 'Joylashuvga ruxsat berish va yoqish',
    mapTapHint: "Xaritadan boradigan manzilingiz ustiga bosing yoki yuqoridan manzil qidiring",
    searchPlacePlaceholder: "Manzil yoki ko'cha nomini yozing...",
    searchBtn: 'Topish',
    selectedDestination: 'Tanlangan manzil (Navigator)',
    startNavToDest: 'Shu manzilga yurishni boshlash',
    clearRoute: "Yo'nalishni tozalash",
    directionLabel: "Tanlangan sport yo'nalishi",
    changeSportBtn: 'Almashtirish',
    startBtn: 'Boshlash',
    stopAndSaveBtn: "To'xtatish va Saqlash",
    savingBtn: 'Saqlanmoqda...',
    navActiveBanner: "Navigator faol: Ko'k chiziq bo'ylab harakatlaning",
    remainingDist: 'Qoldi',
    leaderboardTitle: "O'zbekiston Faol Sportchilari Reytingi",
    clubsTitle: 'Rasmiy Sport Klublari',
    noClubsYet: "Hozircha admin tomonidan sport klublari qo'shilmagan.",
    joinClub: "Klubga a'zo bo'lish",
    joinedClub: "A'zo bo'lingan ✓",
    membersUnit: "a'zo",
    searchUsersTitle: 'Ultra Sport Foydalanuvchilarini Qidirish',
    searchUsersPlaceholder: 'Ism yoki familiya orqali qidiring...',
    noUsersFound: 'Foydalanuvchilar topilmadi.',
    notificationsTitle: 'Bildirishnomalar va Xabarlar',
    noNotifications: "Hozircha yangi bildirishnomalar yo'q.",
    aiCoachTitle: 'AI Sport va Ovqatlanish Murabbiyi',
    aiCoachSubtitle: "Yugurgan masofangiz va sarflagan kaloriyangizga qarab aniq ovqatlanish tahlili",
    aiAnalyzeMyRunBtn: "🍽 Yugurganimga qarab qancha ovqat yeyishim kerak?",
    aiInputPlaceholder: 'AI murabbiyga savol yozing...',
    profileTitle: 'Sportchi Profili',
    stepsToday: 'Bugungi qadamlar',
    workoutsCount: "Mashg'ulotlar",
    totalKm: 'Jami masofa',
    totalKcal: 'Jami sarflangan',
    calendarModalTitle: "Faollik va Mashg'ulotlar Kalendari",
    closeBtn: 'Yopish',
    dayLabels: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
  },
  uz_cyrl: {
    backBtn: 'Асосий',
    tabHome: 'Асосий',
    tabMaps: 'Харита',
    tabRecord: 'Ёзиш',
    tabGroups: 'Гуруҳлар',
    tabYou: 'Профиль',
    streakTitle: 'Ҳафталик Фаоллик',
    viewCalendar: 'Календарни кўриш',
    yourStreak: 'Кетма-кет фаоллик',
    daysUnit: 'Кун',
    recordNow: 'Бошлаш',
    noActivitiesTitle: 'Ҳозирча машғулотлар йўқ',
    noActivitiesDesc:
      'Ҳақиқий вақтда GPS орқали югуриш, юриш ёки велосипед машғулотингизни ёзиб олинг — натижалар шу ерда чиқади.',
    startFirstWorkout: 'GPS Машғулотни Бошлаш',
    distance: 'Масофа',
    elevGain: 'Баландлик',
    time: 'Вақт',
    calories: 'Калория',
    openOnMap: 'GPS Харитада очиш',
    filterBySport: 'Спорт йўналишини танлаш',
    searchSportPlaceholder: 'Спорт йўналишини қидириш...',
    footSports: 'Югуриш ва Юриш спорти',
    cycleSports: 'Велоспорт йўналишлари',
    gpsActive: 'GPS Фаол',
    gpsSearching: 'GPS аниқланмоқда...',
    gpsMandatoryTitle: 'Жойлашувни (GPS) ёқиш мажбурий!',
    gpsMandatoryDesc:
      'Tetik ⚡ Sport бўлимида реал вақтда харита навигатори, масофа ва калория ҳисоби ишлаши учун қурилмангизда Жойлашув (GPS) рухсатини ёқишингиз шарт.',
    gpsEnableBtn: 'Жойлашувга рухсат бериш ва ёқиш',
    mapTapHint: 'Харитадан борадиган манзилингиз устига босинг ёки юқоридан манзил қидиринг',
    searchPlacePlaceholder: 'Манзил ёки кўча номини ёзинг...',
    searchBtn: 'Топиш',
    selectedDestination: 'Танланган манзил (Навигатор)',
    startNavToDest: 'Шу манзилга юришни бошлаш',
    clearRoute: 'Йўналишни тозалаш',
    directionLabel: 'Танланган спорт йўналиши',
    changeSportBtn: 'Алмаштириш',
    startBtn: 'Бошлаш',
    stopAndSaveBtn: 'Тўхтатиш ва Сақлаш',
    savingBtn: 'Сақланмоқда...',
    navActiveBanner: 'Навигатор фаол: Кўк чизиқ бўйлаб ҳаракатланинг',
    remainingDist: 'Қолди',
    leaderboardTitle: 'Ўзбекистон Фаол Спортчилари Рейтинги',
    clubsTitle: 'Расмий Спорт Клублари',
    noClubsYet: 'Ҳозирча админ томонидан спорт клублари қўшилмаган.',
    joinClub: 'Клубга аъзо бўлиш',
    joinedClub: 'Аъзо бўлинган ✓',
    membersUnit: 'аъзо',
    searchUsersTitle: 'Ultra Спорт Фойдаланувчиларини Қидириш',
    searchUsersPlaceholder: 'Исм ёки фамилия орқали қидиринг...',
    noUsersFound: 'Фойдаланувчилар топилмади.',
    notificationsTitle: 'Билдиришномалар ва Хабарлар',
    noNotifications: 'Ҳозирча янги билдиришномалар йўқ.',
    aiCoachTitle: 'AI Спорт ва Овқатланиш Мураббийи',
    aiCoachSubtitle: 'Югурган масофангиз ва сарфлаган калориянгизга қараб аниқ овқатланиш таҳлили',
    aiAnalyzeMyRunBtn: '🍽 Югурганимга қараб қанча овқат ейишим керак?',
    aiInputPlaceholder: 'AI мураббийга савол ёзинг...',
    profileTitle: 'Спортчи Профили',
    stepsToday: 'Бугунги қадамлар',
    workoutsCount: 'Машғулотлар',
    totalKm: 'Жами масофа',
    totalKcal: 'Жами сарфланган',
    calendarModalTitle: 'Фаоллик ва Машғулотлар Календари',
    closeBtn: 'Ёпиш',
    dayLabels: ['Ду', 'Се', 'Чо', 'Па', 'Жу', 'Ша', 'Як'],
  },
  ru: {
    backBtn: 'Главная',
    tabHome: 'Главная',
    tabMaps: 'Карта',
    tabRecord: 'Запись',
    tabGroups: 'Группы',
    tabYou: 'Профиль',
    streakTitle: 'Активность за неделю',
    viewCalendar: 'Календарь',
    yourStreak: 'Дней подряд активно',
    daysUnit: 'Дн.',
    recordNow: 'Начать',
    noActivitiesTitle: 'Пока нет записанных тренировок',
    noActivitiesDesc:
      'Запишите пробежку, ходьбу или велотренировку по GPS в реальном времени — все результаты появятся здесь.',
    startFirstWorkout: 'Начать GPS тренировку',
    distance: 'Дистанция',
    elevGain: 'Высота',
    time: 'Время',
    calories: 'Калории',
    openOnMap: 'Открыть на GPS карте',
    filterBySport: 'Выбор вида спорта',
    searchSportPlaceholder: 'Поиск направления спорта...',
    footSports: 'Бег и Ходьба',
    cycleSports: 'Велоспорт',
    gpsActive: 'GPS Активен',
    gpsSearching: 'Поиск GPS...',
    gpsMandatoryTitle: 'Включение геолокации (GPS) обязательно!',
    gpsMandatoryDesc:
      'Для работы навигатора, точного замера дистанции и расхода калорий в Tetik ⚡ Sport необходимо разрешить доступ к GPS-геолокации.',
    gpsEnableBtn: 'Разрешить и включить геолокацию',
    mapTapHint: 'Нажмите на любую точку карты для построения маршрута или найдите адрес выше',
    searchPlacePlaceholder: 'Введите адрес или ориентир...',
    searchBtn: 'Найти',
    selectedDestination: 'Выбранный пункт назначения',
    startNavToDest: 'Начать движение к цели',
    clearRoute: 'Очистить маршрут',
    directionLabel: 'Выбранное направление спорта',
    changeSportBtn: 'Изменить',
    startBtn: 'Старт',
    stopAndSaveBtn: 'Стоп и Сохранить',
    savingBtn: 'Сохранение...',
    navActiveBanner: 'Навигатор активен: следуйте по маршруту',
    remainingDist: 'Осталось',
    leaderboardTitle: 'Рейтинг Спортсменов Узбекистана',
    clubsTitle: 'Официальные Спортивные Клубы',
    noClubsYet: 'Спортивные клубы пока не добавлены администратором.',
    joinClub: 'Вступить в клуб',
    joinedClub: 'Вы участник ✓',
    membersUnit: 'участн.',
    searchUsersTitle: 'Поиск Спортсменов Ultra Sport',
    searchUsersPlaceholder: 'Поиск по имени или фамилии...',
    noUsersFound: 'Пользователи не найдены.',
    notificationsTitle: 'Уведомления и Сообщения',
    noNotifications: 'Новых уведомлений пока нет.',
    aiCoachTitle: 'AI Тренер по Спорту и Питанию',
    aiCoachSubtitle: 'Точный расчет питания и калорий на основе ваших реальных пробежек',
    aiAnalyzeMyRunBtn: '🍽 Сколько и что мне нужно съесть после тренировки?',
    aiInputPlaceholder: 'Задайте вопрос AI тренеру...',
    profileTitle: 'Профиль Спортсмена',
    stepsToday: 'Шагов сегодня',
    workoutsCount: 'Тренировок',
    totalKm: 'Общая дистанция',
    totalKcal: 'Сожжено ккал',
    calendarModalTitle: 'Календарь Активности и Тренировок',
    closeBtn: 'Закрыть',
    dayLabels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  },
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDuration(sec: number, lang: SupportedLang): string {
  if (sec < 60) {
    return `${sec} ${lang === 'ru' ? 'сек' : lang === 'uz_cyrl' ? 'сон' : 'soniya'}`;
  }
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remSec = sec % 60;
  if (hrs > 0) {
    return `${hrs} ${lang === 'ru' ? 'ч' : 'soat'} ${mins} ${lang === 'ru' ? 'мин' : 'daq'}`;
  }
  return `${mins} ${lang === 'ru' ? 'мин' : 'daq'} ${remSec} ${lang === 'ru' ? 'с' : 's'}`;
}

function SportSvgIcon({ id, active }: { id: SportTypeId; active?: boolean }) {
  const color = active ? '#ea580c' : '#0f172a';
  if (id === 'ride' || id === 'mtb_ride' || id === 'gravel_ride') {
    return (
      <svg viewBox="0 0 28 24" className="w-6 h-5 shrink-0" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {id === 'mtb_ride' && <path d="M3 7l4-4 3 3 4-4 4 4" strokeWidth="1.6" />}
        <circle cx="6.5" cy="17.5" r="3.5" />
        <circle cx="21.5" cy="17.5" r="3.5" />
        <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h3" />
        {id === 'gravel_ride' && <path d="M2 22h24" strokeDasharray="2 3" />}
      </svg>
    );
  }
  if (id === 'run' || id === 'trail_run') {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-5 shrink-0" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10l4-4 6 6 5 2a3 3 0 0 1 2 3v2H9l-5-5V10z" />
        <path d="M8 14l4-4" />
        {id === 'trail_run' && <path d="M3 17l18 4" strokeWidth="2.2" />}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-5 shrink-0" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14v5h18v-2a3 3 0 0 0-2-2.8L13 12l-3-3H5l-2 5z" />
      <path d="M3 17h18" />
    </svg>
  );
}

/** High-speed multi-provider tile layer (Google Maps Uzbekistan Road Tiles + OSM fallback) */
function attachReliableTileLayer(map: L.Map) {
  const googleTiles = L.tileLayer(
    'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=uz',
    {
      maxZoom: 20,
      attribution: '© Google Maps • Tetik ⚡ Sport',
    }
  );
  googleTiles.on('tileerror', () => {
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);
  });
  googleTiles.addTo(map);
}

export const TetikSportView: React.FC<TetikSportViewProps> = ({
  currentUser,
  lang,
  onLangChange,
  onBackToMain,
  onOpenPlans,
  onUserUpdated,
  onRequireAuth,
  triggerHaptic,
}) => {
  const st = SPORT_I18N[lang];
  const isRegistered = Boolean(currentUser && currentUser.is_profile_complete);
  const userPlan = currentUser?.plan || 'standard';
  const isUltra = isRegistered && userPlan === 'ultra';
  const isPremium = isRegistered && userPlan === 'premium';
  const userWeightKg = currentUser?.weight_kg && currentUser.weight_kg > 25 ? currentUser.weight_kg : 70;

  const tracker = SportTrackerManager.getInstance();
  const [trackerState, setTrackerState] = useState<SportTrackerState>(() => tracker.getState());

  const [bottomTab, setBottomTab] = useState<SportBottomTab>(() =>
    tracker.getState().isRecording ? 'record' : 'home'
  );
  const [sportPickerOpen, setSportPickerOpen] = useState(false);
  const [sportSearch, setSportSearch] = useState('');

  // Header modals state: Search Users, AI Coach Chat, Notifications, Calendar
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [sportUsers, setSportUsers] = useState<SportAthleteUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const [aiCoachModalOpen, setAiCoachModalOpen] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Dedicated AI Workout Modal (Fitness & Yoga)
  const [aiWorkoutModalOpen, setAiWorkoutModalOpen] = useState(false);
  const [aiWorkoutType, setAiWorkoutType] = useState<'fitness' | 'yoga'>('fitness');

  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [placeQuery, setPlaceQuery] = useState('');
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [savingWorkout, setSavingWorkout] = useState(false);

  // Real Activities Feed from Railway DB
  const [activities, setActivities] = useState<SportActivityItem[]>(() => {
    if (currentUser?.sport_activities_json) {
      try {
        const parsed = JSON.parse(currentUser.sport_activities_json);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // ignore
      }
    }
    return [];
  });

  useEffect(() => {
    if (currentUser?.sport_activities_json) {
      try {
        const parsed = JSON.parse(currentUser.sport_activities_json);
        if (Array.isArray(parsed)) setActivities(parsed);
      } catch {
        // ignore
      }
    }
  }, [currentUser?.sport_activities_json]);

  // Subscribe to persistent global SportTrackerManager
  useEffect(() => {
    tracker.startGpsWatch(false);
    const unsub = tracker.subscribe((next) => {
      setTrackerState({ ...next });
    });
    return unsub;
  }, [tracker]);

  const {
    isRecording,
    elapsedSec: recordSec,
    selectedSport,
    distanceKm: recordDistKm,
    elevGainM: recordElevM,
    routeCoords: recordRoute,
    userPos,
    gpsAccuracy,
    gpsReady,
    gpsPermissionDenied,
    locationLabel,
    destPos,
    destRouteCoords,
    routeDistanceKm,
    destReached,
  } = trackerState;

  const [leaderboard, setLeaderboard] = useState<
    { rank: number; name: string; daily_steps: number; streak_count: number; distance_km: number; plan: string }[]
  >([]);
  const [clubs, setClubs] = useState<SportClubItem[]>([]);

  // Map DOM Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const recordMapContainerRef = useRef<HTMLDivElement | null>(null);
  const recordLeafletMapRef = useRef<L.Map | null>(null);
  const recordUserMarkerRef = useRef<L.Marker | null>(null);
  const recordDestMarkerRef = useRef<L.Marker | null>(null);
  const recordNavLineRef = useRef<L.Polyline | null>(null);
  const recordPolylineRef = useRef<L.Polyline | null>(null);

  const currentSportMeta = SPORT_OPTIONS.find((s) => s.id === selectedSport) || SPORT_OPTIONS[0];
  const currentSportName = currentSportMeta.names[lang];
  const kcalPerKmForUser = Math.round(currentSportMeta.kcalPerKgKm * userWeightKg);

  const liveBurnedCalories = Math.round(
    recordDistKm * currentSportMeta.kcalPerKgKm * userWeightKg +
      recordElevM * currentSportMeta.elevKcalPerM
  );

  // Fetch OSRM street route between start and destination
  const buildNavigationRoute = useCallback(
    async (start: [number, number], end: [number, number], sportId: SportTypeId) => {
      const profile = sportId.includes('ride') ? 'bike' : 'foot';
      try {
        const url = `https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.routes?.[0]?.geometry?.coordinates) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );
          const distKm = Number((data.routes[0].distance / 1000).toFixed(2));
          tracker.setDestination(end, coords, distKm);
          return;
        }
      } catch {
        // Fallback to direct line
      }
      const fallbackDist = Number(haversineKm(start[0], start[1], end[0], end[1]).toFixed(2));
      tracker.setDestination(end, [start, end], fallbackDist);
    },
    [tracker]
  );

  // Fetch Leaderboard, Real Clubs, and Notifications from Railway DB
  const fetchSportData = useCallback(() => {
    fetch(`${DEFAULT_API_BASE}/features/sport/leaderboard`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.leaderboard) setLeaderboard(d.leaderboard);
      })
      .catch(() => {});

    if (currentUser?.token) {
      fetch(`${DEFAULT_API_BASE}/features/sport/clubs`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.clubs) setClubs(d.clubs);
        })
        .catch(() => {});

      fetch(`${DEFAULT_API_BASE}/features/sport/notifications`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.notifications) setNotifications(d.notifications);
          if (typeof d?.unread_count === 'number') setUnreadNotifCount(d.unread_count);
        })
        .catch(() => {});
    }
  }, [currentUser?.token]);

  useEffect(() => {
    fetchSportData();
  }, [fetchSportData, bottomTab]);

  // ==================== MAP 1: "MAPS" TAB INITIALIZATION & CLEANUP ====================
  useEffect(() => {
    if (bottomTab !== 'maps' || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: userPos,
      zoom: 16,
      zoomControl: true,
    });

    attachReliableTileLayer(map);

    const userIcon = L.divIcon({
      className: 'vitago-svg-user-pin',
      html: `<div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:#10b981;opacity:0.25;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:relative;width:18px;height:18px;border-radius:50%;background:#10b981;border:3px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <div style="width:5px;height:5px;border-radius:50%;background:#ffffff;"></div>
        </div>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    userMarkerRef.current = L.marker(userPos, { icon: userIcon }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const clicked: [number, number] = [e.latlng.lat, e.latlng.lng];
      buildNavigationRoute(tracker.getState().userPos, clicked, tracker.getState().selectedSport);
    });

    leafletMapRef.current = map;

    const timers = [40, 180, 450].map((ms) => setTimeout(() => map.invalidateSize(), ms));
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(mapContainerRef.current);
    }

    return () => {
      timers.forEach(clearTimeout);
      ro?.disconnect();
      map.remove();
      leafletMapRef.current = null;
      userMarkerRef.current = null;
      destMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, [bottomTab, buildNavigationRoute, tracker]);

  // Sync user marker & destination route on "Maps" tab
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userPos);
    }

    if (destPos) {
      const destIcon = L.divIcon({
        className: 'vitago-svg-finish-pin',
        html: `<div style="position:relative;width:30px;height:38px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
          <svg width="30" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 11.2 14.4 20.8 15.2 21.333a1.4 1.4 0 0 0 1.6 0C17.6 36.8 32 27.2 32 16c0-8.837-7.163-16-16-16z" fill="#ef4444"/>
            <circle cx="16" cy="15" r="9" fill="#ffffff"/>
            <rect x="11.5" y="11" width="3" height="3" fill="#1e293b"/>
            <rect x="14.5" y="11" width="3" height="3" fill="#ffffff"/>
            <rect x="17.5" y="11" width="3" height="3" fill="#1e293b"/>
            <rect x="11.5" y="14" width="3" height="3" fill="#ffffff"/>
            <rect x="14.5" y="14" width="3" height="3" fill="#1e293b"/>
            <rect x="17.5" y="14" width="3" height="3" fill="#ffffff"/>
            <rect x="11.5" y="17" width="1" height="4" fill="#64748b"/>
          </svg>
        </div>`,
        iconSize: [30, 38],
        iconAnchor: [15, 38],
      });

      if (!destMarkerRef.current) {
        destMarkerRef.current = L.marker(destPos, { icon: destIcon }).addTo(map);
      } else {
        destMarkerRef.current.setLatLng(destPos);
      }

      const coordsToDraw = destRouteCoords.length >= 2 ? destRouteCoords : [userPos, destPos];
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs(coordsToDraw);
      } else {
        routeLineRef.current = L.polyline(coordsToDraw, {
          color: '#ea580c',
          weight: 5,
          opacity: 0.92,
        }).addTo(map);
      }
    } else {
      if (destMarkerRef.current) {
        map.removeLayer(destMarkerRef.current);
        destMarkerRef.current = null;
      }
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
    }
  }, [userPos, destPos, destRouteCoords, bottomTab]);

  // ==================== MAP 2: "RECORD" TAB INITIALIZATION & CLEANUP (100% FIXED!) ====================
  useEffect(() => {
    if (bottomTab !== 'record' || !recordMapContainerRef.current) return;

    const rMap = L.map(recordMapContainerRef.current, {
      center: userPos,
      zoom: 17,
      zoomControl: true,
    });

    attachReliableTileLayer(rMap);

    const uIcon = L.divIcon({
      className: 'vitago-svg-rec-user-pin',
      html: `<div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:#ea580c;opacity:0.3;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:relative;width:18px;height:18px;border-radius:50%;background:#ea580c;border:3px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <div style="width:5px;height:5px;border-radius:50%;background:#ffffff;"></div>
        </div>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    recordUserMarkerRef.current = L.marker(userPos, { icon: uIcon }).addTo(rMap);
    recordPolylineRef.current = L.polyline(recordRoute.length > 0 ? recordRoute : [userPos], {
      color: '#ea580c',
      weight: 6,
      opacity: 0.95,
    }).addTo(rMap);

    recordLeafletMapRef.current = rMap;

    const timers = [40, 180, 450, 800].map((ms) =>
      setTimeout(() => {
        rMap.invalidateSize();
        if (destPos) {
          rMap.fitBounds(L.latLngBounds([userPos, destPos]), { padding: [35, 35], maxZoom: 17 });
        } else {
          rMap.setView(userPos, 17);
        }
      }, ms)
    );

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && recordMapContainerRef.current) {
      ro = new ResizeObserver(() => rMap.invalidateSize());
      ro.observe(recordMapContainerRef.current);
    }

    return () => {
      timers.forEach(clearTimeout);
      ro?.disconnect();
      rMap.remove();
      recordLeafletMapRef.current = null;
      recordUserMarkerRef.current = null;
      recordDestMarkerRef.current = null;
      recordNavLineRef.current = null;
      recordPolylineRef.current = null;
    };
  }, [bottomTab]);

  // Sync live GPS position, recorded path, AND planned destination route on Record Map
  useEffect(() => {
    const rMap = recordLeafletMapRef.current;
    if (!rMap) return;

    if (recordUserMarkerRef.current) {
      recordUserMarkerRef.current.setLatLng(userPos);
    }
    if (recordPolylineRef.current) {
      recordPolylineRef.current.setLatLngs(recordRoute.length > 0 ? recordRoute : [userPos]);
    }
    if (isRecording && !destPos) {
      rMap.panTo(userPos, { animate: true });
    }

    if (destPos) {
      const destIcon = L.divIcon({
        className: 'vitago-svg-rec-dest-pin',
        html: `<div style="position:relative;width:30px;height:38px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
          <svg width="30" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 11.2 14.4 20.8 15.2 21.333a1.4 1.4 0 0 0 1.6 0C17.6 36.8 32 27.2 32 16c0-8.837-7.163-16-16-16z" fill="#2563eb"/>
            <circle cx="16" cy="15" r="9" fill="#ffffff"/>
            <rect x="11.5" y="11" width="3" height="3" fill="#1e293b"/>
            <rect x="14.5" y="11" width="3" height="3" fill="#ffffff"/>
            <rect x="17.5" y="11" width="3" height="3" fill="#1e293b"/>
            <rect x="11.5" y="14" width="3" height="3" fill="#ffffff"/>
            <rect x="14.5" y="14" width="3" height="3" fill="#1e293b"/>
            <rect x="17.5" y="14" width="3" height="3" fill="#ffffff"/>
            <rect x="11.5" y="17" width="1" height="4" fill="#64748b"/>
          </svg>
        </div>`,
        iconSize: [30, 38],
        iconAnchor: [15, 38],
      });
      if (!recordDestMarkerRef.current) {
        recordDestMarkerRef.current = L.marker(destPos, { icon: destIcon }).addTo(rMap);
      } else {
        recordDestMarkerRef.current.setLatLng(destPos);
      }

      const navCoords = destRouteCoords.length >= 2 ? destRouteCoords : [userPos, destPos];
      if (!recordNavLineRef.current) {
        recordNavLineRef.current = L.polyline(navCoords, {
          color: '#2563eb',
          weight: 5,
          dashArray: '8, 6',
          opacity: 0.88,
        }).addTo(rMap);
      } else {
        recordNavLineRef.current.setLatLngs(navCoords);
      }
    } else {
      if (recordDestMarkerRef.current) {
        rMap.removeLayer(recordDestMarkerRef.current);
        recordDestMarkerRef.current = null;
      }
      if (recordNavLineRef.current) {
        rMap.removeLayer(recordNavLineRef.current);
        recordNavLineRef.current = null;
      }
    }
  }, [userPos, recordRoute, destPos, destRouteCoords, isRecording, bottomTab]);

  // Search Place by Name on Maps Tab
  const handleSearchPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeQuery.trim()) return;
    setSearchingPlace(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeQuery.trim())}&limit=1`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const target: [number, number] = [lat, lon];
        await buildNavigationRoute(userPos, target, selectedSport);
        if (leafletMapRef.current) {
          leafletMapRef.current.fitBounds(L.latLngBounds([userPos, target]), {
            padding: [40, 40],
            maxZoom: 16,
          });
        }
      }
    } catch {
      // ignore
    } finally {
      setSearchingPlace(false);
    }
  };

  // Start Workout + Notify Telegram Chat that Navigator/Workout is active!
  const startRecording = useCallback(async () => {
    await tracker.startWorkout(selectedSport);
    if (currentUser?.token) {
      fetch(`${DEFAULT_API_BASE}/features/sport/session-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          sport_name: currentSportName,
          location_name: locationLabel,
          dest_distance_km: routeDistanceKm,
        }),
      }).catch(() => {});
    }
  }, [tracker, selectedSport, currentUser?.token, currentSportName, locationLabel, routeDistanceKm]);

  const stopAndSaveRecording = async () => {
    setSavingWorkout(true);
    const snap = tracker.stopWorkout();

    const qualityCheck = isValidWorkout(snap);
    if (!qualityCheck.valid) {
      setSavingWorkout(false);
      alert(qualityCheck.reason || "Mashg'ulot masofasi yoki vaqti juda kam bo'lganligi sababli saqlanmadi.");
      return;
    }

    const finalDist = Number(snap.distanceKm.toFixed(2));
    const finalSec = Math.max(snap.elapsedSec, 1);
    const finalElev = snap.elevGainM;
    const finalCal = Math.round(
      finalDist * currentSportMeta.kcalPerKgKm * userWeightKg +
        finalElev * currentSportMeta.elevKcalPerM
    );

    const newAct: SportActivityItem = {
      id: `act_${Date.now()}`,
      sport_type: currentSportName,
      title: `${currentSportName} (${locationLabel})`,
      location_name: locationLabel,
      distance_km: finalDist,
      elev_gain_m: finalElev,
      duration_sec: finalSec,
      calories: finalCal,
      kudos: 1,
      created_at: new Date().toISOString(),
      route_coords: snap.routeCoords,
    };

    const updatedList = [newAct, ...activities];
    setActivities(updatedList);

    if (currentUser?.token) {
      try {
        const res = await fetch(`${DEFAULT_API_BASE}/features/sport/save-activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser.token}`,
          },
          body: JSON.stringify(newAct),
        });
        if (res.ok) {
          const data = await res.json();
          if (currentUser) {
            onUserUpdated({
              ...currentUser,
              sport_activities_json: data.sport_activities_json,
              daily_steps: data.daily_steps ?? currentUser.daily_steps,
              streak_count: data.streak_count ?? currentUser.streak_count,
            });
          }
        }
      } catch {
        // ignore
      }
    }

    setSavingWorkout(false);
    setBottomTab('home');
  };

  // Search Ultra Sport Users
  const fetchSportUsers = useCallback(
    async (query: string) => {
      if (!currentUser?.token) return;
      setLoadingUsers(true);
      try {
        const res = await fetch(
          `${DEFAULT_API_BASE}/features/sport/users?q=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${currentUser.token}` } }
        );
        const data = await res.json();
        if (data?.users) setSportUsers(data.users);
      } catch {
        // ignore
      } finally {
        setLoadingUsers(false);
      }
    },
    [currentUser?.token]
  );

  useEffect(() => {
    if (searchModalOpen) {
      fetchSportUsers(userSearchQuery);
    }
  }, [searchModalOpen, userSearchQuery, fetchSportUsers]);

  // Open Notifications & Mark as Read
  const handleOpenNotifications = () => {
    setNotifModalOpen(true);
    if (currentUser?.token && unreadNotifCount > 0) {
      fetch(`${DEFAULT_API_BASE}/features/sport/notifications/mark-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentUser.token}` },
      })
        .then(() => {
          setUnreadNotifCount(0);
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        })
        .catch(() => {});
    }
  };

  // Join / Leave Sport Club
  const handleToggleJoinClub = async (clubId: number) => {
    if (!currentUser?.token) return;
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/features/sport/clubs/${clubId}/toggle-join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClubs((prev) =>
          prev.map((c) =>
            c.id === clubId
              ? { ...c, is_joined: data.is_joined, members_count: data.members_count }
              : c
          )
        );
      }
    } catch {
      // ignore
    }
  };

  // Send message to AI Sport & Nutrition Coach
  const sendToAiCoach = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? aiInput).trim();
    if (!textToSend || !currentUser?.token) return;
    if (!customPrompt) setAiInput('');
    setAiChatMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
    setAiLoading(true);
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/features/sport/ai-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          message: textToSend,
          lang,
          selected_sport: currentSportName,
        }),
      });
      const data = await res.json();
      if (data?.reply) {
        setAiChatMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
      }
    } catch {
      setAiChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            lang === 'ru'
              ? 'Произошла ошибка соединения с сервером. Попробуйте еще раз.'
              : "Server bilan bog'lanishda xatolik yuz berdi. Qayta urinib ko'ring.",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredSports = SPORT_OPTIONS.filter((s) =>
    s.names[lang].toLowerCase().includes(sportSearch.toLowerCase())
  );
  const footSports = filteredSports.filter((s) => s.group === 'foot');
  const cycleSports = filteredSports.filter((s) => s.group === 'cycle');

  const estimatedRouteMinutes =
    routeDistanceKm !== null
      ? Math.max(1, Math.round((routeDistanceKm / currentSportMeta.speedKmh) * 60))
      : null;
  const estimatedRouteCalories =
    routeDistanceKm !== null
      ? Math.round(routeDistanceKm * currentSportMeta.kcalPerKgKm * userWeightKg)
      : null;

  const remainingNavDistKm =
    destPos !== null
      ? Number(haversineKm(userPos[0], userPos[1], destPos[0], destPos[1]).toFixed(2))
      : null;

  // Accurate Streak Days Calculation for the Weekly Calendar (marks ONLY actual streak days up to today!)
  const effectiveStreak = currentUser?.streak_count ?? 0;
  const todayDayIdx = (new Date().getDay() + 6) % 7; // 0=Mon .. 6=Sun

  return (
    <div className="relative min-h-screen bg-slate-100 text-slate-900 flex flex-col pb-20 select-none overflow-x-hidden">
      {/* ==================== COMPACT MOBILE-FIRST HEADER (ALL ICONS VISIBLE!) ==================== */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-2.5 py-2 flex items-center justify-between gap-1 shadow-2xs w-full max-w-full">
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <button
            type="button"
            onClick={onBackToMain}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-2 py-1.5 text-[11px] font-extrabold text-slate-700 transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{st.backBtn}</span>
          </button>

          <div className="flex items-center gap-0.5 shrink-0">
            <span className="inline-flex items-center gap-0.5 text-sm sm:text-base font-black tracking-tight text-orange-600">
              <Zap className="h-4 w-4 sm:h-4.5 sm:w-4.5 fill-amber-400 text-orange-600 shrink-0" />
              <span>Sport</span>
            </span>
          </div>
        </div>

        {/* Right Side: Language + Search + AI Chat + Notifications (100% fits on 360px screen) */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            {(
              [
                { code: 'uz', label: "O'z" },
                { code: 'uz_cyrl', label: 'Ўз' },
                { code: 'ru', label: 'Ру' },
              ] as const
            ).map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => onLangChange(l.code)}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-black transition cursor-pointer ${
                  lang === l.code
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* 1. Search Ultra Sport Users */}
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
            title={st.searchUsersTitle}
          >
            <Search className="h-4 w-4" />
          </button>

          {/* 2. AI Sport & Nutrition Coach Chat */}
          <button
            type="button"
            onClick={() => {
              setAiCoachModalOpen(true);
              if (aiChatMessages.length === 0) {
                sendToAiCoach(st.aiAnalyzeMyRunBtn);
              }
            }}
            className="h-8 w-8 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center transition cursor-pointer shrink-0"
            title={st.aiCoachTitle}
          >
            <MessageCircle className="h-4 w-4" />
          </button>

          {/* 3. Real Notifications from Admin Panel */}
          <button
            type="button"
            onClick={handleOpenNotifications}
            className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer relative shrink-0"
            title={st.notificationsTitle}
          >
            <Bell className="h-4 w-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white">
                {unreadNotifCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ==================== TAB 1: HOME ==================== */}
      {bottomTab === 'home' && (
        <div className="max-w-xl mx-auto w-full space-y-3.5 pt-2.5 px-2.5 sm:px-0">
          {/* HERO BANNER (from Image 1 Screen 3) */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#081525] via-[#10233D] to-[#0D3834] text-white p-5 shadow-xl shadow-slate-900/20 flex items-center justify-between border border-teal-500/20">
            <div className="z-10 max-w-[210px] space-y-2">
              <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ⚡ Tetik Sport
              </span>
              <h2 className="text-xl sm:text-2xl font-black leading-tight tracking-tight">
                Yangi mashg'ulot boshlang!
              </h2>
              <button
                type="button"
                onClick={() => setSportPickerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <span>Mashg'ulot tanlash</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Runner Athlete Image Preview */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 shrink-0">
              <img
                src="/heroes/runner_female.jpg"
                alt="Runner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-blue-900/60 via-transparent to-transparent" />
            </div>
          </div>

          {/* MASHG'ULOT REJASI (from Image 1 Screen 3) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Mashg'ulot rejasi</h3>
              <button
                type="button"
                onClick={() => setSportPickerOpen(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Barchasi</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 'run', name: 'Yugurish', time: '30 min', level: "O'rtacha", icon: '🏃', color: 'bg-blue-50 text-blue-600' },
                { id: 'workout', name: 'Fitness', time: '20 min', level: 'Kuch', icon: '🏋️', color: 'bg-orange-50 text-orange-600' },
                { id: 'yoga', name: "Yog'a", time: '25 min', level: 'Nafas', icon: '🧘', color: 'bg-purple-50 text-purple-600' },
              ].map((w) => (
                <div
                  key={w.id}
                  onClick={() => {
                    if (w.id === 'workout') {
                      setAiWorkoutType('fitness');
                      setAiWorkoutModalOpen(true);
                    } else if (w.id === 'yoga') {
                      setAiWorkoutType('yoga');
                      setAiWorkoutModalOpen(true);
                    } else {
                      tracker.setSelectedSport(w.id as SportTypeId);
                      setBottomTab('record');
                      if (!isRecording) startRecording();
                    }
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${w.color} flex items-center justify-center font-bold text-lg shadow-2xs`}>
                      {w.icon}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-blue-600 transition">
                        {w.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {w.time} • {w.level}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-110 transition shrink-0"
                  >
                    <Play className="h-3.5 w-3.5 fill-white ml-0.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* HAFTALIK PROGRESS (REAL USER ACTIVITY PROGRESS) */}
          {(() => {
            const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
            const now = new Date();
            const currentDay = now.getDay();
            const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
            const monday = new Date(now);
            monday.setDate(now.getDate() + distanceToMonday);

            const dayDistances = [0, 0, 0, 0, 0, 0, 0];
            let totalThisWeek = 0;

            activities.forEach((act) => {
              if (!act.created_at) return;
              const actDate = new Date(act.created_at);
              const diffDays = Math.floor((actDate.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays >= 0 && diffDays < 7) {
                dayDistances[diffDays] += act.distance_km || 0;
                totalThisWeek += act.distance_km || 0;
              }
            });

            const maxDist = Math.max(...dayDistances, 3);
            const bars = dayDistances.map((km, idx) => ({
              day: days[idx],
              km: Math.round(km * 100) / 100,
              heightPct: km > 0 ? Math.max(15, Math.min(100, Math.round((km / maxDist) * 100))) : 8,
              isToday: idx === todayDayIdx,
            }));

            return (
              <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">Haftalik progress</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" />
                    {totalThisWeek > 0 ? `${totalThisWeek} km` : "0 km bu hafta"}
                  </span>
                </div>

                <div className="h-20 flex items-end justify-between gap-2 px-1 pt-2">
                  {bars.map((b, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div
                        style={{ height: `${b.heightPct}%` }}
                        className={`w-full rounded-md transition-all duration-500 ${
                          b.isToday ? 'bg-blue-600 shadow-sm' : b.km > 0 ? 'bg-blue-400' : 'bg-slate-100'
                        }`}
                      />
                      <span className={`text-[9px] font-bold ${b.isToday ? 'text-blue-600 font-black' : 'text-slate-400'}`}>
                        {b.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Redesigned Clean Weekly Streak & Calendar Card (Fully Responsive, No Overflow) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-slate-900">{st.streakTitle}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  ~{kcalPerKmForUser} kkal/km
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCalendarModalOpen(true)}
                className="inline-flex items-center gap-0.5 text-xs font-extrabold text-orange-600 hover:text-orange-700 cursor-pointer shrink-0"
              >
                <span>{st.viewCalendar}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Streak Count + Full 7-Day Grid (100% Fit On Small Screens) */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 shrink-0">
                    <Flame className="h-5 w-5 text-orange-600 fill-orange-500" />
                    <span className="absolute -bottom-1 bg-orange-600 text-white text-[9px] font-black px-1.5 rounded-full">
                      {effectiveStreak}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold leading-tight">
                      {st.yourStreak}
                    </div>
                    <div className="text-sm font-black text-slate-900 leading-tight mt-0.5">
                      {effectiveStreak} {st.daysUnit}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  {effectiveStreak > 0 ? "🔥 Faol davom etmoqda" : "Bugun start bering"}
                </span>
              </div>

              {/* 7 Days Row - Grid with 7 columns so it NEVER overflows */}
              <div className="grid grid-cols-7 gap-1 pt-1.5 border-t border-slate-200/60">
                {st.dayLabels.map((d, idx) => {
                  const isToday = idx === todayDayIdx;
                  const daysAgo = todayDayIdx - idx;
                  const isDone =
                    effectiveStreak > 0 && daysAgo >= 0 && daysAgo < effectiveStreak;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <span
                        className={`text-[10px] font-black ${
                          isToday ? 'text-orange-600' : 'text-slate-400'
                        }`}
                      >
                        {d}
                      </span>
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border ${
                          isDone
                            ? 'bg-orange-600 border-orange-600 text-white shadow-2xs'
                            : isToday
                            ? 'border-orange-500 text-orange-600 bg-white'
                            : 'border-slate-200 text-slate-300 bg-white'
                        }`}
                      >
                        {isDone ? '✓' : '•'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sport Selector + Start Button */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSportPickerOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-800 hover:text-orange-600 bg-slate-100 px-3 py-2 rounded-xl cursor-pointer"
              >
                <SportSvgIcon id={selectedSport} active />
                <span>{currentSportName}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setBottomTab('record');
                  if (!isRecording) startRecording();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-xl shadow-sm shadow-orange-600/20 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>{isRecording ? st.tabRecord : st.recordNow}</span>
              </button>
            </div>
          </div>

          {/* Real Activities Feed */}
          {activities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-2xs space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                <Navigation className="h-7 w-7" />
              </div>
              <h3 className="text-base font-black text-slate-900">{st.noActivitiesTitle}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {st.noActivitiesDesc}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBottomTab('record');
                    if (!isRecording) startRecording();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-orange-600/20 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>{st.startFirstWorkout}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBottomTab('maps')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 cursor-pointer"
                >
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <span>{st.tabMaps}</span>
                </button>
              </div>
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-600 text-white font-black text-base flex items-center justify-center shadow-xs shrink-0">
                      {currentUser?.first_name
                        ? currentUser.first_name.charAt(0).toUpperCase()
                        : 'V'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-sm text-slate-900 truncate">
                        {currentUser
                          ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
                          : 'Tetik Sportchi'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 flex-wrap mt-0.5">
                        <span>
                          {new Date(act.created_at).toLocaleString(
                            lang === 'ru' ? 'ru-RU' : 'uz-UZ',
                            {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold">Tetik ⚡ Sport</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5 text-slate-600 font-semibold">
                          <TrendingUp className="h-3 w-3" />
                          {act.location_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3 className="mt-3 text-base font-black text-slate-900">{act.title}</h3>

                  <div className="mt-3 grid grid-cols-4 gap-2 pt-2.5 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">{st.distance}</div>
                      <div className="text-sm sm:text-base font-black text-slate-900">
                        {act.distance_km.toFixed(2)} km
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">{st.elevGain}</div>
                      <div className="text-sm sm:text-base font-black text-slate-900">
                        {act.elev_gain_m} m
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">{st.time}</div>
                      <div className="text-sm sm:text-base font-black text-slate-900">
                        {formatDuration(act.duration_sec, lang)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">{st.calories}</div>
                      <div className="text-sm sm:text-base font-black text-orange-600">
                        {act.calories} kkal
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAiCoachModalOpen(true);
                        sendToAiCoach(
                          `${act.title}: ${act.distance_km.toFixed(2)} km yurdim/yugurdim va ${act.calories} kkal sarfladim. Menga hozir qancha va qanday ovqat yeyishim kerakligini aniq hisoblab bering.`
                        );
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-2.5 text-xs font-extrabold text-orange-700 transition cursor-pointer"
                    >
                      <Utensils className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{st.aiAnalyzeMyRunBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBottomTab('maps')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition cursor-pointer"
                    >
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{st.openOnMap}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==================== TAB 2: MAPS (REAL-TIME GPS NAVIGATOR) ==================== */}
      {bottomTab === 'maps' && (
        <div className="max-w-xl mx-auto w-full flex-1 flex flex-col px-2.5 sm:px-0 pt-2 space-y-2.5">
          {/* Sport Filter + GPS Status Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 flex items-center justify-between gap-2 shadow-2xs">
            <button
              type="button"
              onClick={() => setSportPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700 cursor-pointer"
            >
              <SportSvgIcon id={selectedSport} active />
              <span>{currentSportName}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  gpsReady ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                }`}
              />
              <span className="text-slate-700">
                {gpsReady
                  ? `${st.gpsActive} (${gpsAccuracy ? `±${gpsAccuracy}m` : 'Real-vaqt'})`
                  : st.gpsSearching}
              </span>
            </div>
          </div>

          {/* Search Destination Bar */}
          <form onSubmit={handleSearchPlace} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder={st.searchPlacePlaceholder}
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
              />
            </div>
            <button
              type="submit"
              disabled={searchingPlace}
              className="px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {searchingPlace ? '...' : st.searchBtn}
            </button>
          </form>

          {/* Interactive Leaflet Map Container */}
          <div className="relative w-full h-[380px] sm:h-[430px] rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-slate-100">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Recenter GPS Button */}
            <button
              type="button"
              onClick={() => {
                tracker.startGpsWatch(true);
                if (leafletMapRef.current) {
                  leafletMapRef.current.setView(userPos, 17, { animate: true });
                }
              }}
              className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-xl bg-white/95 backdrop-blur px-3 py-2 text-xs font-black text-slate-900 shadow-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <Navigation className="h-4 w-4 text-emerald-600" />
              <span>GPS: {locationLabel}</span>
            </button>
          </div>

          {/* Navigator Route Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            {destPos && routeDistanceKm !== null ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-orange-600 tracking-wider">
                      🧭 {st.selectedDestination} ({currentSportName})
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                      {st.distance}: {routeDistanceKm} km • ~{estimatedRouteMinutes} daq • ~{estimatedRouteCalories} kkal
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => tracker.setDestination(null)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                    title={st.clearRoute}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBottomTab('record');
                    if (!isRecording) startRecording();
                  }}
                  className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>{st.startNavToDest}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-black text-slate-900">{st.mapTapHint}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ⚡ {currentSportName}: har 1 km uchun ~{kcalPerKmForUser} kkal sarflanadi
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: RECORD (LIVE GPS WORKOUT TRACKER) ==================== */}
      {bottomTab === 'record' && (
        <div className="max-w-xl mx-auto w-full flex-1 flex flex-col px-2.5 sm:px-0 pt-2 pb-4 space-y-2">
          {/* Celebratory Banner when Destination is Reached! */}
          {destReached && (
            <div className="bg-emerald-600 text-white rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <Check className="h-4 w-4 shrink-0 stroke-[3]" />
                <div className="text-xs font-extrabold truncate">
                  🏁 Belgilangan manzilga yetib keldingiz! Masofa to‘liq hisoblandi.
                </div>
              </div>
              <button
                type="button"
                onClick={() => tracker.clearDestReachedBanner()}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white cursor-pointer shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Active Navigation Banner if destination was selected */}
          {destPos && remainingNavDistKm !== null && (
            <div className="bg-blue-600 text-white rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Navigation className="h-4 w-4 shrink-0 animate-bounce" />
                <div className="text-[11px] sm:text-xs font-extrabold truncate">
                  🧭 Yo‘nalish faol (chetidan yursangiz ham hisoblanadi) • {st.remainingDist}: <b>{remainingNavDistKm} km</b>
                </div>
              </div>
              <button
                type="button"
                onClick={() => tracker.setDestination(null)}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white cursor-pointer shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Live Map Preview during Recording (Google Maps High-Speed Tiles!) */}
          <div className="relative w-full h-52 sm:h-64 rounded-2xl overflow-hidden border border-slate-300 shadow-xs bg-slate-100">
            <div ref={recordMapContainerRef} className="w-full h-full z-10" />
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSportPickerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 text-xs font-black text-orange-600 shadow-md border border-orange-200 cursor-pointer"
              >
                <SportSvgIcon id={selectedSport} active />
                <span>{currentSportName}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="absolute top-2.5 right-2.5 z-20 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 text-[11px] font-black text-emerald-700 shadow-md border border-emerald-200 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>
                {st.gpsActive} {gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}
              </span>
            </div>
          </div>

          {/* Unified Compact Sport Selector + Live Stopwatch & Real GPS Telemetry (All Fits Above Bottom Nav!) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-3.5 sm:p-4 text-center space-y-3 shadow-2xs">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-left">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                  <SportSvgIcon id={selectedSport} active />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">{currentSportName}</div>
                  <div className="text-[10px] font-bold text-orange-600 truncate">
                    Energiya sarfi: ~{kcalPerKmForUser} kkal / km
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSportPickerOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-extrabold text-slate-700 cursor-pointer shrink-0"
              >
                {st.changeSportBtn}
              </button>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {st.time}
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black text-slate-900 mt-0.5">
                {String(Math.floor(recordSec / 60)).padStart(2, '0')}:
                {String(recordSec % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-slate-100">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">{st.distance}</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  {recordDistKm.toFixed(2)} <span className="text-xs font-bold">km</span>
                </div>
              </div>
              <div className="border-x border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">{st.elevGain}</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  {recordElevM} <span className="text-xs font-bold">m</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">{st.calories}</div>
                <div className="text-xl sm:text-2xl font-black text-orange-600 mt-0.5">
                  {liveBurnedCalories} <span className="text-xs font-bold">kkal</span>
                </div>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-500 px-7 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-orange-600/25 transition transform active:scale-95 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>{st.startBtn} ({currentSportName})</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={savingWorkout}
                  onClick={stopAndSaveRecording}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-7 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-rose-600/25 transition transform active:scale-95 cursor-pointer"
                >
                  <Square className="h-4 w-4 fill-white" />
                  <span>{savingWorkout ? st.savingBtn : st.stopAndSaveBtn}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: GROUPS (REAL LEADERBOARD & ADMIN CLUBS) ==================== */}
      {bottomTab === 'groups' && (
        <div className="max-w-xl mx-auto w-full px-2.5 sm:px-0 pt-2 space-y-3">
          {/* Real Sport Clubs from Admin Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <h3 className="text-base font-black text-slate-900">{st.clubsTitle}</h3>
              </div>
              <button
                type="button"
                onClick={fetchSportData}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {clubs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200 px-4">
                {st.noClubsYet}
              </div>
            ) : (
              <div className="space-y-2.5">
                {clubs.map((club) => {
                  const spOpt = SPORT_OPTIONS.find((s) => s.id === club.sport_type) || SPORT_OPTIONS[0];
                  return (
                    <div
                      key={club.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-slate-900">{club.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            {spOpt.names[lang]}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          📍 {club.location} • 👥 {club.members_count} {st.membersUnit}
                        </div>
                        {club.description && (
                          <p className="text-xs text-slate-600 mt-1">{club.description}</p>
                        )}
                        {club.invite_url && (
                          <a
                            href={club.invite_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-extrabold text-sky-600 hover:underline mt-1"
                          >
                            <span>Telegram guruh</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleJoinClub(club.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                          club.is_joined
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-orange-600 hover:bg-orange-500 text-white shadow-2xs'
                        }`}
                      >
                        {club.is_joined ? st.joinedClub : st.joinClub}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real Uzbekistan Athletes Leaderboard */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-orange-600" />
              <h3 className="text-base font-black text-slate-900">{st.leaderboardTitle}</h3>
            </div>

            <div className="divide-y divide-slate-100">
              {leaderboard.map((row) => (
                <div key={row.rank} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${
                        row.rank === 1
                          ? 'bg-amber-400 text-slate-950'
                          : row.rank === 2
                          ? 'bg-slate-300 text-slate-900'
                          : row.rank === 3
                          ? 'bg-orange-300 text-slate-950'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {row.rank}
                    </span>
                    <div>
                      <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span>{row.name}</span>
                        {row.plan === 'ultra' && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-orange-100 text-orange-700 uppercase">
                            ULTRA
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        🔥 {row.streak_count} {st.daysUnit} • {row.daily_steps.toLocaleString()} qadam
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-orange-600">
                    {row.distance_km.toFixed(2)} km
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: YOU (ATHLETE PROFILE) ==================== */}
      {bottomTab === 'you' && (
        <div className="max-w-xl mx-auto w-full px-2.5 sm:px-0 pt-2 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-linear-to-tr from-[#16A68A] to-[#0A4844] text-white font-black text-2xl flex items-center justify-center shadow-md">
                {currentUser?.first_name ? currentUser.first_name.charAt(0).toUpperCase() : 'T'}
              </div>
              <div>
                <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <Zap className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                  <span>Tetik ⚡ Sport • {userPlan.toUpperCase()}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {currentUser
                    ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
                    : st.profileTitle}
                </h3>
                <p className="text-xs text-slate-500">📍 {locationLabel}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-100 text-center">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[11px] font-bold text-slate-400">{st.stepsToday}</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {(currentUser?.daily_steps || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[11px] font-bold text-slate-400">{st.workoutsCount}</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {activities.length}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[11px] font-bold text-slate-400">{st.totalKm}</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {activities.reduce((acc, a) => acc + a.distance_km, 0).toFixed(2)} km
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[11px] font-bold text-slate-400">{st.totalKcal}</div>
                <div className="text-base font-black text-orange-600 mt-0.5">
                  {activities.reduce((acc, a) => acc + a.calories, 0)} kkal
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setAiCoachModalOpen(true);
                  sendToAiCoach(st.aiAnalyzeMyRunBtn);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>{st.aiCoachTitle}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BOTTOM NAVIGATION BAR ==================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 pb-safe">
        <div className="max-w-xl mx-auto grid grid-cols-5 py-1.5 px-2">
          {(
            [
              { id: 'home', label: st.tabHome, icon: Home },
              { id: 'maps', label: st.tabMaps, icon: MapPin },
              { id: 'record', label: st.tabRecord, icon: Disc },
              { id: 'groups', label: st.tabGroups, icon: Users },
              { id: 'you', label: st.tabYou, icon: UserIcon },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = bottomTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setBottomTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 text-[11px] font-bold transition cursor-pointer ${
                  active ? 'text-orange-600 font-black' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.id === 'you' ? (
                  <div
                    className={`h-6 w-6 rounded-md flex items-center justify-center text-[11px] font-black text-white ${
                      active ? 'bg-rose-600 ring-2 ring-orange-500' : 'bg-rose-600'
                    }`}
                  >
                    {currentUser?.first_name
                      ? currentUser.first_name.charAt(0).toUpperCase()
                      : 'V'}
                  </div>
                ) : (
                  <div
                    className={`px-3 py-0.5 rounded-full relative ${
                      active ? 'bg-orange-50 text-orange-600' : ''
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
                    {item.id === 'record' && isRecording && (
                      <span className="absolute top-0 right-1.5 h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                    )}
                  </div>
                )}
                <span className="mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ==================== SPORT DIRECTION PICKER SHEET ==================== */}
      {sportPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5" />
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">{st.filterBySport}</h3>
              <button
                type="button"
                onClick={() => setSportPickerOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-3">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder={st.searchSportPlaceholder}
                  value={sportSearch}
                  onChange={(e) => setSportSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">
              {footSports.length > 0 && (
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-2">{st.footSports}</h4>
                  <div className="space-y-1">
                    {footSports.map((sport) => {
                      const active = selectedSport === sport.id;
                      const kcalKm = Math.round(sport.kcalPerKgKm * userWeightKg);
                      return (
                        <button
                          key={sport.id}
                          type="button"
                          onClick={() => {
                            tracker.setSelectedSport(sport.id);
                            setSportPickerOpen(false);
                          }}
                          className="w-full flex items-center justify-between py-3 px-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 text-left">
                            <SportSvgIcon id={sport.id} active={active} />
                            <div>
                              <div
                                className={`text-sm font-bold ${
                                  active ? 'text-orange-600 font-black' : 'text-slate-900'
                                }`}
                              >
                                {sport.names[lang]}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-400">
                                ~{kcalKm} kkal / km • ~{sport.speedKmh} km/soat
                              </div>
                            </div>
                          </div>
                          {active && <Check className="h-5 w-5 text-orange-600 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {cycleSports.length > 0 && (
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-2">{st.cycleSports}</h4>
                  <div className="space-y-1">
                    {cycleSports.map((sport) => {
                      const active = selectedSport === sport.id;
                      const kcalKm = Math.round(sport.kcalPerKgKm * userWeightKg);
                      return (
                        <button
                          key={sport.id}
                          type="button"
                          onClick={() => {
                            tracker.setSelectedSport(sport.id);
                            setSportPickerOpen(false);
                          }}
                          className="w-full flex items-center justify-between py-3 px-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 text-left">
                            <SportSvgIcon id={sport.id} active={active} />
                            <div>
                              <div
                                className={`text-sm font-bold ${
                                  active ? 'text-orange-600 font-black' : 'text-slate-900'
                                }`}
                              >
                                {sport.names[lang]}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-400">
                                ~{kcalKm} kkal / km • ~{sport.speedKmh} km/soat
                              </div>
                            </div>
                          </div>
                          {active && <Check className="h-5 w-5 text-orange-600 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: SEARCH ULTRA SPORT USERS ==================== */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-orange-600" />
                <h3 className="text-base font-black text-slate-900">{st.searchUsersTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder={st.searchUsersPlaceholder}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {loadingUsers ? (
                <div className="py-10 text-center text-xs font-bold text-slate-400">
                  Yuklanmoqda...
                </div>
              ) : sportUsers.length === 0 ? (
                <div className="py-10 text-center text-xs font-bold text-slate-400">
                  {st.noUsersFound}
                </div>
              ) : (
                sportUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-orange-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-sm text-slate-900 truncate flex items-center gap-1.5">
                          <span>{u.name}</span>
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-orange-100 text-orange-700 uppercase">
                            ULTRA
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          🔥 {u.streak_count} {st.daysUnit} • 👣 {u.daily_steps.toLocaleString()} qadam
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-orange-600">
                        {u.total_distance_km.toFixed(2)} km
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        {u.total_calories} kkal
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: AI SPORT & NUTRITION COACH CHAT ==================== */}
      {aiCoachModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl h-[82vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Utensils className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black">{st.aiCoachTitle}</h3>
                  <p className="text-[10px] text-orange-100 line-clamp-1">{st.aiCoachSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiCoachModalOpen(false)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {aiChatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-orange-600 text-white font-bold'
                        : 'bg-white border border-slate-200 text-slate-800 font-medium shadow-2xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-orange-600 animate-pulse">
                    AI sport ko'rsatkichlaringiz va ovqatlanish me'yorini hisoblamoqda...
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={() => sendToAiCoach(st.aiAnalyzeMyRunBtn)}
                className="w-full py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-black text-left truncate cursor-pointer border border-orange-200"
              >
                {st.aiAnalyzeMyRunBtn}
              </button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendToAiCoach();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder={st.aiInputPlaceholder}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: REAL NOTIFICATIONS FROM ADMIN ==================== */}
      {notifModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[82vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                <h3 className="text-base font-black text-slate-900">{st.notificationsTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setNotifModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400">
                  {st.noNotifications}
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-sm text-slate-900">{n.title}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          n.is_target_personal
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {n.is_target_personal ? 'Shaxsiy xabar' : 'Rasmiy xabar'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                      {n.message}
                    </p>
                    <div className="text-[10px] text-slate-400 pt-1">
                      {n.sender_name} •{' '}
                      {n.created_at ? new Date(n.created_at).toLocaleString('uz-UZ') : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: STREAK CALENDAR ==================== */}
      {calendarModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">{st.calendarModalTitle}</h3>
              <button
                type="button"
                onClick={() => setCalendarModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-orange-50 border border-orange-200">
              <Flame className="h-8 w-8 text-orange-600 fill-orange-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-orange-800">{st.yourStreak}</div>
                <div className="text-lg font-black text-slate-900">
                  {effectiveStreak} {st.daysUnit} • {(currentUser?.daily_steps || 0).toLocaleString()} qadam
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Agar biror kun yurmasangiz yoki mashg'ulot qilmasangiz, ketma-ketlik 0 ga tushadi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCalendarModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black cursor-pointer"
            >
              {st.closeBtn}
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL 5: AI WORKOUT RUNNER (FITNESS & YOGA) ==================== */}
      <AIWorkoutModal
        isOpen={aiWorkoutModalOpen}
        onClose={() => setAiWorkoutModalOpen(false)}
        workoutType={aiWorkoutType}
        user={currentUser}
        triggerHaptic={triggerHaptic}
        onCompleteWorkout={(kcal, mins) => {
          triggerHaptic?.('success');
          // Add completed activity to feed
          const newAct: SportActivityItem = {
            id: String(Date.now()),
            sport_type: aiWorkoutType === 'yoga' ? "Yog'a" : "Fitness",
            title: aiWorkoutType === 'yoga' ? "Yog'a va Nafas mashg'uloti" : "Fitness va Kuch mashg'uloti",
            location_name: "O'zbekiston",
            distance_km: 0,
            elev_gain_m: 0,
            duration_sec: mins * 60,
            calories: kcal,
            kudos: 1,
            created_at: new Date().toISOString(),
          };
          setActivities((prev) => [newAct, ...prev]);
        }}
      />

      {/* ==================== NON-BLOCKING GPS PERMISSION PROMPT BANNER (NEVER BLOCKS ENTRY TO SPORT!) ==================== */}
      {gpsPermissionDenied && !gpsReady && (
        <div className="fixed bottom-16 left-2.5 right-2.5 z-40 max-w-md mx-auto bg-slate-900/95 backdrop-blur border border-emerald-500/50 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-emerald-400 animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-white truncate">{st.gpsMandatoryTitle}</div>
              <div className="text-[10px] text-slate-300 truncate">
                Aniq GPS ishlashi uchun telefon geolokatsiyasiga ruxsat bering
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => tracker.retryGpsPermission()}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[11px] cursor-pointer shadow-md"
            >
              📍 Yoqish
            </button>
            {typeof window !== 'undefined' && Boolean((window as any)?.VitaGoNative?.openAppSettings) && (
              <button
                type="button"
                onClick={() => (window as any).VitaGoNative.openAppSettings()}
                className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-600 cursor-pointer"
              >
                ⚙️ Sozlamalar
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================== GUEST (UNREGISTERED) LOCK OVERLAY (CAN ENTER SPORT, CANNOT USE ACTIONS) ==================== */}
      {!isRegistered && (
        <div
          onClick={() => onRequireAuth?.()}
          className="fixed top-[49px] bottom-0 left-0 right-0 z-40 bg-slate-950/65 backdrop-blur-[2px] flex flex-col items-center justify-center p-5 text-center select-none cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm w-full bg-slate-900/95 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center animate-in fade-in"
          >
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mb-3.5 shadow-lg">
              <Lock className="h-8 w-8 text-emerald-400" />
            </div>

            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-[10px] font-black text-emerald-300 uppercase mb-2">
              <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>⚡ Sport • Kirish talab etiladi</span>
            </div>

            <h2 className="text-lg font-black text-white tracking-tight">
              Sport bo‘limidan foydalanish uchun ro‘yxatdan o‘ting
            </h2>

            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Siz hozir mehmon rejimidasiz. GPS Navigator, 7 xil sport yo‘nalishi va AI Sport murabbiyidan foydalanish uchun avval ro‘yxatdan o‘ting!
            </p>

            <button
              type="button"
              onClick={() => onRequireAuth?.()}
              className="mt-5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:brightness-105 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ro‘yxatdan o‘tish / Kirish</span>
            </button>

            <button
              type="button"
              onClick={onBackToMain}
              className="mt-2.5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              ← Asosiy menyuga qaytish
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export const VitaGoSportView = TetikSportView;
