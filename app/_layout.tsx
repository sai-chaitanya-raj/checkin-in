import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";

import { Stack, useRouter, Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { ThemeProvider as CustomThemeProvider } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loaded = true;
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (loaded) {
      checkAuth();
    }
  }, [loaded]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const user = await AsyncStorage.getItem("user");

      if (token && user) {
        // User is logged in, redirect to tabs
        // We use router.replace inside a timeout to ensure navigation is ready
        setTimeout(() => {
          router.replace("/(tabs)");
          SplashScreen.hideAsync();
        }, 100);
      } else {
        // User not logged in, redirect to auth
        setTimeout(() => {
          router.replace("/auth");
          SplashScreen.hideAsync();
        }, 100);
      }
    } catch (e) {
      console.error("Auth check failed", e);
      SplashScreen.hideAsync();
    } finally {
      setIsReady(true);
    }
  };

  if (!loaded || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <CustomThemeProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/index" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </CustomThemeProvider>
  );
}
