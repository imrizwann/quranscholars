import { createSlice } from "@reduxjs/toolkit";

const normalizeUser = (user) => {
  if (!user || typeof user !== "object") return null;
  return {
    ...user,
    role: String(user.role || "")
      .trim()
      .toLowerCase(),
    email: String(user.email || "")
      .trim()
      .toLowerCase(),
  };
};

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return normalizeUser(raw ? JSON.parse(raw) : null);
  } catch {
    return null;
  }
};

const userSlice = createSlice({
  name: "user",
  initialState: {
    user: getInitialUser(),
  },
  reducers: {
    setUser: (state, action) => {
      const normalized = normalizeUser(action.payload);
      state.user = normalized;
      if (normalized) {
        localStorage.setItem("user", JSON.stringify(normalized));
      } else {
        localStorage.removeItem("user");
      }
    },
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
