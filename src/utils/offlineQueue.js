import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_CHECKIN_KEY = "@fithex_pending_checkin";

//save pending check offline 
export const savePendingCheckIn = async (data = {}) => {
  const entry = {
    createdAt: new Date().toISOString(),
    retryCount: 0,
    qrPayload: data.qrPayload || "",
    latitude: data.latitude || 0,
    longitude: data.longitude || 0,
    ...(data.note && { note: data.note }),
  };
  await AsyncStorage.setItem(PENDING_CHECKIN_KEY, JSON.stringify(entry));
  return entry;
};

/**
 * Retrieve the pending check-in entry (if any).
 * Returns null if nothing is queued.
 */
export const getPendingCheckIn = async () => {
  const raw = await AsyncStorage.getItem(PENDING_CHECKIN_KEY);
  if (!raw) return null;

  const entry = JSON.parse(raw);
  const createdAt = new Date(entry.createdAt);
  const ageMinutes = (Date.now() - createdAt.getTime()) / 60_000;

  // Expired — older than 15 minutes
  if (ageMinutes > 15) {
    await clearPendingCheckIn();
    return null;
  }

  return entry;
};

//
export const clearPendingCheckIn = async () => {
  await AsyncStorage.removeItem(PENDING_CHECKIN_KEY);
};


export const incrementRetryCount = async () => {
  const entry = await getPendingCheckIn();
  if (!entry) return;
  entry.retryCount += 1;
  await AsyncStorage.setItem(PENDING_CHECKIN_KEY, JSON.stringify(entry));
};

/**
 * Check if a pending check-in (older than 15 minutes).
 */
export const isPendingExpired = (entry) => {
  if (!entry) return true;
  const ageMinutes = (Date.now() - new Date(entry.createdAt).getTime()) / 60_000;
  return ageMinutes > 15;
};
