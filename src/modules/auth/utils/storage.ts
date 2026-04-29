import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const storage = {
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") {
      try {
        sessionStorage.setItem(key, value);
      } catch (e) {
        console.error("Error saving to sessionStorage", e);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  getItem: async (key: string) => {
    if (Platform.OS === "web") {
      try {
        return sessionStorage.getItem(key);
      } catch (e) {
        console.error("Error reading from sessionStorage", e);
        return null;
      }
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  deleteItem: async (key: string) => {
    if (Platform.OS === "web") {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.error("Error deleting from sessionStorage", e);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};
