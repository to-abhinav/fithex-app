import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Image,
  Alert,
  Switch,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import colors from "../../../theme/colors";
import {
  updateGym,
  updateTimings,
  toggleGymStatus,
  deleteGym,
  updateGymImages,
  addGalleryImages,
} from "../../../api/gymService";
import useGymForm from "../hooks/useGymForm";
import BasicInfoForm from "./GymForm/BasicInfoForm";
import LocationForm from "./GymForm/LocationForm";
import AmenitiesForm from "./GymForm/AmenitiesForm";
import ScheduleForm from "./GymForm/ScheduleForm";

// ─── Tab Definitions 
const TABS = [
  { key: "details", label: "Details", icon: "information-circle-outline" },
  { key: "location", label: "Location", icon: "location-outline" },
  { key: "amenities", label: "Amenities", icon: "grid-outline" },
  { key: "schedule", label: "Schedule", icon: "time-outline" },
  { key: "images", label: "Images", icon: "images-outline" },
  { key: "settings", label: "Settings", icon: "settings-outline" },
];

// ─── Toast Component 
const SuccessToast = ({ message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify()}
      exiting={FadeOut.duration(250)}
      style={styles.toast}
    >
      <Ionicons name="checkmark-circle" size={18} color={colors.textPrimary} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

// ─── Main Component ─
const EditTabs = ({ gym, onGymUpdated }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const tabScrollRef = useRef(null);

  // Images tab state
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [profileUri, setProfileUri] = useState(gym.images?.profile || null);
  const [bannerUri, setBannerUri] = useState(gym.images?.cover || null);
  const [galleryUris, setGalleryUris] = useState(gym.images?.gallery || []);

  // Settings tab state
  const [gymActive, setGymActive] = useState(gym.isActive !== false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Map backend gym model fields → flat form fields used by useGymForm
  const initialData = {
    name: gym.name || "",
    contact: gym.contactNumber || "",
    description: gym.description || "",
    whatsapp: gym.whatsappNumber || "",
    email: gym.email || "",
    website: gym.website || "",
    street: gym.address?.street || "",
    city: gym.address?.city || "",
    state: gym.address?.state || "",
    pincode: gym.address?.pincode || "",
    longitude: gym.location?.coordinates?.[0] || null,
    latitude: gym.location?.coordinates?.[1] || null,
    amenities: gym.amenities || [],
    equipment: gym.equipment || [],
    timings: (gym.timings && gym.timings.length > 0)
      ? gym.timings.map((t) => ({
          day: t.day,
          isOpen: !t.isClosed,
          open: t.openTime || "06:00",
          close: t.closeTime || "22:00",
        }))
      : undefined,
    gender: gym.genderPolicy || "Unisex",
    minimumAge: gym.minimumAge?.toString() || "16",
    maxCapacity: gym.maxCapacity?.toString() || "100",
    instagram: gym.socialLinks?.instagram || "",
    facebook: gym.socialLinks?.facebook || "",
    youtube: gym.socialLinks?.youtube || "",
  };

  const { formData, updateField, setFormData } = useGymForm(initialData);

  // Sync form when gym prop changes (e.g. after a refetch)
  useEffect(() => {
    setFormData({
      name: gym.name || "",
      contact: gym.contactNumber || "",
      description: gym.description || "",
      whatsapp: gym.whatsappNumber || "",
      email: gym.email || "",
      website: gym.website || "",
      street: gym.address?.street || "",
      city: gym.address?.city || "",
      state: gym.address?.state || "",
      pincode: gym.address?.pincode || "",
      longitude: gym.location?.coordinates?.[0] || null,
      latitude: gym.location?.coordinates?.[1] || null,
      amenities: gym.amenities || [],
      equipment: gym.equipment || [],
      timings: (gym.timings && gym.timings.length > 0)
        ? gym.timings.map((t) => ({
            day: t.day,
            isOpen: !t.isClosed,
            open: t.openTime || "06:00",
            close: t.closeTime || "22:00",
          }))
        : formData.timings,
      gender: gym.genderPolicy || formData.gender,
      minimumAge: gym.minimumAge?.toString() || formData.minimumAge,
      maxCapacity: gym.maxCapacity?.toString() || formData.maxCapacity,
      instagram: gym.socialLinks?.instagram || "",
      facebook: gym.socialLinks?.facebook || "",
      youtube: gym.socialLinks?.youtube || "",
    });
    setProfileUri(gym.images?.profile || null);
    setBannerUri(gym.images?.cover || null);
    setGalleryUris(gym.images?.gallery || []);
    setGymActive(gym.isActive !== false);
  }, [gym._id]);

  // ── Toast helper 
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
  }, []);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // ── Save: Details 
  const saveDetails = useCallback(async () => {
    Keyboard.dismiss();
    setSaveError(null);
    setSaving(true);
    try {
      await updateGym(gym._id, {
        name: formData.name,
        contactNumber: formData.contact,
        description: formData.description,
        whatsappNumber: formData.whatsapp || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        socialLinks: {
          instagram: formData.instagram || "",
          facebook: formData.facebook || "",
          youtube: formData.youtube || "",
        },
      });
      showToast("Details saved!");
      onGymUpdated();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to save details";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, [gym._id, formData, showToast, onGymUpdated]);

  // ── Save: Location 
  const saveLocation = useCallback(async () => {
    Keyboard.dismiss();
    setSaveError(null);
    setSaving(true);
    try {
      await updateGym(gym._id, {
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        location: {
          coordinates:
            formData.longitude && formData.latitude
              ? [parseFloat(formData.longitude), parseFloat(formData.latitude)]
              : undefined,
        },
      });
      showToast("Location saved!");
      onGymUpdated();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to save location";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, [gym._id, formData, showToast, onGymUpdated]);

  // ── Save: Amenities 
  const saveAmenities = useCallback(async () => {
    Keyboard.dismiss();
    setSaveError(null);
    setSaving(true);
    try {
      await updateGym(gym._id, {
        amenities: formData.amenities,
        equipment: formData.equipment,
      });
      showToast("Amenities saved!");
      onGymUpdated();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to save amenities";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, [gym._id, formData, showToast, onGymUpdated]);

  // ── Save: Schedule ──────────────────────────────────────────────────────
  const saveSchedule = useCallback(async () => {
    Keyboard.dismiss();
    setSaveError(null);
    setSaving(true);
    try {
      // Map form timings back to backend format
      const backendTimings = formData.timings.map((t) => ({
        day: t.day,
        openTime: t.open,
        closeTime: t.close,
        isClosed: !t.isOpen,
      }));
      await updateTimings(gym._id, backendTimings);
      showToast("Schedule saved!");
      onGymUpdated();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to save schedule";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, [gym._id, formData.timings, showToast, onGymUpdated]);

  // ── Pick & Upload Image 
  const pickAndUploadImage = useCallback(
    async (type) => {
      const isProfile = type === "profile";
      const setUploading = isProfile ? setUploadingProfile : setUploadingBanner;

      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: isProfile ? [1, 1] : [16, 9],
        });

        if (result.canceled) return;
        const asset = result.assets[0];
        setUploading(true);
        setSaveError(null);

        const fd = new FormData();
        fd.append(isProfile ? "profileImage" : "bannerImage", {
          uri: asset.uri,
          name: `${type}.jpg`,
          type: "image/jpeg",
        });

        await updateGymImages(gym._id, fd);

        if (isProfile) setProfileUri(asset.uri);
        else setBannerUri(asset.uri);

        showToast(`${isProfile ? "Profile" : "Banner"} uploaded!`);
        onGymUpdated();
      } catch (err) {
        const msg =
          err.response?.data?.message || err.message || "Upload failed";
        setSaveError(msg);
      } finally {
        setUploading(false);
      }
    },
    [gym._id, showToast, onGymUpdated]
  );

  // ── Pick & Upload Gallery Images 
  const pickAndUploadGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 15 - galleryUris.length,
      });

      if (result.canceled || !result.assets?.length) return;

      setUploadingGallery(true);
      setSaveError(null);

      const fd = new FormData();
      result.assets.forEach((asset, i) => {
        fd.append("galleryImages", {
          uri: asset.uri,
          name: `gallery_${i}.jpg`,
          type: "image/jpeg",
        });
      });

      const res = await addGalleryImages(gym._id, fd);
      setGalleryUris(res.images?.gallery || []);
      showToast(`${result.assets.length} image(s) uploaded!`);
      onGymUpdated();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Gallery upload failed";
      setSaveError(msg);
    } finally {
      setUploadingGallery(false);
    }
  }, [gym._id, galleryUris.length, showToast, onGymUpdated]);

  // ── Remove Gallery Image
  const removeGalleryImage = useCallback(
    async (indexToRemove) => {
      Alert.alert("Remove Image", "Remove this image from gallery?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);
              const newGallery = galleryUris.filter((_, i) => i !== indexToRemove);
              await updateGym(gym._id, { images: { gallery: newGallery } });
              setGalleryUris(newGallery);
              showToast("Image removed");
              onGymUpdated();
            } catch (err) {
              const msg =
                err.response?.data?.message || err.message || "Failed to remove image";
              setSaveError(msg);
            } finally {
              setSaving(false);
            }
          },
        },
      ]);
    },
    [gym._id, galleryUris, showToast, onGymUpdated]
  );

  // ── Toggle Gym Status 
  const handleToggleStatus = useCallback(async () => {
    setTogglingStatus(true);
    setSaveError(null);
    try {
      await toggleGymStatus(gym._id);
      setGymActive((prev) => !prev);
      showToast(gymActive ? "Gym deactivated" : "Gym activated!");
      onGymUpdated();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to toggle status";
      setSaveError(msg);
    } finally {
      setTogglingStatus(false);
    }
  }, [gym._id, gymActive, showToast, onGymUpdated]);

  // ── Delete Gym ──
  const handleDeleteGym = useCallback(() => {
    Alert.alert(
      "Delete Gym",
      "This action is permanent and cannot be undone. Are you sure you want to delete your gym?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            setSaveError(null);
            try {
              await deleteGym(gym._id);
              showToast("Gym deleted");
              onGymUpdated();
            } catch (err) {
              const msg =
                err.response?.data?.message ||
                err.message ||
                "Failed to delete gym";
              setSaveError(msg);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }, [gym._id, showToast, onGymUpdated]);

  // ── Clear error on tab change
  const handleTabChange = useCallback((key) => {
    setSaveError(null);
    setActiveTab(key);
  }, []);

  // ── Render tab content 
  const renderTabContent = () => {
    switch (activeTab) {
      case "details":
        return (
          <Animated.View
            key="details"
            entering={FadeInDown.delay(50).duration(350)}
          >
            <BasicInfoForm
              formData={formData}
              onUpdate={updateField}
              errors={[]}
            />
          </Animated.View>
        );

      case "location":
        return (
          <Animated.View
            key="location"
            entering={FadeInDown.delay(50).duration(350)}
          >
            <LocationForm
              formData={formData}
              onUpdate={updateField}
              errors={[]}
            />
          </Animated.View>
        );

      case "amenities":
        return (
          <Animated.View
            key="amenities"
            entering={FadeInDown.delay(50).duration(350)}
          >
            <AmenitiesForm formData={formData} onUpdate={updateField} />
          </Animated.View>
        );

      case "schedule":
        return (
          <Animated.View
            key="schedule"
            entering={FadeInDown.delay(50).duration(350)}
          >
            <ScheduleForm formData={formData} onUpdate={updateField} />
          </Animated.View>
        );

      case "images":
        return (
          <Animated.View
            key="images"
            entering={FadeInDown.delay(50).duration(350)}
            style={styles.imagesWrap}
          >
            {/* Banner Image */}
            <Text style={styles.imgSectionTitle}>Banner Image</Text>
            <View style={styles.bannerCard}>
              {bannerUri ? (
                <Image source={{ uri: bannerUri }} style={styles.bannerImage} />
              ) : (
                <View style={styles.bannerPlaceholder}>
                  <Ionicons name="image-outline" size={36} color={colors.textMuted} />
                  <Text style={styles.imgPlaceholderText}>No banner set</Text>
                </View>
              )}
              {uploadingBanner && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => pickAndUploadImage("banner")}
              activeOpacity={0.85}
              disabled={uploadingBanner}
              style={styles.imgPickerBtn}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
              <Text style={styles.imgPickerBtnText}>Change Banner</Text>
            </TouchableOpacity>

            {/* Profile Image */}
            <Text style={[styles.imgSectionTitle, { marginTop: 28 }]}>Profile Photo</Text>
            <View style={styles.profileCard}>
              {profileUri ? (
                <Image source={{ uri: profileUri }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Ionicons name="person-outline" size={36} color={colors.textMuted} />
                </View>
              )}
              {uploadingProfile && (
                <View style={styles.uploadOverlayCircle}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => pickAndUploadImage("profile")}
              activeOpacity={0.85}
              disabled={uploadingProfile}
              style={styles.imgPickerBtn}
            >
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
              <Text style={styles.imgPickerBtnText}>Change Profile Photo</Text>
            </TouchableOpacity>

            <Text style={[styles.imgSectionTitle, { marginTop: 28 }]}>Gallery ({galleryUris.length}/15)</Text>
            <View style={styles.galleryGrid}>
              {galleryUris.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.galleryThumb}>
                  <Image source={{ uri }} style={styles.galleryImage} />
                  <TouchableOpacity
                    onPress={() => removeGalleryImage(index)}
                    style={styles.galleryRemoveBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={14} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              ))}
              {galleryUris.length < 15 && (
                <TouchableOpacity
                  onPress={pickAndUploadGallery}
                  disabled={uploadingGallery}
                  activeOpacity={0.8}
                  style={styles.galleryAddBtn}
                >
                  {uploadingGallery ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="add" size={28} color={colors.primary} />
                      <Text style={styles.galleryAddText}>Add</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        );

      case "settings":
        return (
          <Animated.View
            key="settings"
            entering={FadeInDown.delay(50).duration(350)}
            style={styles.settingsWrap}
          >
            {/* Gym Status Toggle */}
            <View style={styles.settingsCard}>
              <View style={styles.settingsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>Gym Status</Text>
                  <Text style={styles.settingsHint}>
                    {gymActive ? "Your gym is visible to users" : "Your gym is hidden from search"}
                  </Text>
                </View>
                <View style={styles.statusRight}>
                  <View style={[styles.statusBadge, gymActive ? styles.statusActive : styles.statusInactive]}>
                    <View style={[styles.statusDot, { backgroundColor: gymActive ? colors.success : colors.danger }]} />
                    <Text style={[styles.statusBadgeText, { color: gymActive ? colors.success : colors.danger }]}>
                      {gymActive ? "Active" : "Inactive"}
                    </Text>
                  </View>
                  {togglingStatus ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 12 }} />
                  ) : (
                    <Switch
                      value={gymActive}
                      onValueChange={handleToggleStatus}
                      trackColor={{ false: colors.border, true: `${colors.primary}60` }}
                      thumbColor={gymActive ? colors.primary : colors.textMuted}
                    />
                  )}
                </View>
              </View>
            </View>

            <View style={styles.dangerCard}>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <Text style={styles.dangerHint}>
                Permanently delete your gym and all associated data.
              </Text>
              <TouchableOpacity
                onPress={handleDeleteGym}
                activeOpacity={0.85}
                disabled={saving}
                style={styles.deleteButton}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color={colors.textPrimary} />
                    <Text style={styles.deleteButtonText}>Delete Gym</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Gym ID */}
            <Text selectable style={styles.gymIdText}>
              Gym ID: {gym._id}
            </Text>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  const renderSaveButton = () => {
    const tabConfig = {
      details: { label: "Save Details", onPress: saveDetails, icon: "save-outline" },
      location: { label: "Save Location", onPress: saveLocation, icon: "navigate-outline" },
      amenities: { label: "Save Amenities", onPress: saveAmenities, icon: "checkmark-done-outline" },
      schedule: { label: "Save Schedule", onPress: saveSchedule, icon: "time-outline" },
    };

    const config = tabConfig[activeTab];
    if (!config) return null;

    return (
      <Animated.View
        entering={FadeInUp.delay(100).duration(400)}
        style={styles.saveSection}
      >
        {/* Inline Error */}
        {saveError && (
          <Animated.View
            entering={FadeInDown.duration(250)}
            style={styles.errorBanner}
          >
            <Ionicons name="alert-circle" size={15} color={colors.danger} />
            <Text style={styles.errorText}>{saveError}</Text>
          </Animated.View>
        )}

        <TouchableOpacity
          onPress={config.onPress}
          activeOpacity={0.85}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons
                name={config.icon}
                size={18}
                color={colors.textPrimary}
              />
              <Text style={styles.saveButtonText}>{config.label}</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {toastMessage && (
        <SuccessToast message={toastMessage} onDismiss={dismissToast} />
      )}

      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleTabChange(tab.key)}
                activeOpacity={0.8}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabPillText,
                    isActive && styles.tabPillTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>

      {renderSaveButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  toast: {
    position: "absolute",
    top: 8,
    left: 20,
    right: 20,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.success,
  },
  toastText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabPillActive: {
    backgroundColor: `${colors.primary}1F`,
    borderColor: colors.primary,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabPillTextActive: {
    color: colors.primary,
  },

  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },

  placeholderWrap: {
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: "center",
  },
  placeholderCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    width: "100%",
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 14,
    marginBottom: 6,
  },
  placeholderText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },

  // ── Save Section 
  saveSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  // ── Error Banner 
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: `${colors.danger}14`,
    borderWidth: 1,
    borderColor: `${colors.danger}30`,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: "500",
    flex: 1,
  },

  // ── Images Tab 
  imagesWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  imgSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  bannerCard: {
    height: 180,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  bannerPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imgPlaceholderText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },
  profileCard: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    alignSelf: "center",
    position: "relative",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  profilePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  uploadOverlayCircle: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 60,
  },
  imgPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  imgPickerBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  galleryThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  galleryRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryAddBtn: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: `${colors.primary}50`,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.primary}0D`,
  },
  galleryAddText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 2,
  },

  // ── Settings Tab 
  settingsWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  settingsHint: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
  statusRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: `${colors.success}1A`,
  },
  statusInactive: {
    backgroundColor: `${colors.danger}1A`,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Danger Zone 
  dangerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: `${colors.danger}33`,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.danger,
    marginBottom: 6,
  },
  dangerHint: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.danger,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  gymIdText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
});

export default EditTabs;
