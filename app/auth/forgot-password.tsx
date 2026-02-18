import { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from "@/constants/theme";
import { API_BASE_URL } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");

    const handleReset = async () => {
        if (!email) {
            Alert.alert("Error", "Please enter your email");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const json = await res.json();

            if (json.success) {
                Alert.alert("Success", "Password reset instructions sent to your email.");
                router.back();
            } else {
                Alert.alert("Error", json.message || "Failed to send reset link");
            }
        } catch (error) {
            Alert.alert("Error", "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Forgot Password</Text>
                    <Text style={styles.subtitle}>Enter your email to receive reset instructions.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="john@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholderTextColor={Colors.textSecondary}
                        />
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Send Reset Link</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    backButton: {
        marginBottom: Spacing.md,
    },
    header: {
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: "800",
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
    },
    form: {
        gap: Spacing.lg,
    },
    inputGroup: {
        gap: Spacing.xs,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: "600",
        color: Colors.textPrimary,
    },
    input: {
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        ...Shadows.small,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: "center",
        marginTop: Spacing.md,
        ...Shadows.medium,
    },
    buttonText: {
        color: "#fff",
        fontSize: FontSize.md,
        fontWeight: "700",
    },
});
