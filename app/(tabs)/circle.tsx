import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/constants/api";
import { useUserId } from "@/hooks/useUserId";

export default function CircleScreen() {
  const userId = useUserId();
  const [circle, setCircle] = useState<string[]>([]);
  const [inputUserId, setInputUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCircle = async () => {
    if (!userId) return;

    const res = await fetch(
      `${API_BASE_URL}/circle?userId=${userId}`
    );
    const json = await res.json();

    if (json.success) {
      setCircle(json.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadCircle();
  }, [userId]);

  const addToCircle = async () => {
    if (!userId || !inputUserId) return;

    await fetch(`${API_BASE_URL}/circle/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        targetUserId: inputUserId,
      }),
    });

    setInputUserId("");
    loadCircle();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading circle...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Circle</Text>

      {/* Add user */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter userId (e.g. user-123)"
          value={inputUserId}
          onChangeText={setInputUserId}
        />
        <TouchableOpacity style={styles.addButton} onPress={addToCircle}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Circle list */}
      {circle.length === 0 ? (
        <Text style={styles.empty}>No one in your circle yet.</Text>
      ) : (
        <FlatList
          data={circle}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{item}</Text>
            </View>
          )}
        />
      )}
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
    marginBottom: 20,
  },
  addRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 8,
  },
  addText: {
    color: "#fff",
    fontWeight: "600",
  },
  item: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
  },
  empty: {
    color: "#666",
    marginTop: 20,
    textAlign: "center",
  },
});
