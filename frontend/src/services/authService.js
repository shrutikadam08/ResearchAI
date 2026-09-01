import axios from "axios";
import { API_URL } from "./apiConfig";


// ================================
// LOGIN
// ================================

export const loginUser = async (credentials) => {
  const response = await axios.post(
    `${API_URL}/auth/login`,
    credentials
  );

  return response.data;
};


// ================================
// GET TOKEN
// ================================

export const getToken = () => {
  return localStorage.getItem("access_token");
};


// ================================
// SET TOKEN
// ================================

export const setToken = (token) => {
  localStorage.setItem(
    "access_token",
    token
  );
};


// ================================
// LOGOUT
// ================================

export const logoutUser = () => {
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "is_logged_in"
  );
};


// ================================
// CHECK LOGIN
// ================================

export const isLoggedIn = () => {
  return Boolean(
    localStorage.getItem("access_token")
  );
};


// ================================
// REMOVE TOKEN
// ================================

export const removeToken = () => {
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "is_logged_in"
  );
};