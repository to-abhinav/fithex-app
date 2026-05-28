import { useState, useCallback } from "react";

const DEFAULT_TIMINGS = [
  { day: "Monday",    isOpen: true,  open: "06:00", close: "22:00" },
  { day: "Tuesday",   isOpen: true,  open: "06:00", close: "22:00" },
  { day: "Wednesday", isOpen: true,  open: "06:00", close: "22:00" },
  { day: "Thursday",  isOpen: true,  open: "06:00", close: "22:00" },
  { day: "Friday",    isOpen: true,  open: "06:00", close: "22:00" },
  { day: "Saturday",  isOpen: true,  open: "06:00", close: "20:00" },
  { day: "Sunday",    isOpen: false, open: "06:00", close: "20:00" },
];

const createInitialState = (overrides = {}) => ({
  // Basic Info
  name:        "",
  contact:     "",
  description: "",
  whatsapp:    "",
  email:       "",
  website:     "",
  instagram:   "",
  facebook:    "",
  youtube:     "",

  // Location
  street:    "",
  city:      "",
  state:     "",
  pincode:   "",
  latitude:  null,
  longitude: null,

  // Amenities
  amenities: [],
  equipment: [],

  // Schedule
  timings:     DEFAULT_TIMINGS,
  gender:      "Unisex",
  minimumAge:  "16",
  maxCapacity: "100",

  // Allow callers to seed any field
  ...overrides,
});

// Step validation rules 
const STEP_VALIDATORS = [
  // Step 0: Basic Info
  (formData) => {
    const errors = [];
    if (!formData.name?.trim())    errors.push("Gym name is required.");
    if (!formData.contact?.trim()) errors.push("Contact number is required.");
    return errors;
  },
  // Step 1: Location
  (formData) => {
    const errors = [];
    if (!formData.street?.trim())  errors.push("Street address is required.");
    if (!formData.city?.trim())    errors.push("City is required.");
    if (!formData.state?.trim())   errors.push("State is required.");
    if (!formData.pincode?.trim()) errors.push("Pincode is required.");
    return errors;
  },
  () => [],
  // Step 3: Schedule (no required fields)
  () => [],
  // Step 4: Review (no required fields)
  () => [],
];

const useGymForm = (initialData) => {
  const [formData, setFormDataState] = useState(() =>
    createInitialState(initialData)
  );

  const updateField = useCallback((key, value) => {
    setFormDataState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFormData = useCallback((data) => {
    setFormDataState(createInitialState(data));
  }, []);

  const validateStep = useCallback(
    (stepIndex) => {
      const validator = STEP_VALIDATORS[stepIndex] ?? (() => []);
      const errors = validator(formData);
      return { valid: errors.length === 0, errors };
    },
    [formData]
  );

  const resetForm = useCallback(() => {
    setFormDataState(createInitialState());
  }, []);

  return {
    formData,
    updateField,
    setFormData,
    validateStep,
    resetForm,
  };
};

export default useGymForm;
