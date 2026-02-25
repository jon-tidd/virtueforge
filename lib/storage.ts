import { AppData } from "./data";

const STORAGE_KEY = "virtueforge-data";
const PREMIUM_KEY = "virtueforge-premium";
const STORY_COUNT_KEY = "virtueforge-story-count";

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
    // Migrate from old key
    const old = localStorage.getItem("virtuequest-data");
    if (old) {
      const data = JSON.parse(old);
      localStorage.setItem(STORAGE_KEY, old);
      return data;
    }
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

// Premium state (for demo — real implementation would use Stripe webhooks)
export function isPremium(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREMIUM_KEY) === "true";
}

export function setPremium(val: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREMIUM_KEY, val ? "true" : "false");
}

// Monthly story count for free tier gating
export function getMonthlyStoryCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORY_COUNT_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const now = new Date();
    const key = `${now.getFullYear()}-${now.getMonth()}`;
    return data[key] || 0;
  } catch {
    return 0;
  }
}

export function incrementStoryCount(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORY_COUNT_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const now = new Date();
    const key = `${now.getFullYear()}-${now.getMonth()}`;
    data[key] = (data[key] || 0) + 1;
    localStorage.setItem(STORY_COUNT_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}
