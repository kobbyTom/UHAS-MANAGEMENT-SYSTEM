# 🍎 iOS Deployment Guide — UHAS Basic School Mobile App

This guide walks you through every step of deploying the UHAS Basic School mobile app to iOS — from testing on your iPhone today, to publishing on the App Store.

---

## Table of Contents

1. [Testing Now (No Apple Account)](#1-testing-now-no-apple-account)
2. [Apple Developer Enrollment](#2-apple-developer-enrollment)
3. [Building with EAS](#3-building-with-eas)
4. [TestFlight Distribution](#4-testflight-distribution)
5. [App Store Submission](#5-app-store-submission)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Testing Now (No Apple Account)

You can test the app on iOS **right now** without an Apple Developer account.

### Option A: Expo Go on a Physical iPhone

1. Install **Expo Go** from the App Store on your iPhone.
2. Start the dev server from your Windows machine:
   ```bash
   cd mobile
   npx expo start
   ```
3. Scan the QR code shown in the terminal with your iPhone camera.
4. Expo Go will open and load the app.

> **Note**: Your iPhone and Windows PC must be on the **same Wi-Fi network**. If that doesn't work, use tunnel mode:
> ```bash
> npx expo start --tunnel
> ```

### Option B: iOS Simulator (Mac Required)

If you have access to a Mac with Xcode installed:

1. Open the project on the Mac.
2. Run:
   ```bash
   cd mobile
   npx expo start --ios
   ```
3. The iOS Simulator will launch automatically.

### Option C: EAS Development Build for Simulator

Build a simulator-compatible `.app` file via EAS cloud:

```bash
cd mobile
npx eas build --platform ios --profile development
```

This builds in the cloud (no Mac needed!) and produces a `.tar.gz` you can install on a Mac's iOS Simulator.

---

## 2. Apple Developer Enrollment

To distribute your app via TestFlight or the App Store, you need an **Apple Developer Program** membership.

### Steps to Enroll

1. Go to [developer.apple.com/programs](https://developer.apple.com/programs/)
2. Click **"Enroll"**
3. Sign in with your Apple ID (or create one)
4. Choose enrollment type:
   - **Individual** ($99/year) — for personal apps
   - **Organization** ($99/year) — requires a D-U-N-S number
5. Complete payment

### After Enrollment — Save These Credentials

Once enrolled, you'll need three values. Update them in `eas.json` under `submit.production.ios`:

| Credential | Where to Find It | What to Update in `eas.json` |
|-----------|-------------------|------------------------------|
| **Apple ID** | Your login email | `appleId` |
| **Team ID** | [Membership page](https://developer.apple.com/account/#/membership) | `appleTeamId` |
| **ASC App ID** | App Store Connect → Your App → General → App Information | `ascAppId` |

---

## 3. Building with EAS

EAS Build runs in the cloud — you can trigger iOS builds from Windows.

### Prerequisites

Install the EAS CLI globally (if not already):

```bash
npm install -g eas-cli
```

Log in to your Expo account:

```bash
eas login
```

### Build Profiles

| Profile | Command | Output | Use Case |
|---------|---------|--------|----------|
| **Development** | `eas build --platform ios --profile development` | `.app` (Simulator) | Local testing on Mac simulator |
| **Preview** | `eas build --platform ios --profile preview` | `.ipa` (Ad Hoc) | Internal team testing via device registration |
| **Production** | `eas build --platform ios --profile production` | `.ipa` (App Store) | App Store / TestFlight submission |

### Running a Build

```bash
# Simulator build (no Apple account needed)
eas build --platform ios --profile development

# TestFlight / Internal testing (requires Apple Developer account)
eas build --platform ios --profile preview

# App Store release (requires Apple Developer account)
eas build --platform ios --profile production
```

### Build Both Platforms at Once

```bash
eas build --platform all --profile production
```

### Monitoring Builds

After starting a build, EAS provides a URL to track progress:
```
https://expo.dev/accounts/YOUR_ACCOUNT/builds/BUILD_ID
```

You can also check status via CLI:
```bash
eas build:list
```

---

## 4. TestFlight Distribution

TestFlight lets you distribute beta builds to up to 10,000 external testers.

### Step 1: Build for Production

```bash
eas build --platform ios --profile production
```

### Step 2: Submit to App Store Connect

After the build completes, submit it:

```bash
eas submit --platform ios --profile production
```

EAS will prompt for your Apple credentials and upload the `.ipa` to App Store Connect.

> **Alternative**: Use `--auto-submit` to submit automatically after build:
> ```bash
> eas build --platform ios --profile production --auto-submit
> ```

### Step 3: Configure TestFlight in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select your app → **TestFlight** tab
3. The build will appear after Apple processes it (~15-30 min)
4. Fill in the **"What to Test"** section
5. Add testers:
   - **Internal Testers**: Up to 100 team members (no review needed)
   - **External Testers**: Up to 10,000 users (requires brief Apple review)

### Step 4: Testers Install via TestFlight

1. Testers receive an email invitation
2. They install the **TestFlight** app from the App Store
3. They accept the invitation and install your app

---

## 5. App Store Submission

### Pre-Submission Checklist

Before submitting to the App Store, prepare the following:

- [ ] **App Icon**: 1024×1024px PNG (no transparency, no rounded corners)
- [ ] **Screenshots**: Required for each device size:
  - iPhone 6.7" (1290 × 2796px) — iPhone 15 Pro Max
  - iPhone 6.5" (1284 × 2778px) — iPhone 14 Plus
  - iPhone 5.5" (1242 × 2208px) — iPhone 8 Plus
  - iPad Pro 12.9" (2048 × 2732px) — if `supportsTablet: true`
- [ ] **App Description**: Up to 4000 characters
- [ ] **Keywords**: Up to 100 characters, comma-separated
- [ ] **Support URL**: A webpage for user support
- [ ] **Privacy Policy URL**: Required for all apps
- [ ] **App Category**: Education
- [ ] **Age Rating**: Complete the questionnaire (likely 4+)

### Submitting

1. Build the production `.ipa`:
   ```bash
   eas build --platform ios --profile production
   ```

2. Submit to App Store Connect:
   ```bash
   eas submit --platform ios --profile production
   ```

3. In [App Store Connect](https://appstoreconnect.apple.com/):
   - Fill in all metadata (description, screenshots, etc.)
   - Select the uploaded build
   - Click **"Submit for Review"**

### App Review Tips

Apple reviews typically take **24-48 hours**. To avoid rejection:

- ✅ Ensure the app functions fully (no placeholder screens)
- ✅ Include a demo login if authentication is required (provide credentials in review notes)
- ✅ All permission request strings must clearly explain why they're needed
- ✅ Don't mention other platforms ("Android version") in the description
- ✅ Ensure the privacy policy URL is accessible and relevant

### Suggested Review Notes

When submitting, include these review notes:

```
Demo Login Credentials:
- Admin: admin001@uhasbasic.edu.gh / admin001uhas_basic_password
- Teacher: t001@uhasbasic.edu.gh / t001uhas_basic_password

This is a school management app for UHAS Basic School.
The app requires an active internet connection to communicate
with our backend server.
```

---

## 6. Troubleshooting

### "No development team selected" Error

This means you haven't linked your Apple Developer account. Run:
```bash
eas credentials
```
And follow the prompts to configure your Apple team.

### Build Fails with Signing Error

Clear cached credentials and re-authenticate:
```bash
eas credentials --platform ios
```
Select "Remove" for the existing profile, then rebuild.

### Expo Go Shows "Network Error"

- Ensure your phone and PC are on the same Wi-Fi
- Try tunnel mode: `npx expo start --tunnel`
- Check that the API URL in `src/api/client.js` is accessible from your phone

### Build Queue is Slow

Free EAS accounts have limited build priority. Options:
- Upgrade to EAS Production ($99/month) for faster builds
- Use `--local` flag if you have a Mac with Xcode: `eas build --platform ios --local`

---

## Quick Reference

```bash
# ---- Testing (No Apple Account) ----
npx expo start                                    # Expo Go
npx expo start --tunnel                           # Expo Go (tunnel mode)
eas build --platform ios --profile development    # Simulator build

# ---- TestFlight (Apple Account Required) ----
eas build --platform ios --profile preview        # Ad Hoc build
eas build --platform ios --profile production     # Production build
eas submit --platform ios --profile production    # Submit to TestFlight

# ---- App Store (Apple Account Required) ----
eas build --platform ios --profile production --auto-submit  # Build + auto-submit

# ---- Utilities ----
eas build:list                                    # Check build status
eas credentials --platform ios                    # Manage signing
npx expo-doctor                                   # Verify config
```
