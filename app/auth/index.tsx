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
    androidClientId: "576137633786-8d6931753177817088927055708579-373322198.apps.googleusercontent.com",
    iosClientId: "YOUR_IOS_CLIENT_ID",
    webClientId: "576137633786-k873177699106093174229988118.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({
      scheme: "checkinin"
    }),
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      const idToken = authentication?.idToken;
      const accessToken = authentication?.accessToken;

      if (idToken || accessToken) {
        handleGoogleLogin({ idToken, accessToken });
      }
    }
  }, [response]);

  const handleGoogleLogin = async ({ idToken, accessToken }: { idToken?: string; accessToken?: string }) => {
    setLoading(true);
    try {
      const body = idToken ? { token: idToken } : { accessToken };

      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (json.success) {
        await AsyncStorage.setItem("token", json.token);
        await AsyncStorage.setItem("user", JSON.stringify(json.user));

        setTimeout(() => {
          router.replace("/(tabs)");
        }, 100);
      } else {
        alert("Login failed: " + (json.message || "Unknown error"));
      }
    } catch (error) {
      alert("Network Error: Could not connect to backend.");
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

        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.googleButton, !request && styles.disabledButton]}
                disabled={!request}
                onPress={() => promptAsync()}
              >
                <Ionicons name="logo-google" size={24} color="#FFF" style={{ marginRight: 12 }} />
                <Text style={styles.googleText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity
                style={styles.emailButton}
                onPress={() => router.push("/auth/signin")}
              >
                <Text style={styles.emailButtonText}>Sign In with Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => router.push("/auth/signup")}
              >
                <Text style={styles.signupButtonText}>Create Account</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    ...Shadows.medium,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  buttonContainer: {
    width: "100%",
    gap: Spacing.md,
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#DB4437",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    ...Shadows.small,
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleText: {
    color: "#FFF",
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    marginHorizontal: Spacing.md,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  emailButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    width: "100%",
    ...Shadows.small,
  },
  emailButtonText: {
    color: "#FFF",
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  signupButton: {
    backgroundColor: "transparent",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  signupButtonText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: "600",
  },
});
