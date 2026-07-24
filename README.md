<p align="center">
  <img src="./assets/logo.png" alt="FitHex Logo" width="120" height="120" style="border-radius: 24px;" />
</p>

<h1 align="center">FitHex</h1>

<p align="center">
  <strong>Your All-in-One Gym Membership & Fitness Tracking Platform</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-environment-variables">Environment</a> •
  <a href="#-building-for-production">Build</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK" />
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-green?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
</p>

---

## 📖 Overview

**FitHex** is a modern, full-featured mobile application built with React Native & Expo that bridges the gap between **gym owners** and **gym members**. It provides a seamless platform for discovering nearby gyms, managing memberships, tracking fitness progress, processing payments, and running a gym business — all from a single app.

The app implements a **dual-role architecture**: depending on whether you sign up as a **Member** or an **Owner**, you get an entirely different experience tailored to your needs.

---

## ✨ Features

### 🏋️ For Gym Members

| Feature | Description |
|---|---|
| **🔍 Explore Nearby Gyms** | Location-based gym discovery using GPS. Browse gym details, photos, ratings, timings, and amenities. |
| **📋 Membership Plans** | View and compare plans offered by any gym. Subscribe and pay directly through the app. |
| **📱 QR Check-In / Check-Out** | Scan the gym's QR code to log entry and exit. Includes geolocation verification to prevent misuse. |
| **📊 Gym Log & Streak Tracking** | Complete history of all gym visits with session durations. Earn and maintain workout streaks. |
| **⚖️ Weight Tracker** | Log daily weight entries and visualize progress over time with interactive charts. |
| **👤 Profile Management** | Edit personal info, upload/change profile & cover photos, set weekly workout goals. |
| **🔔 Push Notifications** | Real-time alerts for membership approvals, announcements, closures, and more. |
| **💳 Online Payments** | Secure in-app payments via Razorpay for membership subscriptions and renewals. |
| **📡 Offline Support** | Pending check-ins are queued locally and auto-retried when connectivity returns. |

### 🏢 For Gym Owners

