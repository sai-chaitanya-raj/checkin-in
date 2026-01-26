import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/constants/api";
import { useUserId } from "@/hooks/useUserId";
import { Colors, Spacing, FontSize } from "@/constants/theme";


export default function HomeScreen() {
  const userId = useUserId();
  const [checkedIn, setCheckedIn] = useState(false);
  const [today, setToday] = useState("");

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  useEffect(() => {
    if (!userId) return;

    const loadStatus = async () => {
      const currentDate = getTodayDate();
      setToday(currentDate);

      const res = await fetch(
        `${API_BASE_URL}/history?userId=${userId}`
      );
      const json = await res.json();

      if (json.data?.includes(currentDate)) {
        setCheckedIn(true);
      }
    };

    loadStatus();
  }, [userId]);

  const handleCheckIn = async () => {
    if (!userId) return;

    const currentDate = getTodayDate();

    await fetch(`${API_BASE_URL}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        date: currentDate,
      }),
    });

    setCheckedIn(true);
  };

  if (!userId) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkin’in</Text>

      <TouchableOpacity
        style={[
          styles.button,
          checkedIn ? styles.buttonDisabled : null,
        ]}
        onPress={handleCheckIn}
        disabled={checkedIn}
      >
        <Text style={styles.buttonText}>
          {checkedIn ? "Checked in for today ✅" : "I’m here"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>
        {checkedIn
          ? `Checked in on ${today}`
          : "Tap once a day. No pressure."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "600",
    marginBottom: Spacing.xl,
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 999,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FontSize.lg,
    color: "#fff",
    fontWeight: "600",
  },
  subtitle: {
    marginTop: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
