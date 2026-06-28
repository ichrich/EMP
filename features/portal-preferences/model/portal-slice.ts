import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type PortalPreferencesState = {
  activeView: "overview" | "operations";
  sidebarCollapsed: boolean;
};

const initialState: PortalPreferencesState = {
  activeView: "overview",
  sidebarCollapsed: false
};

const portalSlice = createSlice({
  name: "portal",
  initialState,
  reducers: {
    setActiveView: (state, action: PayloadAction<PortalPreferencesState["activeView"]>) => {
      state.activeView = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    }
  }
});

export const { setActiveView, toggleSidebar } = portalSlice.actions;
export const portalReducer = portalSlice.reducer;
