import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [agreed, setAgreed] = useState(false);

  const getPasswordStrength = () => {
    if (password.length === 0) return { bars: 0, label: "", color: "" };
    if (password.length < 6) return { bars: 1, label: "Weak", color: "#f87171" };
    if (password.length < 10) return { bars: 2, label: "Medium", color: "#86efac" };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password))
      return { bars: 4, label: "Strong", color: "#34d399" };
    return { bars: 3, label: "Good", color: "#6ee7b7" };
  };

  const strength = getPasswordStrength();

  const inputStyle = (field) =>
    `flex-row items-center bg-white/5 rounded-2xl px-4 h-[52px] gap-3 border ${
      focusedField === field
        ? "border-indigo-500/50"
        : "border-white/[0.09]"
    }`;

    const handleRegister = async () => {
  if (!name || !email || !password) {
    Alert.alert("Error", "Please fill in all fields");
    return;
  }
  if (!agreed) {
    Alert.alert("Error", "Please accept the terms");
    return;
  }

  try {
    const response = await axios.post("http://192.168.1.4:5000/users/register", {
      name,
      email,
      password,
    });

    // save token if you're using JWT
    // await AsyncStorage.setItem("token", response.data.token);

    Alert.alert("Success", "Account created successfully!");

    navigation.navigate("Profile");
  } catch (error) {
    Alert.alert("Error", error.response?.data?.message || "Registration failed");
    console.error("Registration error:", error);
  }
};
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#090b14]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <View className="px-6 pt-14 pb-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-[34px] h-[34px] bg-white/5 border border-white/[0.09] rounded-xl items-center justify-center"
          >
            <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* Logo + Title */}
        <View className="px-6 pt-4 pb-8">
          <View className="flex-row items-center gap-3 mb-5">
            <LinearGradient
              colors={["#6366f1", "#8b5cf6"]}
              className="w-11 h-11 rounded-2xl items-center justify-center"
            >
              <Text className="text-xl">💪</Text>
            </LinearGradient>
            <Text className="text-xl font-black text-white tracking-tight">FitHex</Text>
          </View>

          <Text className="text-[28px] font-black text-white leading-tight tracking-tight">
            Create your{"\n"}
            <Text className="text-indigo-300">account</Text>
          </Text>
          <Text className="text-sm text-white/35 mt-2 font-normal">
            Start your fitness journey today
          </Text>
        </View>

        {/* Form */}
        <View className="px-6 gap-4">

          {/* Full Name */}
          <View>
            <Text className="text-[11px] text-white/40 font-semibold uppercase tracking-widest mb-2 ml-1">
              Full Name
            </Text>
           <View
  className="flex-row items-center bg-white/5 rounded-2xl px-4 h-[52px] gap-3 border border-white/[0.09]"
 style={{
  borderColor:
    focusedField === "name"
      ? "rgba(99,102,241,0.5)"
      : "rgba(255,255,255,0.09)",
}}
>
              <Ionicons name="person-outline" size={16} color="rgba(165,180,252,0.5)" />
              <TextInput
                className="flex-1 text-[15px] text-white font-normal"
                placeholder="Abhinav Kumar"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email */}
          <View>
            <Text className="text-[11px] text-white/40 font-semibold uppercase tracking-widest mb-2 ml-1">
              Email Address
            </Text>
            <View className={inputStyle("email")}>
              <Ionicons name="mail-outline" size={16} color="rgba(165,180,252,0.5)" />
              <TextInput
                className="flex-1 text-[15px] text-white font-normal"
                placeholder="you@fithex.io"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password */}
          <View>
            <Text className="text-[11px] text-white/40 font-semibold uppercase tracking-widest mb-2 ml-1">
              Password
            </Text>
            <View className={inputStyle("password")}>
              <Ionicons name="lock-closed-outline" size={16} color="rgba(165,180,252,0.5)" />
              <TextInput
                className="flex-1 text-[15px] text-white font-normal"
                placeholder="Min. 8 characters"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={16}
                  color="rgba(255,255,255,0.25)"
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength */}
            {password.length > 0 && (
              <View className="mt-2 px-1">
                <View className="flex-row gap-1 mb-1">
                  {[1, 2, 3, 4].map((bar) => (
                    <View
                      key={bar}
                      className="flex-1 h-[3px] rounded-full"
                      style={{
                        backgroundColor:
                          bar <= strength.bars ? strength.color : "rgba(255,255,255,0.1)",
                      }}
                    />
                  ))}
                </View>
                <Text className="text-[11px] font-medium" style={{ color: strength.color }}>
                  {strength.label} password
                </Text>
              </View>
            )}
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity
            className="flex-row items-start gap-3 pt-1"
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.7}
          >
            <View
              className="w-[18px] h-[18px] rounded-md items-center justify-center mt-0.5"
              style={{
                backgroundColor: agreed ? undefined : "rgba(255,255,255,0.06)",
                borderWidth: agreed ? 0 : 1,
                borderColor: "rgba(255,255,255,0.15)",
              }}
            >
              {agreed ? (
                <LinearGradient
                  colors={["#6366f1", "#8b5cf6"]}
                  className="w-full h-full rounded-md items-center justify-center"
                >
                  <Ionicons name="checkmark" size={11} color="#fff" />
                </LinearGradient>
              ) : null}
            </View>
            <Text className="flex-1 text-xs text-white/35 leading-relaxed">
              I agree to the{" "}
              <Text className="text-indigo-300 font-semibold">Terms of Service</Text> and{" "}
              <Text className="text-indigo-300 font-semibold">Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Create Account Button */}
          <TouchableOpacity
            className="mt-2"
            activeOpacity={0.85}
            onPress={ handleRegister}
          >
            <LinearGradient
              colors={["#6366f1", "#8b5cf6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-2xl py-4 items-center"
              style={{ shadowColor: "#6366f1", shadowOpacity: 0.4, shadowRadius: 20, elevation: 6 }}
            >
              <Text className="text-base font-bold text-white tracking-wide">
                Create Account
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center gap-3 my-1">
            <View className="flex-1 h-px bg-white/[0.07]" />
            <Text className="text-xs text-white/25 font-medium">or sign up with</Text>
            <View className="flex-1 h-px bg-white/[0.07]" />
          </View>

          {/* Social Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 bg-white/5 border border-white/[0.09] rounded-2xl py-3.5"
              activeOpacity={0.7}
            >
              {/* Google icon */}
              <Text className="text-base">G</Text>
              <Text className="text-sm font-semibold text-white/60">Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 bg-white/5 border border-white/[0.09] rounded-2xl py-3.5"
              activeOpacity={0.7}
            >
              <Ionicons name="logo-apple" size={16} color="rgba(255,255,255,0.6)" />
              <Text className="text-sm font-semibold text-white/60">Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <TouchableOpacity
            className="items-center mt-2"
            onPress={() => navigation.navigate("Login")}
          >
            <Text className="text-sm text-white/30">
              Already have an account?{" "}
              <Text className="text-indigo-300 font-semibold">Sign In</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;