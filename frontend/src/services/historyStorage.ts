import type { PrescriptionAnalysisResponse, SavedHistoryEntry } from '../types/api';

const STORAGE_KEY = 'doriscan_history_v1';
const MAX_ENTRIES = 25;

export function loadScanHistory(): SavedHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAnalysisToHistory(
  response: PrescriptionAnalysisResponse,
  customTitle?: string
): SavedHistoryEntry[] {
  if (!response.is_valid_prescription || response.items.length === 0) {
    return loadScanHistory();
  }

  const existing = loadScanHistory();
  const autoTitle =
    customTitle ||
    response.items
      .slice(0, 3)
      .map((i) => i.prescribed_name)
      .join(', ');

  const entry: SavedHistoryEntry = {
    id: `${response.analysis_id}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    title: autoTitle,
    drugsCount: response.items.length,
    totalPrescribedUzs: response.total_prescribed_uzs,
    totalSavingsUzs: response.total_savings_uzs,
    savingsPercent: response.total_savings_percent,
    mode: response.mode,
    response,
  };

  const updated = [entry, ...existing.filter((e) => e.response.analysis_id !== response.analysis_id)].slice(
    0,
    MAX_ENTRIES
  );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // quota fallback
  }
  return updated;
}

export function removeHistoryEntry(entryId: string): SavedHistoryEntry[] {
  const next = loadScanHistory().filter((item) => item.id !== entryId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
