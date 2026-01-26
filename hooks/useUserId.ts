import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const USER_ID_KEY = "userId";

export const useUserId = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserId = async () => {
      let storedUserId = await AsyncStorage.getItem(USER_ID_KEY);

      if (!storedUserId) {
        storedUserId = `user-${Date.now()}`;
        await AsyncStorage.setItem(USER_ID_KEY, storedUserId);
      }

      setUserId(storedUserId);
    };

    loadUserId();
  }, []);

  return userId;
};
