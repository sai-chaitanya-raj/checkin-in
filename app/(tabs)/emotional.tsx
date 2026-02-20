import { StyleSheet, Text, View, FlatList, ActivityIndicator, TextInput, TouchableOpacity, useWindowDimensions } from "react-native";
import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

type FriendThought = {
    name: string;
    thought: string;
};

export default function EmotionalPresenceScreen() {
    const userId = useUserId();
    const { colors } = useTheme();
    const { height } = useWindowDimensions();
    const thoughtBoxHeight = height * 0.39;

    const [presenceData, setPresenceData] = useState<UserPresence[]>([]);
    const [friendsThoughts, setFriendsThoughts] = useState<FriendThought[]>([]);
    const [myThought, setMyThought] = useState<string>("");
    const [thoughtInput, setThoughtInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingThought, setSavingThought] = useState(false);

    const fetchPresence = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/emotional-presence`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const json = await res.json();
            if (json.success) {
                setPresenceData(json.data || []);
                setFriendsThoughts(json.friendsThoughts || []);
                setMyThought(json.myThought || "");
                setThoughtInput(json.myThought || "");
            }
        } catch (error) {
            console.error("Failed to fetch emotional presence", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveThought = useCallback(async () => {
        const trimmed = thoughtInput.trim();
        const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
        if (wordCount > 60) return;

        setSavingThought(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/emotional-presence/thought`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ thought: trimmed }),
            });
            const json = await res.json();
            if (json.success) {
                setMyThought(trimmed);
                fetchPresence();
            }
        } catch (error) {
            console.error("Failed to save thought", error);
        } finally {
            setSavingThought(false);
        }
    }, [thoughtInput, fetchPresence]);

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

    const wordCount = thoughtInput.trim() ? thoughtInput.trim().split(/\s+/).filter(Boolean).length : 0;
    const isOverLimit = wordCount > 60;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: Spacing.sm }]}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Emotional Presence</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>See how your circle is feeling today.</Text>
            </View>

            <FlatList
                data={presenceData}
                keyExtractor={(item) => item.userId}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.thoughtSection}>
                        <Text style={[styles.thoughtLabel, { color: colors.textPrimary }]}>What do you think today?</Text>
                        <TextInput
                            style={[
                                styles.thoughtInput,
                                {
                                    height: thoughtBoxHeight,
                                    backgroundColor: colors.surface,
                                    color: colors.textPrimary,
                                    borderColor: isOverLimit ? colors.error : colors.border,
                                },
                            ]}
                            placeholder="Share your thoughts..."
                            placeholderTextColor={colors.textSecondary}
                            value={thoughtInput}
                            onChangeText={setThoughtInput}
                            multiline
                            maxLength={400}
                        />
                        <View style={styles.thoughtFooter}>
                            <Text style={[styles.wordCount, { color: isOverLimit ? colors.error : colors.textSecondary }]}>
                                {wordCount}/60 words
                            </Text>
                            <TouchableOpacity
                                style={[styles.saveThoughtBtn, { backgroundColor: colors.primary }]}
                                onPress={saveThought}
                                disabled={savingThought || isOverLimit}
                            >
                                {savingThought ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveThoughtText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        {friendsThoughts.length > 0 && (
                            <View style={styles.friendsThoughts}>
                                <Text style={[styles.friendsThoughtsTitle, { color: colors.textSecondary }]}>
                                    Posted today:
                                </Text>
                                {friendsThoughts.map((ft, i) => (
                                    <Text key={i} style={[styles.friendThought, { color: colors.textPrimary }]}>
                                        <Text style={{ fontWeight: "600" }}>{ft.name}</Text> posted this today: {ft.thought}
                                    </Text>
                                ))}
                            </View>
                        )}
                    </View>
                }
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
    thoughtSection: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    thoughtLabel: {
        fontSize: FontSize.md,
        fontWeight: "600",
        marginBottom: Spacing.sm,
    },
    thoughtInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        fontSize: FontSize.md,
        textAlignVertical: "top",
    },
    thoughtFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: Spacing.sm,
    },
    wordCount: {
        fontSize: FontSize.xs,
    },
    saveThoughtBtn: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    saveThoughtText: {
        color: "#fff",
        fontWeight: "600",
    },
    friendsThoughts: {
        marginTop: Spacing.lg,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: "rgba(128,128,128,0.2)",
    },
    friendsThoughtsTitle: {
        fontSize: FontSize.sm,
        fontWeight: "600",
        marginBottom: Spacing.sm,
    },
    friendThought: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.sm,
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
