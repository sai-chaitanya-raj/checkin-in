import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Clipboard,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "@/constants/api";
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";

type Friend = {
  userId: string;
  publicId: string;
  email: string;
  lastCheckIn?: {
    date: string;
    mood: string;
    timestamp: string;
  };
};

type Request = {
  userId: string;
  publicId: string;
  email: string;
};

export default function CircleScreen() {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [myPublicId, setMyPublicId] = useState<string>("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [sentRequests, setSentRequests] = useState<Request[]>([]);
  const [inputPublicId, setInputPublicId] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const fetchFriendsData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/friends`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setFriends(json.data.friends);
        setRequests(json.data.requests.received);
        setSentRequests(json.data.requests.sent);
        setMyPublicId(json.data.myPublicId);
      }
    } catch (error) {
      console.error("Failed to load friend data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFriendsData();
    }, [fetchFriendsData])
  );

  const handleSendRequest = async () => {
    if (!inputPublicId.trim()) return;
    setSearching(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          targetPublicId: inputPublicId.trim().toUpperCase().replace(" ", "_"),
        }),
      });
      const json = await res.json();

      if (json.success) {
        Alert.alert("Success", "Friend request sent!");
        setInputPublicId("");
        fetchFriendsData();
      } else {
        Alert.alert("Error", json.message || "Failed to send request");
      }
    } catch (error) {
      Alert.alert("Error", "Network error");
    } finally {
      setSearching(false);
    }
  };

  const handleRespond = async (requesterId: string, action: 'accept' | 'reject') => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/friends/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ requesterId, action }),
      });
      const json = await res.json();
      if (json.success) {
        fetchFriendsData();
      } else {
        Alert.alert("Error", json.message || "Failed to respond");
      }
    } catch (error) {
      Alert.alert("Error", "Network error");
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(myPublicId);
    Alert.alert("Copied", "Your ID has been copied to clipboard.");
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.email ? item.email[0].toUpperCase() : "?"}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{item.email?.split('@')[0] || "Friend"}</Text>
          <Text style={styles.userEmail}>{item.publicId}</Text>
        </View>
      </View>
      {item.lastCheckIn ? (
        <View style={styles.moodContainer}>
          <Text style={styles.moodEmoji}>{item.lastCheckIn.mood === 'great' ? '😄' : item.lastCheckIn.mood === 'okay' ? '😐' : '😞'}</Text>
          <Text style={styles.moodDate}>{new Date(item.lastCheckIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      ) : (
        <Text style={styles.moodDate}>No recent check-in</Text>
      )}
    </View>
  );

  const renderRequest = ({ item }: { item: Request }) => (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.email[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{item.email?.split('@')[0]}</Text>
          <Text style={styles.userEmail}>ID: {item.publicId}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleRespond(item.userId, 'accept')}>
          <Text style={styles.actionBtnText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleRespond(item.userId, 'reject')}>
          <Text style={styles.actionBtnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <View style={styles.idContainer}>
          <Text style={styles.idLabel}>My ID:</Text>
          <TouchableOpacity style={styles.idBox} onPress={copyToClipboard}>
            <Text style={styles.idText}>{myPublicId || "Loading..."}</Text>
            <Ionicons name="copy-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>My Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests {requests.length > 0 && `(${requests.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'friends' ? (
          <>
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>Add a Friend</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Public ID (e.g. CIN_XXXXXX)"
                  value={inputPublicId}
                  onChangeText={setInputPublicId}
                  placeholderTextColor={Colors.textSecondary}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.addButton} onPress={handleSendRequest} disabled={searching}>
                  {searching ? <ActivityIndicator color="#fff" /> : <Ionicons name="person-add" size={20} color="#fff" />}
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(item) => item.userId}
                renderItem={renderFriend}
                ListEmptyComponent={<Text style={styles.emptyText}>No friends yet. Add someone!</Text>}
                contentContainerStyle={styles.listContent}
              />
            )}
          </>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.userId}
            renderItem={renderRequest}
            ListEmptyComponent={<Text style={styles.emptyText}>No pending requests.</Text>}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
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
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    ...Shadows.small,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.md,
    ...Shadows.small,
  },
  disabledButton: {
    backgroundColor: Colors.border,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: Colors.primary + '20', // 20% opacity
  },
  tabText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
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
  itemId: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemStatus: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.round,
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