| Feature | Description |
|---|---|
| **🏗️ Gym Creation Wizard** | Step-by-step guided setup to register your gym with photos, timings, location, and amenities. |
| **📝 Membership Request Management** | Review, approve, or reject membership requests from potential members. |
| **💰 Plan Management** | Create, edit, toggle, and delete membership plans with flexible pricing and features. |
| **👥 Member Management** | View all approved members, their check-in patterns, and manage offline renewals. |
| **📢 Announcements** | Broadcast categorized announcements to all gym members. |
| **🚪 Gym Closures** | Schedule and manage closure dates (holidays, maintenance) with member notifications. |
| **📈 Analytics Dashboard** | Comprehensive business insights — revenue summaries, attendance trends, and member growth. |
| **⭐ Reviews & Replies** | View member reviews and post official replies. |
| **📒 Entry Logs** | Real-time and historical check-in/check-out logs for all members. |
| **💵 Payment History** | Complete transaction history for all gym payments. |
| **🔐 Razorpay Integration** | Full Razorpay Route setup with linked account onboarding, KYC, and bank settlement configuration. |
| **👤 Owner Profile** | Manage personal and business profile with photo uploads. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [React Native](https://reactnative.dev/) 0.81 + [Expo](https://expo.dev/) SDK 54 |
| **Navigation** | [React Navigation](https://reactnavigation.org/) v7 (Native Stack) |
| **Styling** | [NativeWind](https://www.nativewind.dev/) v4 (TailwindCSS for React Native) + StyleSheet |
| **Animations** | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) v4 |
| **HTTP Client** | [Axios](https://axios-http.com/) with JWT interceptors |
| **Payments** | [Razorpay React Native SDK](https://razorpay.com/docs/payments/payment-gateway/react-native-integration/) |
| **Push Notifications** | [Expo Notifications](https://docs.expo.dev/push-notifications/overview/) |
| **Secure Storage** | [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) (JWT token persistence) |
| **Camera & Media** | [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/) + [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) |
| **Location** | [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/) (GPS-based gym discovery & check-in verification) |
| **Gradients** | [Expo LinearGradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) |
| **SVG Icons** | [react-native-svg](https://github.com/software-mansion/react-native-svg) (custom hand-crafted SVG icons) |
| **Offline Storage** | [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) |
| **Build System** | [EAS Build](https://docs.expo.dev/build/introduction/) (Expo Application Services) |
| **Backend** | Node.js + Express + MongoDB ([fithex-backend](https://github.com/to-abhinav/fithex-backend)) |

---

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FitHex Mobile App                        │
├────────────────┬────────────────────────────────────────────────┤
│                │                                                │
│   Auth Flow    │              Authenticated Flow                │
│                │                                                │
│  ┌──────────┐  │  ┌──────────────────┐  ┌───────────────────┐  │
│  │  Login   │  │  │  Member Tabs     │  │   Owner Tabs      │  │
│  │  Register│  │  │  ┌────────────┐  │  │  ┌─────────────┐  │  │
│  │  OTP     │  │  │  │ Explore    │  │  │  │ My Gym      │  │  │
│  │  Role    │  │  │  │ Gym Log    │  │  │  │ Members     │  │  │
│  │  Profile │  │  │  │ Weight     │  │  │  │ Analytics   │  │  │
│  │  Setup   │  │  │  │ Profile    │  │  │  │ More (10+)  │  │  │
│  └──────────┘  │  │  └────────────┘  │  │  └─────────────┘  │  │
│                │  └──────────────────┘  └───────────────────┘  │
├────────────────┴────────────────────────────────────────────────┤
│                        Shared Layer                             │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────┐   │
│  │ Contexts │ │   API    │ │   Theme   │ │   Components   │   │
│  │ (Auth,   │ │ Services │ │  (Colors, │ │  (BottomNav,   │   │
│  │  Toast,  │ │ (axios)  │ │   design  │ │   ErrorBound,  │   │
│  │  Notif)  │ │          │ │   tokens) │ │   Toast, etc)  │   │
│  └──────────┘ └──────────┘ └───────────┘ └────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Utilities                                  │
│  ┌──────────────────────┐ ┌──────────────────────────────┐     │
│  │   Offline Queue      │ │   Custom Hooks (useAuth)     │     │
│  │   (AsyncStorage)     │ │                              │     │
│  └──────────────────────┘ └──────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │   fithex-backend      │
                  │   (Express + MongoDB  │
                  │    + Razorpay + JWT)  │
                  └───────────────────────┘
```

### Navigation Architecture

FitHex uses a **role-based navigation system** powered by React Navigation's Native Stack:

```
AppNavigator
├── Auth Stack (unauthenticated)
│   ├── LoginScreen
│   ├── RegistrationScreen
│   ├── OtpVerificationScreen
│   ├── ChooseRoleScreen
│   └── ProfileSetupScreen
│
├── Member Tab Navigator (role === 'member')
│   ├── ExploreGyms (Tab)
│   ├── GymLog (Tab)
│   ├── Weight (Tab)
│   ├── Profile (Tab)
│   └── Notifications (Push screen)
│
├── Owner Tab Navigator (role === 'owner')
│   ├── MyGym (Tab)
│   ├── Members (Tab)
│   ├── Analytics (Tab)
│   ├── More (Tab)
│   │   ├── MembershipRequests
│   │   ├── ManagePlans
│   │   ├── CreatePlan (3-step wizard)
│   │   ├── Announcements
│   │   ├── GymClosures
│   │   ├── Reviews
│   │   ├── EntryLog
│   │   ├── PaymentHistory
│   │   ├── OwnerProfile
│   │   └── RazorpaySettings
│   └── Notifications (Push screen)
│
└── Shared Screens
    ├── GymInfo
    ├── GymPlans
    ├── Payment
    └── PaymentSuccess
```

### Context Providers

The app uses React Context for global state management, layered in this order:

```
SafeAreaProvider
  └── AuthProvider          →  JWT auth state, sign-in/out, role detection
       └── ToastProvider    →  Animated toast notifications (success, error, info)
            └── NavigationContainer
                 └── NotificationProvider  →  Push token registration, unread count polling
                      └── ErrorBoundary    →  Graceful crash recovery
                           └── AppNavigator
```

### API Layer

All HTTP communication goes through a centralized Axios instance (`src/api/axios.js`) that:
- Automatically attaches the JWT Bearer token from SecureStore
- Sets `Content-Type` to `application/json` (or lets Axios auto-detect for `FormData`)
- Intercepts `401` responses to trigger auto sign-out
- Has a 15-second request timeout

Service modules abstract API endpoints into clean, reusable functions:

| Service | Purpose |
|---|---|
| `gymService.js` | Gym CRUD, search, nearby, plans, Razorpay credentials |
| `ownerService.js` | Membership requests, member management, analytics, payments, revenue |
| `gymLogService.js` | Check-in/out, entry logs, streaks, live occupancy |
| `notificationService.js` | Push token registration, notification CRUD, unread counts |

---

## 🎨 Design System

FitHex uses a **dark-first design system** with a carefully curated color palette:

| Token | Hex | Usage |
|---|---|---|
| `background` | `#0A0A0F` | App background |
| `surface` | `#14141E` | Cards, modals |
| `surfaceLight` | `#1E1E2E` | Elevated surfaces |
| `primary` | `#6366F1` | Primary actions (Indigo) |
| `secondary` | `#8B5CF6` | Secondary actions (Violet) |
| `accent` | `#06B6D4` | Highlights (Cyan) |
| `success` | `#10B981` | Positive states (Emerald) |
| `danger` | `#F87171` | Errors, destructive actions |
| `warning` | `#FBBF24` | Warnings (Amber) |

The UI features:
- **Glassmorphism** effects with translucent overlays
- **Animated glow orbs** for ambient background effects
- **Smooth entrance animations** using Reanimated's `FadeInDown`, `SlideInRight`, `ZoomIn`
- **Linear gradients** for premium card and header treatments
- **Custom SVG icons** — no icon library dependency for tab bars

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** ≥ 18.x ([download](https://nodejs.org/))
- **npm** ≥ 9.x (comes with Node.js)
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI** (for builds): `npm install -g eas-cli`
- **Android Studio** (for Android emulator) or a physical device with [Expo Go](https://expo.dev/client)
- **Git** ([download](https://git-scm.com/))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/to-abhinav/fithex-app.git
   cd fithex-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the project root:

   ```env
   EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:5000
   ```

   > **Note:** Replace `<YOUR_LOCAL_IP>` with your machine's local network IP (e.g., `192.168.1.3`). The backend ([fithex-backend](https://github.com/to-abhinav/fithex-backend)) must be running on this address.

4. **Start the development server**

   ```bash
   npx expo start
   ```

5. **Run on a device or emulator**

   - **Physical device:** Scan the QR code with the Expo Go app
   - **Android emulator:** Press `a` in the terminal
   - **iOS simulator:** Press `i` in the terminal (macOS only)

### Running the Backend

FitHex requires the [fithex-backend](https://github.com/to-abhinav/fithex-backend) API server to be running. Please refer to the backend repository's README for setup instructions. The backend uses:

- **Node.js + Express** for the REST API
- **MongoDB** for data persistence
- **JWT** for authentication
- **Razorpay** for payment processing
- **Cloudinary** for image storage
- **OTP service** for phone verification

---

## 📁 Project Structure

```
fithex-app/
├── App.js                          # Root component — providers + navigation
├── index.js                        # Entry point (registerRootComponent)
├── app.json                        # Expo configuration
├── eas.json                        # EAS Build profiles (dev, preview, prod)
├── babel.config.js                 # Babel config (NativeWind plugin)
├── tailwind.config.js              # Tailwind/NativeWind theme extensions
├── global.css                      # Global CSS import for NativeWind
├── .env                            # Environment variables (gitignored)
│
├── assets/                         # Static assets
│   ├── icon.png                    # App icon (1024x1024)
│   ├── splash-icon.png             # Splash screen icon
│   ├── favicon.png                 # Web favicon
│   ├── android-icon-foreground.png # Android adaptive icon (foreground)
│   ├── android-icon-background.png # Android adaptive icon (background)
│   └── android-icon-monochrome.png # Android monochrome icon
│
└── src/
    ├── api/                        # API layer
    │   ├── axios.js                # Axios instance with JWT interceptors
    │   ├── gymService.js           # Gym CRUD, search, Razorpay
    │   ├── gymLogService.js        # Check-in/out, streaks, occupancy
    │   ├── ownerService.js         # Owner-side operations
    │   └── notificationService.js  # Notification endpoints
    │
    ├── components/                 # Shared components
    │   ├── ErrorBoundary.js        # Global error boundary
    │   ├── ui/
    │   │   ├── BottomNavBar.js     # Custom animated bottom tab bar
    │   │   └── NotificationBell.js # Header notification bell with badge
    │   ├── feedback/               # Feedback components (toasts, etc.)
    │   └── layout/                 # Layout primitives
    │
    ├── context/                    # React Context providers
    │   ├── AuthContext.js          # Authentication state & JWT management
    │   ├── ToastContext.js         # Toast notification system
    │   ├── NotificationContext.js  # Push notifications & unread counts
    │   └── PendingRequestContext.js # Owner pending request badge state
    │
    ├── hooks/                      # Custom React hooks
    │   └── useAuth.js              # Convenience hook for AuthContext
    │
    ├── navigation/                 # Navigation configuration
    │   ├── AppNavigator.js         # Root navigator (auth vs. main)
    │   ├── MainTabNavigator.js     # Base tab navigator
    │   ├── MemberTabNavigator.js   # Member-specific tabs
    │   └── OwnerTabNavigator.js    # Owner-specific tabs + sub-screens
    │
    ├── screens/                    # Screen components
    │   ├── auth/                   # Authentication flow
    │   │   ├── LoginScreen.js
    │   │   ├── RegistrationScreen.js
    │   │   ├── OtpVerificationScreen.js
    │   │   ├── ChooseRoleScreen.js
    │   │   ├── ProfileSetupScreen.js
    │   │   └── AuthLoadingScreen.js
    │   │
    │   ├── dashboard/              # Member-facing screens
    │   │   ├── ExploreGymsScreen.js    # Location-based gym discovery
    │   │   ├── GymInfoScreen.js        # Detailed gym view
    │   │   ├── GymLogScreen.js         # Check-in/out + session history
    │   │   ├── GymPlansScreen.js       # Gym membership plans
    │   │   ├── WeightScreen.js         # Weight tracking + charts
    │   │   ├── ProfileScreen.js        # Member profile dashboard
    │   │   ├── NotificationsScreen.js  # Notification center
    │   │   ├── gymlog/                 # Gym log sub-components
    │   │   ├── weight/                 # Weight tracker sub-components
    │   │   └── profile/                # Profile sub-components
    │   │       └── components/
    │   │           ├── ProfileHeader.js
    │   │           ├── MembershipCard.js
    │   │           ├── WeeklyGoalCard.js
    │   │           ├── EditProfileModal.js
    │   │           ├── ImagePickerModal.js
    │   │           ├── PrivacySecurityModal.js
    │   │           └── ... (6 more)
    │   │
    │   ├── owner/                  # Owner-facing screens
    │   │   ├── MyGymScreen.js          # Gym dashboard & management
    │   │   ├── MembersScreen.js        # Member management
    │   │   ├── AnalyticsScreen.js      # Business analytics
    │   │   ├── MoreScreen.js           # Additional tools menu
    │   │   ├── MembershipRequestsScreen.js
    │   │   ├── ManagePlansScreen.js
    │   │   ├── AnnouncementsScreen.js
    │   │   ├── GymClosuresScreen.js
    │   │   ├── ReviewsScreen.js
    │   │   ├── EntryLogScreen.js
    │   │   ├── PaymentHistoryScreen.js
    │   │   ├── OwnerProfileScreen.js
    │   │   ├── RazorpaySettingsScreen.js
    │   │   ├── analyticsComponents.js  # Analytics chart components
    │   │   ├── analyticsData.js        # Analytics data fetching
    │   │   ├── analyticsTransform.js   # Data transformation helpers
    │   │   ├── membersComponents.js    # Member list components
    │   │   ├── membersData.js          # Member data helpers
    │   │   ├── components/             # Owner sub-components
    │   │   │   ├── CreateWizard.js     # Gym creation wizard
    │   │   │   ├── EditTabs.js         # Gym editing tab interface
    │   │   │   ├── GymDashboard.js     # Gym overview dashboard
    │   │   │   ├── OwnerProfileCard.js
    │   │   │   └── StepIndicator.js    # Wizard step progress
    │   │   ├── createPlan/             # Plan creation wizard
    │   │   │   ├── CreatePlanScreen.js
    │   │   │   ├── StepBasics.js       # Plan name, duration
    │   │   │   ├── StepFeatures.js     # Plan features selection
    │   │   │   ├── StepPricing.js      # Plan pricing setup
    │   │   │   ├── SharedUI.js         # Shared wizard UI
    │   │   │   └── constants.js        # Plan type constants
    │   │   └── hooks/                  # Owner-specific hooks
    │   │
    │   └── payment/                # Payment screens
    │       ├── PaymentScreen.js        # Razorpay checkout
    │       └── PaymentSuccess.js       # Post-payment confirmation
    │
    ├── store/                      # State management (reserved)
    │
    ├── theme/                      # Design system
    │   ├── colors.js               # Color tokens
    │   └── index.js                # Theme barrel export
    │
    └── utils/                      # Utility functions
        └── offlineQueue.js         # Offline check-in queue with auto-retry
```

---

## 🔐 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the FitHex backend API | `http://192.168.1.3:5000` |

> Environment variables prefixed with `EXPO_PUBLIC_` are automatically available in the Expo runtime via `process.env`.

---

## 📦 Building for Production

FitHex uses [EAS Build](https://docs.expo.dev/build/introduction/) for cloud-based builds. The project defines three build profiles in `eas.json`:

### Build Profiles

| Profile | Purpose | Distribution |
|---|---|---|
| `development` | Dev client for local testing | Internal |
| `preview` | APK for testing / QA sharing | Internal (APK) |
| `production` | Release build for app stores | Store |

### Build Commands

```bash
# Development build (with dev-client)
eas build --profile development --platform android

# Preview APK (for testing)
eas build --profile preview --platform android

# Production build (for Play Store / App Store)
eas build --profile production --platform android
eas build --profile production --platform ios
```

### Local Development Build

```bash
# Generate native Android project
npx expo prebuild --platform android

# Run locally on connected device/emulator
npx expo run:android
```

---

## 🔒 Security Highlights

- **JWT tokens** stored in device's secure enclave via `expo-secure-store` (not AsyncStorage)
- **Auto sign-out** on `401` responses via Axios response interceptors
- **Geolocation verification** for gym check-ins to prevent spoofing
- **QR code validation** for check-in authenticity
- **Secure environment variables** — `.env` files are gitignored
- **Token auto-refresh** — auth bootstrap on app launch validates the existing token with the server

---

## 🌐 Offline Support

FitHex includes a built-in **offline queue system** for gym check-ins:

1. If a check-in fails due to network issues, the request is persisted to `AsyncStorage`
2. The app retries automatically when connectivity is restored
3. Pending check-ins expire after **15 minutes** to prevent stale data
4. A retry counter tracks failed attempts

---

## 🧪 Development Tips

### Testing Mode

The `AppNavigator` includes a `TESTING` flag that can be toggled for rapid development:

```javascript
// src/navigation/AppNavigator.js
const TESTING = false; // Set to true to bypass auth flow
```

When `TESTING = true`, the app skips authentication and loads the Member tab navigator directly.

### Useful Commands

```bash
# Start development server
npx expo start

# Start with cache cleared
npx expo start --clear

# Run on Android
npx expo run:android

# Run on iOS (macOS only)
npx expo run:ios

# Install a new Expo-compatible package
npx expo install <package-name>

# Check for dependency issues
npx expo-doctor
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** and commit them
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **Push** to your fork
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request** describing your changes

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Purpose |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code style (formatting, no logic change) |
| `refactor:` | Code refactoring |
| `perf:` | Performance improvement |
| `chore:` | Build, tooling, or dependency changes |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

```
MIT License — Copyright (c) 2026 Abhinav Kumar
```

---

## 👤 Author

**Abhinav Kumar**

- GitHub: [@to-abhinav](https://github.com/to-abhinav)

---

## 🔗 Related Repositories

| Repository | Description |
|---|---|
| [fithex-backend](https://github.com/to-abhinav/fithex-backend) | Node.js + Express + MongoDB backend API |

---

<p align="center">
  Made with ❤️ and lots of ☕ by <strong>Abhinav Kumar</strong>
</p>
