import { createSlice } from "@reduxjs/toolkit";

const userUiSlice = createSlice({
  name: "userUi",
  initialState: { userIsVisible: false },

  reducers: {
    toggle(state) {
      state.userIsVisible = !state.userIsVisible;
    },
  },
});

export const userUiActions = userUiSlice.actions;
export default userUiSlice;
