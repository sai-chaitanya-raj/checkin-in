import { StyleSheet, Text, View, Switch, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/constants/api";
import { useUserId } from "@/hooks/useUserId";
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

type Settings = {
  reminderEnabled: boolean;
  visibility: "circle" | "private";
  theme: "light" | "dark" | "system";
};

export default function SettingsScreen() {
  const router = useRouter();
  const userId = useUserId();
  const { theme, setTheme, colors, isDark } = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  // ... (useUserId effect)

  useEffect(() => {
    if (!userId) return;

    const loadSettings = async () => {
      console.log("Loading settings for userId:", userId);
      try {
        const res = await fetch(
          `${API_BASE_URL}/settings?userId=${userId}`
        );
        const json = await res.json();
        console.log("Settings response:", json);

        if (json.success) {
          const data = json.data || {
            reminderEnabled: true,
            visibility: "circle",
            theme: "system"
          };
          setSettings(data);

          // Sync local theme with backend if different
          if (data.theme && data.theme !== theme) {
            setTheme(data.theme);
          }
        } else {
          console.error("Failed to load settings:", json.message);
          // Fallback to defaults even on failure to avoid blocking user
          setSettings({
            reminderEnabled: true,
            visibility: "circle",
            theme: "system"
          });
        }
      } catch (error) {
        console.log("Settings fetch error:", error);
        // Fallback to defaults on network error
        setSettings({
          reminderEnabled: true,
          visibility: "circle",
          theme: "system"
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [userId]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!userId || !settings) return;

    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Reserved for special handling if needed (e.g. theme)
    if (newSettings.theme) {
      setTheme(newSettings.theme);
    }

    try {
      await fetch(`${API_BASE_URL}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          settings: newSettings,
        }),
      });
    } catch (error) {
      console.error("Failed to update settings", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={[styles.container, styles.center, { padding: Spacing.xl, backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.subtitle, { marginBottom: Spacing.lg, textAlign: "center", color: colors.textSecondary }]}>
          Unable to load settings. Please check your connection or try logging in again.
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: Spacing.xl }}>
          User ID: {userId || "Not found"}
        </Text>
        <TouchableOpacity
          style={{ padding: Spacing.md, backgroundColor: colors.surface, borderRadius: BorderRadius.md }}
          onPress={() => router.replace("/auth")}
        >
          <Text style={{ color: colors.primary, fontWeight: "600" }}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your preferences.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="moon-outline" size={22} color={colors.textPrimary} style={styles.icon} />
                <Text style={[styles.label, { color: colors.textPrimary }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(value) => updateSettings({ theme: value ? 'dark' : 'light' })}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PREFERENCES</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} style={styles.icon} />
                <Text style={[styles.label, { color: colors.textPrimary }]}>Daily Reminder</Text>
              </View>
              <Switch
                value={settings.reminderEnabled}
                onValueChange={(value) => updateSettings({ reminderEnabled: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRIVACY</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.option, settings.visibility === "circle" && styles.optionSelected, { backgroundColor: settings.visibility === "circle" ? colors.background : 'transparent' }]}
              onPress={() => updateSettings({ visibility: "circle" })}
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="people-outline"
                  size={22}
                  color={settings.visibility === "circle" ? colors.primary : colors.textPrimary}
                  style={styles.icon}
                />
                <View>
                  <Text style={[styles.optionTitle, settings.visibility === "circle" && { color: colors.primary, fontWeight: '600' } || { color: colors.textPrimary }]}>Circle</Text>
                  <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>Only your circle can see your check-ins</Text>
                </View>
              </View>
              {settings.visibility === "circle" && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={[styles.option, settings.visibility === "private" && styles.optionSelected, { backgroundColor: settings.visibility === "private" ? colors.background : 'transparent' }]}
              onPress={() => updateSettings({ visibility: "private" })}
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={settings.visibility === "private" ? colors.primary : colors.textPrimary}
                  style={styles.icon}
                />
                <View>
                  <Text style={[styles.optionTitle, settings.visibility === "private" && { color: colors.primary, fontWeight: '600' } || { color: colors.textPrimary }]}>Private</Text>
                  <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>No one can see your check-ins</Text>
                </View>
              </View>
              {settings.visibility === "private" && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="information-circle-outline" size={22} color={colors.textPrimary} style={styles.icon} />
                <Text style={[styles.label, { color: colors.textPrimary }]}>Version</Text>
              </View>
              <Text style={[styles.value, { color: colors.textSecondary }]}>1.0.0</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    fontWeight: "600",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.small,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: Spacing.md,
  },
  label: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  value: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 50, // Indent to align with text
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  optionSelected: {
    backgroundColor: Colors.background,
  },
  textSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  optionTitle: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
