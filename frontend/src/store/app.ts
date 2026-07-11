import { create } from "zustand";

interface AppState {
	property: string;
	setProperty: (property: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
	property: "",
	setProperty: (property) => set({ property }),
}));
