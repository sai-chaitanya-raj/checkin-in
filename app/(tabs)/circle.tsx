import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/constants/api";
import { useUserId } from "@/hooks/useUserId";
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CircleScreen() {
  const userId = useUserId();
  const [circle, setCircle] = useState<string[]>([]);
  const [inputUserId, setInputUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCircle = async () => {
    if (!userId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/circle?userId=${userId}`);
      const json = await res.json();

      if (json.success) {
        setCircle(json.data);
      }
    } catch (error) {
      console.error("Failed to load circle", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCircle();
  }, [userId]);

  const addToCircle = async () => {
    if (!userId || !inputUserId.trim()) return;

    try {
      await fetch(`${API_BASE_URL}/circle/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          targetUserId: inputUserId.trim(),
        }),
      });

      setInputUserId("");
      loadCircle();
    } catch (error) {
      console.error("Failed to add to circle", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Circle</Text>
        <Text style={styles.subtitle}>Keep track of your friends' check-ins.</Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-add-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter User ID (e.g. user-123)"
            placeholderTextColor={Colors.textSecondary}
            value={inputUserId}
            onChangeText={setInputUserId}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={addToCircle}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={circle}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={Colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>No one in your circle yet.</Text>
            <Text style={styles.emptySubText}>Add a friend's ID above to get started.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.substring(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item}</Text>
              <Text style={styles.itemStatus}>Last seen today</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </View>
        )}
      />
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
  inputContainer: {
    flexDirection: "row",
    padding: Spacing.lg,
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
    ...Shadows.small,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.md,
    ...Shadows.small,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.primary,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  itemStatus: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontWeight: "500",
  },
  emptySubText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
