import { configureStore } from '@reduxjs/toolkit';
import userReducer from './user/userSlice';
import cartReducer from './shopping-cart/cartSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
  },
});

export default store;