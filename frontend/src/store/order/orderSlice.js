import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  status: 'idle',
  error: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    placeOrderStart(state) {
      state.status = 'loading';
    },
    placeOrderSuccess(state, action) {
      state.status = 'succeeded';
      state.orders.push(action.payload);
    },
    placeOrderFailure(state, action) {
      state.status = 'failed';
      state.error = action.payload;
    },
  },
});

export const { placeOrderStart, placeOrderSuccess, placeOrderFailure } = orderSlice.actions;
export default orderSlice.reducer;