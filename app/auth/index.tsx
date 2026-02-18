import { API_BASE_URL } from "@/constants/api";
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeRedirectUri, Prompt } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// import { Utils } from "expo-router";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

// Direct redirect for Web (localhost)
const webRedirectUri = makeRedirectUri({
  scheme: "checkinin",
  path: "auth",
  preferLocalhost: true,
});

// Proxy redirect for Mobile (Expo Go)
// This must match the URI in Google Cloud Console
const mobileProxyUri = "https://auth.expo.io/@r1jtek-org/checkinin";

// Select based on Platform
const finalRedirectUri = Platform.select({
  web: webRedirectUri,
  default: mobileProxyUri,
});

export default function AuthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      "728497750384-i2odpp36reh028ts0kqijh1bp3bmisim.apps.googleusercontent.com",
    webClientId:
      "728497750384-78jtkoio2td111a4i2pgfuith4hnnd1j.apps.googleusercontent.com",
    redirectUri: finalRedirectUri,
    scopes: ["profile", "email"], // Ensure scopes are explicitly requested
    prompt: Prompt.SelectAccount, // Force account selection prompt
  });

  useEffect(() => {
    console.log("Generated Redirect URI:", finalRedirectUri);
    console.log("Auth Response Received:", JSON.stringify(response, null, 2));

    if (response?.type === "success") {
      const { authentication } = response;
      const idToken = authentication?.idToken;
      const accessToken = authentication?.accessToken;

      console.log("ID Token:", !!idToken, "Access Token:", !!accessToken);

      if (idToken || accessToken) {
        handleGoogleLogin({ idToken, accessToken });
      } else {
        alert("Login successful but no tokens received.");
      }
    } else if (response?.type === "error") {
      console.error("Auth Error:", response.error);
      alert("Authentication error: " + (response.error?.message || "Unknown error"));
    } else if (response?.type === "locked") {
      alert("Authentication locked. Please restart the app or try again.");
    } else if (response?.type === "dismiss") {
      console.log("Auth session dismissed by user");
    }
  }, [response]);

  const handleGoogleLogin = async ({ idToken, accessToken }: { idToken?: string; accessToken?: string }) => {
    setLoading(true);
    console.log("Sending Token to backend...", idToken ? "ID Token" : "Access Token");

    try {
      const body = idToken ? { token: idToken } : { accessToken };

      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("Backend response status:", res.status);
      const json = await res.json();
      console.log("Backend response JSON:", json);

      if (json.success) {
        await AsyncStorage.setItem("token", json.token);
        await AsyncStorage.setItem("user", JSON.stringify(json.user));

        console.log("Login success, navigating to /(tabs)...");
        // Use a slight delay to ensure async storage is set and state is stable
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 100);
      } else {
        const errorMsg = json.message || "Unknown login error";
        alert("Login failed: " + errorMsg);
        console.log("Login failed with response:", json);
      }
    } catch (error) {
      console.error("Google login error:", error);
      alert("Network Error: Could not connect to backend. Please ensure the backend server is running and your phone is on the same Wi-Fi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="location" size={64} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Checkin’in</Text>
        <Text style={styles.subtitle}>Track your daily presence with your circle.</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <TouchableOpacity
            style={[styles.googleButton, !request && styles.disabledButton]}
            disabled={!request}
            onPress={() => promptAsync()}
          >
            <Ionicons name="logo-google" size={24} color="#FFF" style={{ marginRight: 12 }} />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xxl,
    maxWidth: "80%",
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    ...Shadows.small,
  },
  disabledButton: {
    opacity: 0.7,
  },
  googleText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "600",
  },
});
