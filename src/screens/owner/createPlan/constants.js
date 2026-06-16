import colors from "../../../theme/colors";

export const PLAN_NAMES = ["Monthly", "Quarterly", "Half-Yearly", "Yearly", "Custom"];
export const CATEGORIES = ["Strength", "Cardio", "Yoga"];
export const DURATION_MAP = { Monthly: 1, Quarterly: 3, "Half-Yearly": 6, Yearly: 12 };

export const CAT_META = {
  Strength: { icon: "barbell-outline", color: colors.primary },
  Cardio:   { icon: "heart-outline",   color: colors.danger },
  Yoga:     { icon: "leaf-outline",     color: colors.success },
};

export const STEPS = [
  { title: "Plan Basics", icon: "layers-outline" },
  { title: "Pricing",     icon: "pricetag-outline" },
  { title: "Features",    icon: "star-outline" },
];

export const FEATURE_SUGGESTIONS = [
  "AC", "Locker", "Personal Trainer", "Shower", "Parking",
  "Wi-Fi", "Steam Room", "Group Classes", "Diet Plan", "24/7 Access",
];
