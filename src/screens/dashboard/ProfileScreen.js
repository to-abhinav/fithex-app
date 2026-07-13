
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useToast } from "../../context/ToastContext";
import { useNotifications } from "../../context/NotificationContext";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import api from "../../api/axios";
import { getMyRequest, cancelMyRequest } from "../../api/gymService";

import { formatVisitTime, getGoalLabel } from "./profile/helpers";

import ProfileHeader from "./profile/components/ProfileHeader";
import StatsRow from "./profile/components/StatsRow";
import WeeklyGoalCard from "./profile/components/WeeklyGoalCard";
import MembershipCard from "./profile/components/MembershipCard";
import RecentActivityCard from "./profile/components/RecentActivityCard";
import QuickActionButtons from "./profile/components/QuickActionButtons";
import OwnerGymSection from "./profile/components/OwnerGymSection";
import SettingsSection from "./profile/components/SettingsSection";
import ImagePickerModal from "./profile/components/ImagePickerModal";
import EditProfileModal from "./profile/components/EditProfileModal";
import PrivacySecurityModal from "./profile/components/PrivacySecurityModal";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { signOut, userRole } = useAuth();
  const { unreadCount } = useNotifications();
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [cancellingRequest, setCancellingRequest] = useState(false);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState("avatar");
  const [avatars, setAvatars] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    age: "",
    gender: "",
    heightCm: "",
    weight: "",
    goalWeight: "",
    fitnessGoal: "",
  });

  const [showPrivacySecurity, setShowPrivacySecurity] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);


  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get("/auth/profile");
      setUser(response.data);
      if (response.data?.role !== "owner") {
        fetchMembership();
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembership = async () => {
    try {
      setMembershipLoading(true);
      const res = await api.get("/members/me");
      setMembership(res.data);
      setPendingRequest(null);
    } catch (error) {
      if (error.response?.status === 404) {
        setMembership(null);
        try {
          const res = await getMyRequest();
          const requestsList = res?.requests ?? [];
          const pending = requestsList.find(
            (r) => r.status === "Pending" || r.status === "pending"
          );
          setPendingRequest(pending || null);
        } catch {
          setPendingRequest(null);
        }
      } else {
        console.error("Error fetching membership:", error);
        setMembership(null);
        setPendingRequest(null);
      }
    } finally {
      setMembershipLoading(false);
    }
  };

  const fetchAvatars = useCallback(async () => {
    try {
      const res = await api.get("/users/avatars");
      setAvatars(res.data.avatars || []);
    } catch (err) {
      console.error("Error fetching avatars:", err);
    }
  }, []);


  const handleCancelRequest = () => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel your membership request? You can apply again at any time.",
      [
        { text: "Keep It", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingRequest(true);
              await cancelMyRequest(pendingRequest._id);
              setPendingRequest(null);
              toast.success("Request cancelled.");
            } catch (err) {
              toast.error(err?.response?.data?.message || "Failed to cancel request.");
            } finally {
              setCancellingRequest(false);
            }
          },
        },
      ]
    );
  };

  const openPicker = () => {
    setShowPicker(true);
    if (avatars.length === 0) fetchAvatars();
  };

  const handleAvatarSelect = async (avatarId) => {
    try {
      setUploading(true);
      setSelectedAvatarId(avatarId);
      const res = await api.patch("/users/profile-image", { avatarId });
      setUser((prev) => ({ ...prev, profileImage: res.data.profileImage }));
      setShowPicker(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update avatar.");
    } finally {
      setUploading(false);
      setSelectedAvatarId(null);
    }
  };

  const pickImage = async (useCamera = false) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          toast.warning("Camera access is needed to take a photo.");
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          toast.warning("Photo library access is needed.");
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
          });

      if (result.canceled) return;

      const asset = result.assets[0];
      setUploading(true);

      const formData = new FormData();
      formData.append("profileImage", {
        uri: Platform.OS === "ios" ? asset.uri.replace("file://", "") : asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || `profile_${Date.now()}.jpg`,
      });

      const res = await api.patch("/users/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser((prev) => ({ ...prev, profileImage: res.data.profileImage }));
      setShowPicker(false);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  const openEditProfile = () => {
    setEditForm({
      name:        user?.name        ?? "",
      age:         user?.age         != null ? String(user.age)        : "",
      gender:      user?.gender      ?? "",
      heightCm:    user?.heightCm    != null ? String(user.heightCm)   : "",
      weight:      user?.weight      != null ? String(user.weight)     : "",
      goalWeight:  user?.goalWeight  != null ? String(user.goalWeight) : "",
      fitnessGoal: user?.fitnessGoal ?? "",
    });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      setEditSaving(true);
      const payload = {};
      if (editForm.name.trim())       payload.name        = editForm.name.trim();
      if (editForm.age)               payload.age         = parseInt(editForm.age, 10);
      if (editForm.gender)            payload.gender      = editForm.gender;
      if (editForm.heightCm)         payload.heightCm    = parseFloat(editForm.heightCm);
      if (editForm.weight)            payload.weight      = parseFloat(editForm.weight);
      if (editForm.goalWeight)        payload.goalWeight  = parseFloat(editForm.goalWeight);
      if (editForm.fitnessGoal)       payload.fitnessGoal = editForm.fitnessGoal;

      const res = await api.put("/users/profile", payload);
      setUser((prev) => ({ ...prev, ...res.data.user }));
      setShowEditProfile(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const { current, new: newPw, confirm } = passwordForm;
    if (!current || !newPw || !confirm) {
      toast.warning("Please fill in all password fields.");
      return;
    }
    if (newPw.length < 6) {
      toast.warning("New password must be at least 6 characters.");
      return;
    }
    if (!/\d/.test(newPw)) {
      toast.warning("Password must contain at least one number.");
      return;
    }
    if (newPw === current) {
      toast.warning("New password must be different from current.");
      return;
    }
    if (newPw !== confirm) {
      toast.warning("New passwords don't match.");
      return;
    }
    try {
      setPasswordSaving(true);
      await api.put("/users/change-password", {
        currentPassword: current,
        newPassword: newPw,
      });
      toast.success("Password changed successfully!");
      setPasswordForm({ current: "", new: "", confirm: "" });
      setShowPasswords({ current: false, new: false, confirm: false });
      setShowPrivacySecurity(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data. This cannot be undone.\n\nAre you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: () => setShowDeleteConfirm(true),
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast.warning("Please enter your password to confirm.");
      return;
    }
    try {
      setDeleteLoading(true);
      await api.delete("/users/account", { data: { password: deletePassword } });
      toast.success("Account deleted.");
      signOut();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };


  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#09090f", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={["rgba(99,102,241,0.2)", "rgba(0,0,0,0)"]}
          style={{ position: "absolute", inset: 0 }}
        />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 14, fontWeight: "500" }}>
          Loading profile…
        </Text>
      </View>
    );
  }


  const displayName = user?.name || "Athlete";
  const memberRole  = user?.role === "owner" ? "Gym Owner" : "Member";
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "N/A";
  const goalLabel = getGoalLabel(user?.fitnessGoal);


  return (
    <View style={{ flex: 1, backgroundColor: "#09090f" }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <ProfileHeader
          user={user}
          displayName={displayName}
          memberRole={memberRole}
          memberSince={memberSince}
          unreadCount={unreadCount}
          onOpenPicker={openPicker}
          onNotifications={() => navigation.navigate('Notifications')}
        />

        <StatsRow
          user={user}
          goalLabel={goalLabel}
          formatVisitTime={formatVisitTime}
        />

        {userRole !== 'owner' && (
          <WeeklyGoalCard user={user} />
        )}

        {userRole !== 'owner' && (
          <MembershipCard
            membership={membership}
            membershipLoading={membershipLoading}
            pendingRequest={pendingRequest}
            cancellingRequest={cancellingRequest}
            onCancelRequest={handleCancelRequest}
            navigation={navigation}
          />
        )}

        {userRole !== 'owner' && (
          <RecentActivityCard />
        )}

        {userRole !== 'owner' && (
          <QuickActionButtons />
        )}

        {userRole === 'owner' && (
          <OwnerGymSection user={user} navigation={navigation} />
        )}

        <SettingsSection
          unreadCount={unreadCount}
          onEditProfile={openEditProfile}
          onPrivacySecurity={() => {
            setShowPrivacySecurity(true);
            setShowDeleteConfirm(false);
            setDeletePassword("");
            setShowDeletePassword(false);
          }}
          onLogout={handleLogout}
          navigation={navigation}
        />

        <Animated.View entering={FadeInDown.delay(900).springify()} style={{ alignItems: "center", marginTop: 8 }}>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", fontWeight: "500" }}>
            FitHex · v1.0.0
          </Text>
        </Animated.View>
      </ScrollView>

      <ImagePickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        avatars={avatars}
        user={user}
        uploading={uploading}
        selectedAvatarId={selectedAvatarId}
        pickerTab={pickerTab}
        onTabChange={setPickerTab}
        onAvatarSelect={handleAvatarSelect}
        onPickImage={pickImage}
      />

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        editForm={editForm}
        onChangeForm={setEditForm}
        onSave={handleSaveProfile}
        saving={editSaving}
      />

      <PrivacySecurityModal
        visible={showPrivacySecurity}
        onClose={() => setShowPrivacySecurity(false)}
        passwordForm={passwordForm}
        showPasswords={showPasswords}
        onTogglePasswordVisibility={(field) =>
          setShowPasswords((p) => ({ ...p, [field]: !p[field] }))
        }
        onChangePasswordForm={setPasswordForm}
        onSubmitPassword={handleChangePassword}
        passwordSaving={passwordSaving}
        showDeleteConfirm={showDeleteConfirm}
        deletePassword={deletePassword}
        showDeletePassword={showDeletePassword}
        deleteLoading={deleteLoading}
        onDeleteAccount={handleDeleteAccount}
        onConfirmDelete={confirmDeleteAccount}
        onCancelDelete={() => {
          setShowDeleteConfirm(false);
          setDeletePassword("");
          setShowDeletePassword(false);
        }}
        onSetDeletePassword={setDeletePassword}
        onToggleDeletePassword={() => setShowDeletePassword((p) => !p)}
      />
    </View>
  );
};

export default ProfileScreen;
