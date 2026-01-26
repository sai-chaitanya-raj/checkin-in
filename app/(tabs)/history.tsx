import { StyleSheet, Text, View, FlatList } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "checkInHistory";

export default function HistoryScreen() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const historyRaw = await AsyncStorage.getItem(HISTORY_KEY);
      const parsedHistory: string[] = historyRaw
        ? JSON.parse(historyRaw)
        : [];

      // Show latest first
      setHistory(parsedHistory.reverse());
    };

    loadHistory();
  }, []);

  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>
          No check-ins yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Check-Ins</Text>

      <FlatList
        data={history}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.date}>{item}</Text>
          </View>
        )}
      />
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
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
  },
  item: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
  },
  empty: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 50,
  },
});
