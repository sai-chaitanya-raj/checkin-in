import { StyleSheet, Text, View, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { FontSize, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

type ProfileData = {
    publicId: string;
    name: string;
    avatar: string;
    friendCount: number;
    streak: number;
    totalCheckIns: number;
    weeklyMoodSummary: { great: number; okay: number; bad: number };
    recentCheckIns: Array<{ date: string; mood: string; timestamp: string }>;
    isFriend: boolean;
};

export default function ViewProfileScreen() {
    const { publicId } = useLocalSearchParams();
    const router = useRouter();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorStatus, setErrorStatus] = useState<{ status: number; message: string } | null>(null);
    const [processingAction, setProcessingAction] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setErrorStatus(null);
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                setErrorStatus({ status: 401, message: "Authentication required" });
                return;
            }

            const res = await fetch(`${API_BASE_URL}/profile/${publicId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const json = await res.json();
            if (res.ok && json.success) {
                setProfile(json.data);
            } else {
                setErrorStatus({ status: res.status, message: json.message || "Failed to load profile" });
            }
        } catch (error) {
            console.error("View Profile Fetch Error:", error);
            setErrorStatus({ status: 500, message: "Network error" });
        } finally {
            setLoading(false);
        }
    }, [publicId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleFriendAction = async () => {
        if (!profile) return;
        setProcessingAction(true);

        try {
            const token = await AsyncStorage.getItem("token");

            if (profile.isFriend) {
                // Remove friend
                const res = await fetch(`${API_BASE_URL}/friends/remove`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ friendId: profile.publicId }), // Need userId for removal endpoint currently, wait... no, the backend removeFriend endpoint expects friendId as the userId, but our targetPublicId works for POST request.
                });
                // We will adapt the action. The backend /friends/remove currently expects friendId which is the userId. We do not have userId in the profile payload.
                // It might be better to just navigate back and let the user do it from Circle or we can build a new endpoint. 
                // For now, let's just alert since /friends/remove expects userId.
                Alert.alert("Remove Friend", "Please remove friends from the Circle tab.");
            } else {
                // Add friend
                const res = await fetch(`${API_BASE_URL}/friends/request`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ targetPublicId: profile.publicId })
                });
                const json = await res.json();
                if (json.success) {
                    Alert.alert("Success", "Friend request sent!");
                } else {
                    Alert.alert("Error", json.message || "Failed to send request");
                }
            }
        } catch (error) {
            Alert.alert("Error", "Network error");
        } finally {
            setProcessingAction(false);
        }
    };


    const getMoodEmoji = (mood: string) => {
        switch (mood) {
            case 'great': return '😄';
            case 'okay': return '😐';
            case 'bad': return '😞';
            default: return '❓';
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (errorStatus) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.centerError}>
                    <Ionicons
                        name={errorStatus.status === 403 ? "lock-closed" : "alert-circle"}
                        size={64}
                        color={colors.textSecondary}
                        style={{ marginBottom: Spacing.md }}
                    />
                    <Text style={styles.errorTitle}>
                        {errorStatus.status === 403 ? "Private Profile" : "Oops"}
                    </Text>
                    <Text style={styles.errorMessage}>{errorStatus.message}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                        <Text style={styles.retryText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!profile) return null;

    const initial = profile.name ? profile.name[0].toUpperCase() : "?";

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    <Text style={styles.nameText}>{profile.name}</Text>
                    <Text style={styles.idText}>ID: {profile.publicId}</Text>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: profile.isFriend ? colors.surface : colors.primary, borderColor: profile.isFriend ? colors.border : 'transparent', borderWidth: profile.isFriend ? 1 : 0 }]}
                        onPress={handleFriendAction}
                        disabled={processingAction}
                    >
                        {processingAction ? (
                            <ActivityIndicator color={profile.isFriend ? colors.textPrimary : '#fff'} size="small" />
                        ) : (
                            <Text style={[styles.actionBtnText, { color: profile.isFriend ? colors.textPrimary : '#fff' }]}>
                                {profile.isFriend ? "Friends" : "Add Friend"}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statEmoji}>🔥</Text>
                        <Text style={styles.statNumber}>{profile.streak || 0}</Text>
                        <Text style={styles.statLabel}>Streak</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statEmoji}>🗓</Text>
                        <Text style={styles.statNumber}>{profile.totalCheckIns || 0}</Text>
                        <Text style={styles.statLabel}>Check-ins</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statEmoji}>🤝</Text>
                        <Text style={styles.statNumber}>{profile.friendCount || 0}</Text>
                        <Text style={styles.statLabel}>Friends</Text>
                    </View>
                </View>

                {/* Emotional Snapshot */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>7-Day Mood Summary</Text>
                    <View style={styles.moodSummaryContainer}>
                        <View style={styles.moodSummaryItem}>
                            <Text style={styles.moodSummaryEmoji}>😄</Text>
                            <Text style={styles.moodSummaryCount}>{profile.weeklyMoodSummary.great || 0}</Text>
                        </View>
                        <View style={styles.moodSummaryItem}>
                            <Text style={styles.moodSummaryEmoji}>😐</Text>
                            <Text style={styles.moodSummaryCount}>{profile.weeklyMoodSummary.okay || 0}</Text>
                        </View>
                        <View style={styles.moodSummaryItem}>
                            <Text style={styles.moodSummaryEmoji}>😞</Text>
                            <Text style={styles.moodSummaryCount}>{profile.weeklyMoodSummary.bad || 0}</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Recent Check-ins</Text>
                    {profile.recentCheckIns.length > 0 ? (
                        profile.recentCheckIns.map((ci, index) => (
                            <View key={index} style={[styles.recentItem, index === profile.recentCheckIns.length - 1 && { borderBottomWidth: 0 }]}>
                                <Text style={styles.recentEmoji}>{getMoodEmoji(ci.mood)}</Text>
                                <View style={styles.recentInfo}>
                                    <Text style={{ color: colors.textPrimary, fontWeight: '500', textTransform: 'capitalize' }}>{ci.mood}</Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 }}>{new Date(ci.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md }}>No recent check-ins.</Text>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    content: {
        padding: Spacing.lg,
    },
    centerError: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    errorTitle: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    errorMessage: {
        fontSize: FontSize.md,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.round,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: FontSize.md,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Spacing.md,
        ...Shadows.medium,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: "800",
        color: "#fff",
    },
    nameText: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    idText: {
        fontSize: FontSize.sm,
        color: colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    actionBtn: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: 10,
        borderRadius: BorderRadius.round,
        minWidth: 140,
        alignItems: 'center',
    },
    actionBtnText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    statBox: {
        flex: 1,
        backgroundColor: colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        marginHorizontal: 4,
        ...Shadows.small,
    },
    statEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    statNumber: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    statLabel: {
        fontSize: FontSize.xs,
        color: colors.textSecondary,
        marginTop: 2,
        textTransform: 'uppercase',
    },
    sectionCard: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.small,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: Spacing.lg,
    },
    moodSummaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    moodSummaryItem: {
        alignItems: 'center',
    },
    moodSummaryEmoji: {
        fontSize: 32,
        marginBottom: Spacing.xs,
    },
    moodSummaryCount: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    recentEmoji: {
        fontSize: 28,
        marginRight: Spacing.md,
    },
    recentInfo: {
        flex: 1,
    },
});
