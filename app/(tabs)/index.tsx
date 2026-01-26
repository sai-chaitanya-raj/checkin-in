import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [today, setToday] = useState("");

  // Get today's date (YYYY-MM-DD)
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Load saved check-in on app start
  useEffect(() => {
    const loadCheckIn = async () => {
      const savedDate = await AsyncStorage.getItem("lastCheckInDate");
      const currentDate = getTodayDate();

      setToday(currentDate);

      if (savedDate === currentDate) {
        setCheckedIn(true);
      } else {
        setCheckedIn(false);
      }
    };

    loadCheckIn();
  }, []);

  // Handle check-in
  const handleCheckIn = async () => {
    const currentDate = getTodayDate();
    await AsyncStorage.setItem("lastCheckInDate", currentDate);
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
