import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.API_URL;
  useEffect(() => {
    fetchUserData();
  }, []);


  const fetchUserData = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      console.log(token);
      
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#090b14] items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#090b14]">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-14 pb-4">
        <View>
          <Text className="text-xs text-white/30 uppercase tracking-widest font-medium">
            Profile
          </Text>
          <Text className="text-lg font-bold text-white mt-0.5">
            Good morning 👋
          </Text>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 items-center justify-center">
          <Text className="text-indigo-300 text-base">🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar Section */}
      <View className="items-center pt-4 pb-8">
        <LinearGradient
          colors={["#6366f1", "#8b5cf6", "#06b6d4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-24 h-24 rounded-full items-center justify-center mb-4"
        >
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=68" }}
            className="w-[86px] h-[86px] rounded-full border-2 border-[#090b14]"
          />
          <View className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-[#090b14]" />
        </LinearGradient>

        {/* ✅ Now using real user data */}
        <Text className="text-xl font-bold text-white tracking-tight">
          {user?.name || "User"}
        </Text>
        <Text className="text-sm text-indigo-300/70 font-medium mt-1">
          {user?.role === "owner" ? "Gym Owner" : "Member"} · Since{" "}
          {user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })
            : "N/A"}
        </Text>
      </View>

      {/* Stats Row */}
      <View className="flex-row gap-3 px-6 mb-4">
        <View className="flex-1 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl py-4 items-center">
          <Text className="text-2xl font-black text-indigo-300 tracking-tight">
            12
          </Text>
          <Text className="text-[11px] text-white/40 font-medium uppercase tracking-widest mt-1">
            Workouts
          </Text>
        </View>
        <View className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl py-4 items-center">
          <Text className="text-2xl font-black text-red-300 tracking-tight">
            5🔥
          </Text>
          <Text className="text-[11px] text-white/40 font-medium uppercase tracking-widest mt-1">
            Day Streak
          </Text>
        </View>
        <View className="flex-1 bg-green-500/10 border border-green-500/20 rounded-2xl py-4 items-center">
          <Text className="text-2xl font-black text-green-300 tracking-tight">
            2
          </Text>
          <Text className="text-[11px] text-white/40 font-medium uppercase tracking-widest mt-1">
            Goals
          </Text>
        </View>
      </View>

      {/* Weekly Progress Card */}
      <View className="mx-6 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 mb-3">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-semibold text-white/80">
            Weekly Goal
          </Text>
          <Text className="text-sm font-bold text-indigo-300">3 / 5</Text>
        </View>
        {/* Progress bar */}
        <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <LinearGradient
            colors={["#6366f1", "#8b5cf6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-full w-[60%] rounded-full"
          />
        </View>
        <Text className="text-[11px] text-white/30 font-medium mt-2">
          2 more workouts to hit your goal
        </Text>
      </View>

      {/* CTA Buttons */}
      <View className="flex-row gap-3 px-6 mt-2">
        <TouchableOpacity className="flex-1">
          <LinearGradient
            colors={["#6366f1", "#8b5cf6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-2xl py-4 items-center"
          >
            <Text className="text-sm font-bold text-white">Start Workout</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>navigation.navigate("Payment", { plan, gym, user })}
          className="flex-1"
        >
          <LinearGradient
            colors={["#10b981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-2xl py-4 items-center"
          >
            <Text className="text-sm font-bold text-white">Payment</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity className="w-14 bg-white/[0.06] border border-white/10 rounded-2xl items-center justify-center">
          <Text className="text-lg">⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileScreen;
