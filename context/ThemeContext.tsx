import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors as DefaultColors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import { useUserId } from '@/hooks/useUserId';
import { API_BASE_URL } from '@/constants/api';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    colors: typeof DefaultColors;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Dark mode colors override
const DarkColors = {
    ...DefaultColors,
    primary: '#6C63FF', // Slightly lighter primary for dark mode
    secondary: '#FF6584',
    background: '#121212',
    surface: '#1E1E1E',
    textPrimary: '#FFFFFF',
    textSecondary: '#AAAAAA',
    border: '#333333',
    success: '#4ADE80',
    error: '#F87171',
    warning: '#FBBF24',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<Theme>('system');
    const userId = useUserId();

    // Load saved preference
    useEffect(() => {
        const loadTheme = async () => {
            try {
                // First try local storage
                const savedTheme = await AsyncStorage.getItem('theme');
                if (savedTheme) {
                    setThemeState(savedTheme as Theme);
                }

                // Check backend if user logged in
                if (userId) {
                    const res = await fetch(`${API_BASE_URL}/settings?userId=${userId}`);
                    const json = await res.json();
                    if (json.success && json.data.theme) {
                        setThemeState(json.data.theme);
                        await AsyncStorage.setItem('theme', json.data.theme);
                    }
                }
            } catch (e) {
                console.error("Failed to load theme", e);
            }
        };
        loadTheme();
    }, [userId]);

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        await AsyncStorage.setItem('theme', newTheme);

        // Sync with backend
        if (userId) {
            try {
                await fetch(`${API_BASE_URL}/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        settings: { theme: newTheme }
                    })
                });
            } catch (e) {
                console.error("Failed to sync theme", e);
            }
        }
    };

    const isDark = theme === 'system' ? systemScheme === 'dark' : theme === 'dark';
    const colors = isDark ? DarkColors : DefaultColors;

    return (
        <ThemeContext.Provider value={{ theme, setTheme, colors, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
