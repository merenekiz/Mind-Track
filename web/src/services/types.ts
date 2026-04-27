// Domain types — shared across services & features

export interface User {
  id: number;
  email: string;
  full_name: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export interface HealthData {
  id: number;
  user_id: number;
  date: string;
  pain_level?: number | null;
  pain_location?: string | null;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  stress_level?: number | null;
  mood?: string | null;
  notes?: string | null;
  created_at: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface ImageAnalysis {
  id: number;
  user_id: number;
  health_data_id?: number | null;
  meal_type?: MealType | null;
  image_url: string;
  analysis_result: {
    food_type?: string;
    estimated_calories?: number;
    coffee_type?: string;
    estimated_caffeine_mg?: number;
    confidence?: number;
    notes?: string;
  };
  created_at: string;
}

export interface DetectedSymptom {
  name: string;
  severity?: "hafif" | "orta" | "şiddetli" | null;
  body_region?: string | null;
  duration?: string | null;
}

export interface SymptomAnalysis {
  symptoms: DetectedSymptom[];
  summary: string;
  suggested_categories: string[];
}

export interface Symptom {
  id: number;
  user_id: number;
  original_text: string;
  detected_symptoms: SymptomAnalysis;
  date: string;
  created_at: string;
}

// AI insight (frontend mock until backend route exists)
export interface AIInsight {
  summary: string;
  reason?: string;
  risk?: { level: "low" | "medium" | "high"; label: string };
  suggestion?: string;
  confidence?: number;
  sources?: { title: string; url?: string }[];
}
