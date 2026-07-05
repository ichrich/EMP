import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type PortalView = "layout" | "profile" | "settings";

type PortalPreferencesState = {
  activeView: PortalView;
  sidebarCollapsed: boolean;
};

const initialState: PortalPreferencesState = {
  activeView: "layout",
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
