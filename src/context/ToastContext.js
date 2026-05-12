import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../theme/colors";

const TOAST_DURATION = 4500;
const SPRING         = { damping: 20, stiffness: 200, mass: 0.6 };

const TYPE = {
  success: {
    bg:       "#0C2018",  
    border:   "#16A34A",
    stripe:   "#22C55E",
    iconBg:   "#14532D",
    iconColor:"#4ADE80",
    icon:     "✓",
    bar:      "#22C55E",
  },
  error: {
    bg:       "#200C0C",  
    border:   "#DC2626",
    stripe:   "#EF4444",
    iconBg:   "#450A0A",
    iconColor:"#FCA5A5",
    icon:     "✕",
    bar:      "#EF4444",
  },
  warning: {
    bg:       "#1E1600",   
    border:   "#D97706",
    stripe:   "#F59E0B",
    iconBg:   "#451A00",
    iconColor:"#FCD34D",
    icon:     "⚠",
    bar:      "#F59E0B",
  },
  info: {
    bg:       "#0A0C22",   
    border:   "#4F46E5",
    stripe:   "#818CF8",
    iconBg:   "#1E1B4B",
    iconColor:"#A5B4FC",
    icon:     "ℹ",
    bar:      "#818CF8",
  },
};

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};

const ProgressBar = ({ color, duration }) => {
  const width = useSharedValue(100);

  React.useEffect(() => {
    width.value = withTiming(0, { duration, easing: Easing.linear });
  }, []);

  const barStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.bar, { backgroundColor: color }, barStyle]} />
    </View>
  );
};

const ToastCard = ({ toast, onDismiss, duration }) => {
  const { type = "info", title, message } = toast;
  const t = TYPE[type] || TYPE.info;

  const translateY = useSharedValue(-120);
  const opacity    = useSharedValue(0);
  const scale      = useSharedValue(0.88);

  React.useEffect(() => {
    translateY.value = withSpring(0, SPRING);
    opacity.value    = withTiming(1, { duration: 200 });
    scale.value      = withSpring(1, SPRING);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const dismiss = useCallback(() => {
    translateY.value = withTiming(-100, { duration: 280, easing: Easing.in(Easing.quad) });
    opacity.value    = withTiming(0, { duration: 240 }, (done) => {
      if (done) runOnJS(onDismiss)();
    });
    scale.value = withTiming(0.9, { duration: 280 });
  }, [onDismiss]);

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      {/* Card */}
      <View style={[styles.card, { backgroundColor: t.bg, borderColor: t.border }]}>
        {/* Left accent stripe */}
        <View style={[styles.stripe, { backgroundColor: t.stripe }]} />

        {/* Icon */}
        <View style={[styles.icon, { backgroundColor: t.iconBg }]}>
          <Text style={[styles.iconText, { color: t.iconColor }]}>{t.icon}</Text>
        </View>

        {/* Text */}
        <View style={styles.text}>
          {title   ? <Text style={styles.title}   numberOfLines={1}>{title}</Text>   : null}
          {message ? <Text style={styles.message} numberOfLines={2}>{message}</Text> : null}
        </View>

        {/* Dismiss */}
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.5}
        >
          <View style={styles.closeBtn}>
            <Text style={styles.closeTxt}>✕</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Progress bar flush below card */}
      <ProgressBar color={t.bar} duration={duration} />
    </Animated.View>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef  = useRef(0);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({ type = "info", title, message, duration = TOAST_DURATION }) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-2), { id, type, title, message, duration }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const success = useCallback((msg, title) => show({ type: "success", title, message: msg }), [show]);
  const error   = useCallback((msg, title) => show({ type: "error",   title, message: msg }), [show]);
  const warning = useCallback((msg, title) => show({ type: "warning", title, message: msg }), [show]);
  const info    = useCallback((msg, title) => show({ type: "info",    title, message: msg }), [show]);

  const insets = useSafeAreaInsets();

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info, dismiss }}>
      {children}

      {toasts.length > 0 && (
        <View
          style={[styles.overlay, { top: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          {toasts.map((t) => (
            <ToastCard
              key={t.id}
              toast={t}
              duration={t.duration ?? TOAST_DURATION}
              onDismiss={() => dismiss(t.id)}
            />
          ))}
        </View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position:  "absolute",
    left:      12,
    right:     12,
    zIndex:    9999,
    elevation: 9999,
    gap:       8,
  },

  wrapper: {
    borderRadius: 14,
    overflow: "visible",
    ...Platform.select({
      ios: {
        shadowColor:   "#000",
        shadowOffset:  { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius:  22,
      },
    }),
  },

  card: {
    flexDirection:  "row",
    alignItems:     "center",
    borderRadius:   14,
    borderWidth:    1,
    borderLeftWidth: 0,
    paddingVertical: 13,
    paddingLeft:    16,
    paddingRight:   12,
    overflow:       "hidden",
    elevation:      20,
  },

  stripe: {
    position:               "absolute",
    left:                   0,
    top:                    0,
    bottom:                 0,
    width:                  4,
    borderTopLeftRadius:    14,
    borderBottomLeftRadius: 14,
  },

  icon: {
    width:          34,
    height:         34,
    borderRadius:   10,
    alignItems:     "center",
    justifyContent: "center",
    marginRight:    11,
    flexShrink:     0,
  },
  iconText: {
    fontSize:   14,
    fontWeight: "900",
  },

  text: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    color:         "#FFFFFF",
    fontSize:      14,
    fontWeight:    "700",
    letterSpacing: 0.1,
    marginBottom:  2,
  },
  message: {
    color:      "rgba(255,255,255,0.65)",
    fontSize:   12.5,
    lineHeight: 17,
  },

  closeBtn: {
    width:          26,
    height:         26,
    borderRadius:   8,
    backgroundColor:"rgba(255,255,255,0.10)",
    alignItems:     "center",
    justifyContent: "center",
  },
  closeTxt: {
    color:      "rgba(255,255,255,0.55)",
    fontSize:   11,
    fontWeight: "700",
  },

  track: {
    height:                  3,
    backgroundColor:         "rgba(255,255,255,0.06)",
    borderBottomLeftRadius:  14,
    borderBottomRightRadius: 14,
    overflow:                "hidden",
    marginTop:               -1,
  },
  bar: {
    height:      "100%",
    borderRadius: 2,
  },
});

export default ToastContext;