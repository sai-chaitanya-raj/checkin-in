import { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from "@/constants/theme";
import { API_BASE_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CompleteProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        age: "",
    });

    const handleSave = async () => {
        if (!formData.name || !formData.age) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/settings`, { // Re-using settings endpoint to update profile
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const json = await res.json();

            if (json.success) {
                // Update local user data if needed
                const userStr = await AsyncStorage.getItem("user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const updatedUser = { ...user, ...formData };
                    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
                }
                router.replace("/(tabs)");
            } else {
                Alert.alert("Error", json.message || "Failed to update profile");
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
                <View style={styles.header}>
                    <Text style={styles.title}>One last thing...</Text>
                    <Text style={styles.subtitle}>Tell us a bit about yourself.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholderTextColor={Colors.textSecondary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Age</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="25"
                            value={formData.age}
                            onChangeText={(text) => setFormData({ ...formData, age: text })}
                            keyboardType="numeric"
                            placeholderTextColor={Colors.textSecondary}
                        />
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Get Started</Text>
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
        padding: Spacing.xl,
        flexGrow: 1,
        justifyContent: 'center'
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
