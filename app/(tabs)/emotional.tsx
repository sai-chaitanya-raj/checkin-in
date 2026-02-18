import { StyleSheet, Text, View, FlatList, ActivityIndicator } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "@/constants/api";
import { useUserId } from "@/hooks/useUserId";
import { useTheme } from "@/context/ThemeContext";
import { FontSize, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';

type UserPresence = {
    userId: string;
    name: string;
    lastCheckIn: {
        date: string;
        mood: string;
        timestamp: string;
    };
};

export default function EmotionalPresenceScreen() {
    const userId = useUserId();
    const { colors } = useTheme();
    const [presenceData, setPresenceData] = useState<UserPresence[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPresence = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/emotional-presence`);
            const json = await res.json();
            if (json.success) {
                setPresenceData(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch emotional presence", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchPresence();
        }, [fetchPresence])
    );

    const getMoodEmoji = (mood: string) => {
        switch (mood) {
            case 'great': return '😊';
            case 'okay': return '😐';
            case 'bad': return '😞';
            default: return '❓';
        }
    };

    const getTimeAgo = (timestamp: string) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    if (loading && presenceData.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Emotional Presence</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>See how your circle is feeling today.</Text>
            </View>

            <FlatList
                data={presenceData}
                keyExtractor={(item) => item.userId}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="heart-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No updates yet.</Text>
                        <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>Be the first to check in!</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <View style={styles.emojiContainer}>
                            <Text style={styles.emoji}>{getMoodEmoji(item.lastCheckIn.mood)}</Text>
                        </View>
                        <View style={styles.infoContainer}>
                            <Text style={[styles.name, { color: colors.textPrimary }]}>
                                {item.userId === userId ? "You" : (item.name === "Anonymous" ? `User ${item.userId.slice(-4)}` : item.name)}
                            </Text>
                            <Text style={[styles.status, { color: colors.textSecondary }]}>
                                is feeling <Text style={{ fontWeight: 'bold', color: colors.primary }}>{item.lastCheckIn.mood}</Text>
                            </Text>
                        </View>
                        <View style={styles.timeContainer}>
                            <Text style={[styles.time, { color: colors.textSecondary }]}>{getTimeAgo(item.lastCheckIn.timestamp)}</Text>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: "800",
    },
    subtitle: {
        fontSize: FontSize.md,
        marginTop: Spacing.xs,
    },
    listContent: {
        padding: Spacing.lg,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
        ...Shadows.small,
    },
    emojiContainer: {
        marginRight: Spacing.md,
        width: 50,
        alignItems: 'center',
    },
    emoji: {
        fontSize: 32,
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: FontSize.md,
        fontWeight: '700',
        marginBottom: 2,
    },
    status: {
        fontSize: FontSize.sm,
    },
    timeContainer: {
        marginLeft: Spacing.sm,
    },
    time: {
        fontSize: FontSize.xs,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: Spacing.xxl,
    },
    emptyText: {
        fontSize: FontSize.lg,
        marginTop: Spacing.md,
        fontWeight: "500",
    },
    emptySubText: {
        fontSize: FontSize.sm,
        marginTop: Spacing.xs,
    },
});
