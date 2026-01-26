import { StyleSheet, Text, View, Switch, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/constants/api";
import { useUserId } from "@/hooks/useUserId";

type Settings = {
  reminderEnabled: boolean;
  visibility: "circle" | "private";
};

export default function SettingsScreen() {
  const userId = useUserId();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadSettings = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/settings?userId=${userId}`
        );
        const json = await res.json();

        if (json.success) {
          setSettings(json.data);
        }
      } catch (error) {
        console.log("Settings fetch error:", error);
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

    await fetch(`${API_BASE_URL}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        settings: newSettings,
      }),
    });
  };

  if (loading || !settings) {
    return (
      <View style={styles.container}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Reminder Toggle */}
      <View style={styles.row}>
        <Text style={styles.label}>Daily Reminder</Text>
        <Switch
          value={settings.reminderEnabled}
          onValueChange={(value) =>
            updateSettings({ reminderEnabled: value })
          }
        />
      </View>

      {/* Visibility */}
      <View style={styles.section}>
        <Text style={styles.label}>Visibility</Text>

        <TouchableOpacity
          style={[
            styles.option,
            settings.visibility === "circle" && styles.optionActive,
          ]}
          onPress={() => updateSettings({ visibility: "circle" })}
        >
          <Text>Circle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            settings.visibility === "private" && styles.optionActive,
          ]}
          onPress={() => updateSettings({ visibility: "private" })}
        >
          <Text>Private</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 30,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  section: {
    marginTop: 20,
  },
  option: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginTop: 10,
  },
  optionActive: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
});
