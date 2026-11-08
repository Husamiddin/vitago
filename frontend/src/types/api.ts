export type SupportedLang = 'uz' | 'uz_cyrl' | 'ru';

export type ActiveTab =
  | 'home'
  | 'sport'
  | 'health'
  | 'drugs'
  | 'plans'
  | 'profile'
  | 'food'
  | 'stats'
  | 'scanner'
  | 'search'
  | 'history'
  | 'about'
  | 'chat'
  | 'alarm';

export interface DrugAnalogOption {
  id: number | null;
  trade_name: string;
  inn: string;
  inn_localized: string;
  dosage: string;
  form: string;
  manufacturer: string;
  country: string;
  is_local_uz: boolean;
  price_uzs: number;
  savings_uzs: number;
  savings_percent: number;
  source: 'verified_db' | 'ai_estimate';
}

export interface AnalyzedDrugResult {
  item_id: string;
  raw_written_text: string;
  prescribed_drug_id: number | null;
  prescribed_name: string;
  inn: string;
  inn_localized: string;
  dosage: string;
  form: string;
  manufacturer: string;
  country: string;
  is_local_uz: boolean;
  prescribed_price_uzs: number;
  regimen: string;
  confidence: number;
  category: string;
  simple_purpose: string;
  how_to_take: string;
  warnings: string;
  price_source: 'verified_db' | 'ai_estimate';
  analogs: DrugAnalogOption[];
  recommended_analog: DrugAnalogOption | null;
  max_savings_uzs: number;
  max_savings_percent: number;
}

export interface PrescriptionAnalysisResponse {
  analysis_id: string;
  mode: 'ai_vision' | 'demo_sample' | 'drug_lookup';
  is_valid_prescription: boolean;
  summary: string;
  language: SupportedLang;
  total_prescribed_uzs: number;
  total_with_analogs_uzs: number;
  total_savings_uzs: number;
  total_savings_percent: number;
  items: AnalyzedDrugResult[];
  disclaimer: string;
}

export interface DrugSearchItem {
  id: number;
  trade_name: string;
  inn: string;
  inn_localized: string;
  dosage: string;
  form: string;
  manufacturer: string;
  country: string;
  is_local_uz: boolean;
  avg_price_uzs: number;
  category: string;
  analogs_count: number;
  cheapest_analog_uzs: number | null;
}

export interface SamplePrescriptionMeta {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  drugs_preview: string[];
  estimated_savings_uzs: number;
}

export interface PlatformStatsResponse {
  total_drugs: number;
  total_inn_groups: number;
  local_uz_drugs: number;
  avg_savings_percent: number;
  ai_vision_configured: boolean;
  ai_model: string;
}

export interface UserProfile {
  id: number;
  phone: string;
  first_name: string;
  last_name?: string | null;
  gender?: 'male' | 'female' | null;
  age?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  avatar_data?: string | null;
  token: string;
  is_profile_complete: boolean;
  plan: 'standard' | 'premium' | 'ultra';
  plan_cycle?: 'monthly' | 'annually' | null;
  plan_expires_at?: string | null;
  streak_count: number;
  streak_last_date?: string | null;
  daily_steps: number;
  daily_target_steps: number;
  daily_water_ml: number;
  daily_kcal: number;
  health_plan_json?: string | null;
  health_plan_updated_at?: string | null;
  sport_activities_json?: string | null;
  alarm_time?: string | null;
  alarm_enabled: boolean;
  telegram_id?: number | null;
}

export interface PlanFeature {
  title: string;
  desc: string;
}

export interface PlanInfo {
  id: 'standard' | 'premium' | 'ultra';
  name: string;
  price_monthly_uzs: number;
  price_annual_uzs: number;
  badge?: string | null;
  features: PlanFeature[];
}

export interface PaymentCheckoutResponse {
  payment_id: number;
  status: string;
  plan: string;
  billing_cycle: string;
  base_amount_uzs: number;
  discount_uzs: number;
  final_amount_uzs: number;
  card_type: string;
  receiver_card: string;
  receiver_name: string;
  message: string;
}

export interface PaymentStatusResponse {
  payment_id: number;
  status: string;
  plan: string;
  billing_cycle: string;
  final_amount_uzs: number;
  is_approved: boolean;
  user_plan: string;
  message: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AIChatResponse {
  reply: string;
  voice_url?: string | null;
  voice_gender: 'male' | 'female';
}

export interface HealthAnalysisResponse {
  daily_plan_summary: string;
  target_steps: number;
  target_water_ml: number;
  target_calories_burn: number;
  food_recommendations: string[];
  activity_routine: string[];
  sleep_advice: string;
}

export interface ElderlyAnalysisResponse {
  summary: string;
  has_diabetes_signs: string;
  blood_pressure_advice: string;
  dietary_dos_and_donts: string[];
  walking_recommendation_km: string;
  suggested_safe_medicines: string[];
  disclaimer: string;
}

export interface FoodScanResponse {
  food_name: string;
  calories: number;
  ingredients: string[];
  sleep_after_hours: string;
  fat_g: string;
  carbs_g: string;
  protein_g: string;
  vitamins: string[];
  walk_distance_km: string;
  health_advice: string;
}

export interface AlarmMissionVerifyResponse {
  step: number;
  passed: boolean;
  next_step: number;
  message: string;
  mission_completed: boolean;
}

export interface OtpRequestResponse {
  ok: boolean;
  message: string;
  phone: string;
  channel: string;
  debug_code?: string | null;
}

export interface SavedHistoryEntry {
  id: string;
  createdAt: string;
  title: string;
  drugsCount: number;
  totalPrescribedUzs: number;
  totalSavingsUzs: number;
  savingsPercent: number;
  mode: PrescriptionAnalysisResponse['mode'];
  response: PrescriptionAnalysisResponse;
}

export interface ExerciseItem {
  name: string;
  duration_or_reps: string;
  rest_sec: number;
  instruction: string;
  focus_muscle: string;
  animation_icon: string;
}

export interface WorkoutPlanRequest {
  workout_type: 'fitness' | 'yoga';
  age?: number;
  duration_min?: number;
  fitness_level?: string;
  health_conditions?: string;
  lang?: string;
}

export interface WorkoutPlanResponse {
  title: string;
  workout_type: string;
  total_duration_min: number;
  estimated_kcal: number;
  target_audience: string;
  safety_precautions: string[];
  exercises: ExerciseItem[];
}

export interface DailyRoutineItem {
  time: string;
  action: string;
}

export interface GoalsPlanRequest {
  weight_target_kg?: number;
  target_type?: string;
  daily_steps_target?: number;
  daily_active_minutes?: number;
  activity_preference?: string;
  health_notes?: string;
  lang?: string;
}

export interface GoalsPlanResponse {
  summary: string;
  recommended_daily_steps: number;
  recommended_daily_water_ml: number;
  recommended_daily_burn_kcal: number;
  weekly_milestones: string[];
  daily_routine: DailyRoutineItem[];
  motivation_quote: string;
  reminder_frequency_min: number;
}

export interface FoodVerifyRequest {
  image_base64: string;
  meal_time?: string;
  user_goal?: string;
  lang?: string;
}

export interface FoodVerifyResponse {
  food_name: string;
  calories: number;
  carbs_g: string;
  fat_g: string;
  protein_g: string;
  is_healthy: boolean;
  is_plan_compliant: boolean;
  warning_alert?: string | null;
  swap_recommendation?: string | null;
  health_advice: string;
  walk_distance_km: string;
  sleep_after_hours: string;
}

