import { FontSize, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserId } from "@/hooks/useUserId";
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { useFocusEffect } from '@react-navigation/native';

type Mood = "great" | "okay" | "bad";

export default function HomeScreen() {
  const router = useRouter();
  const userId = useUserId();
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/history?userId=${userId}`);
      const json = await res.json();

      if (json.success) {
        const history: any[] = json.data; // Array of objects or strings depending on legacy
        const today = new Date().toISOString().split("T")[0];

        // Handle both object and string formats
        const dates = history.map(item => typeof item === 'string' ? item : item.date);

        setHasCheckedIn(dates.includes(today));
        setTotalCheckIns(dates.length);
        setStreak(calculateStreak(dates));
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const calculateStreak = (dates: string[]) => {
    if (!dates.length) return 0;

    const sortedDates = [...new Set(dates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let currentStreak = 0;
    let expectedDate = sortedDates[0] === today ? today : yesterday;

    // If the last check-in was not today or yesterday, streak is broken (0)
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
      return 0;
    }

    for (const date of sortedDates) {
      if (date === expectedDate) {
        currentStreak++;
        expectedDate = new Date(new Date(date).getTime() - 86400000).toISOString().split("T")[0];
      } else {
        break;
      }
    }
    return currentStreak;
  };

  const handleCheckIn = async () => {
    if (!userId) return;
    if (!selectedMood) {
      Alert.alert("Mood Needed", "How are you feeling today?");
      return;
    }

    setCheckingIn(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`${API_BASE_URL}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date: today, mood: selectedMood }),
      });
      const json = await res.json();

      if (json.success) {
        Alert.alert("Checked In!", "See you tomorrow!", [{ text: "OK" }]);
        setHasCheckedIn(true);
        fetchData(); // Refresh stats
      } else {
        Alert.alert("Error", "Could not check in.");
      }
    } catch (error) {
      Alert.alert("Error", "Network error.");
    } finally {
      setCheckingIn(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    router.replace("/auth");
  };

  if (loading && !totalCheckIns) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hello,</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Ready to Check-in?</Text>
        </View>

        {hasCheckedIn ? (
          <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="checkmark-done-circle" size={64} color={colors.success} />
            <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>You're Checked In!</Text>
            <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>Great job staying consistent.</Text>
            <Text style={[styles.date, { color: colors.textSecondary, backgroundColor: colors.background }]}>{new Date().toLocaleDateString()}</Text>
          </View>
        ) : (
          <View style={[styles.moodContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.moodTitle, { color: colors.textPrimary }]}>How are you feeling?</Text>
            <View style={styles.moodOptions}>
              <TouchableOpacity
                style={[styles.moodOption, selectedMood === 'great' && { borderColor: colors.primary, backgroundColor: colors.background }]}
                onPress={() => setSelectedMood('great')}
              >
                <Text style={styles.moodEmoji}>😊</Text>
                <Text style={[styles.moodText, { color: colors.textSecondary }]}>Great</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.moodOption, selectedMood === 'okay' && { borderColor: colors.primary, backgroundColor: colors.background }]}
                onPress={() => setSelectedMood('okay')}
              >
                <Text style={styles.moodEmoji}>😐</Text>
                <Text style={[styles.moodText, { color: colors.textSecondary }]}>Okay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.moodOption, selectedMood === 'bad' && { borderColor: colors.primary, backgroundColor: colors.background }]}
                onPress={() => setSelectedMood('bad')}
              >
                <Text style={styles.moodEmoji}>😞</Text>
                <Text style={[styles.moodText, { color: colors.textSecondary }]}>Not Great</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.checkInButton, { backgroundColor: selectedMood ? colors.primary : colors.border }]}
              onPress={handleCheckIn}
              disabled={!selectedMood || checkingIn}
            >
              {checkingIn ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.checkInText}>Check In</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Days Streak</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{totalCheckIns}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Check-ins</Text>
          </View>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.lg,
    fontWeight: "500",
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
  },
  statusCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  moodContainer: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  moodTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  moodOption: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: BorderRadius.lg,
    width: '30%',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  moodText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  checkInButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  checkInText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: FontSize.md,
  },
  statusTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    marginTop: Spacing.md,
  },
  statusSubtitle: {
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  date: {
    marginTop: Spacing.lg,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    overflow: "hidden",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginHorizontal: Spacing.xs,
    ...Shadows.small,
  },
  statNumber: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },
});
