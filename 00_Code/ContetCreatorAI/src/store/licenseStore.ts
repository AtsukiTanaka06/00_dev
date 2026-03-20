import { create } from "zustand";

type Plan = "free" | "pro";
type LicenseStatus = "active" | "inactive" | "expired";

interface LicenseState {
  plan: Plan;
  status: LicenseStatus;
  dailyCount: number;
  checked: boolean;
  setLicense: (plan: Plan, status: LicenseStatus) => void;
  incrementCount: () => void;
  canGenerate: () => boolean;
  skip: () => void;
}

const FREE_DAILY_LIMIT = 3;

export const useLicenseStore = create<LicenseState>((set, get) => ({
  plan: "free",
  status: "inactive",
  dailyCount: 0,
  checked: false,

  setLicense: (plan, status) => set({ plan, status, checked: true }),

  incrementCount: () => set((s) => ({ dailyCount: s.dailyCount + 1 })),

  canGenerate: () => {
    const { plan, dailyCount } = get();
    if (plan === "pro") return true;
    return dailyCount < FREE_DAILY_LIMIT;
  },

  skip: () => set({ checked: true }),
}));
