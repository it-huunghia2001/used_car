import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./slices/counterSlice"; // ✅ Quan trọng: import đúng tên

export const store = configureStore({
  reducer: {
    counter: counterReducer, // ✅ Khai báo đúng tên biến
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
