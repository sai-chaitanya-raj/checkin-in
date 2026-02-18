import { Platform } from "react-native";

const LOCAL_IP = "192.168.1.11";

export const API_BASE_URL =
  Platform.OS === "web" ? "http://localhost:3000" : `http://${LOCAL_IP}:3000`;
