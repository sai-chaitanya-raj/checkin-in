import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "checkInHistory";

export default function HomeScreen() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [today, setToday] = useState("");

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  useEffect(() => {
    const loadCheckIn = async () => {
      const currentDate = getTodayDate();
      setToday(currentDate);

      const historyRaw = await AsyncStorage.getItem(HISTORY_KEY);
      const history: string[] = historyRaw ? JSON.parse(historyRaw) : [];

      if (history.includes(currentDate)) {
        setCheckedIn(true);
      }
    };

    loadCheckIn();
  }, []);

  const handleCheckIn = async () => {
    const currentDate = getTodayDate();

    const historyRaw = await AsyncStorage.getItem(HISTORY_KEY);
    const history: string[] = historyRaw ? JSON.parse(historyRaw) : [];

    if (!history.includes(currentDate)) {
      history.push(currentDate);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    setCheckedIn(true);
  };

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
