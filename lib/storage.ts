import { AppData } from "./data";

const STORAGE_KEY = "virtuequest-data";

const DEFAULT_DATA: AppData = {
  children: [],
  familyVirtues: [],
  setupComplete: false,
};

export function loadData(): AppData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return DEFAULT_DATA;
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}
