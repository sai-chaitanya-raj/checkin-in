import { StyleSheet, Text, View, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/constants/api";
import { useUserId } from "@/hooks/useUserId";
import { Colors, Spacing, FontSize } from "@/constants/theme";


export default function HistoryScreen() {
  const userId = useUserId();
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadHistory = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/history?userId=${userId}`
        );
        const json = await res.json();

        if (json.success) {
          setHistory([...json.data].reverse());
        }
      } catch (error) {
        console.log("History fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading history...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>No check-ins yet.</Text>
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
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "600",
    marginBottom: Spacing.lg,
    color: Colors.textPrimary,
  },
  item: {
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.card,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  date: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  empty: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
