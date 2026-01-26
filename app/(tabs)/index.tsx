import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/constants/api";
import { useUserId } from "@/hooks/useUserId";

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
    backgroundColor: "#F7F8FA",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
  },
  buttonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "500",
  },
  subtitle: {
    marginTop: 30,
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
});
