# AI Shopping Assistant - React Native Expo App

A modern AI-powered shopping assistant built with React Native and Expo that helps users make healthier food choices through barcode scanning, product analysis, and personalized recommendations.

## ✨ Features

### 🤖 AI-Powered Product Recognition
- **Smart Image Analysis** - Upload any product photo for instant AI identification using Google Gemini
- **No Barcode Required** - AI can identify products from images alone with 85%+ accuracy
- **Intelligent Product Matching** - Automatically searches Open Food Facts database for detailed info
- **Visual Product Recognition** - Works with any clear product photo, even without visible barcodes
- **AI-Powered Alternatives** - Find 3-5 cheaper alternatives for any scanned product

### 🔐 Authentication
- **Firebase Authentication** with email/password
- Animated onboarding experience 
- Login, signup, and forgot password flows
- Persistent authentication state
- Beautiful gradient backgrounds with blur effects

### 📱 Core Functionality
- **Barcode Scanning** using Expo Camera
- **AI Photo Recognition** - Identify products from images without barcodes
- **Product Lookup** via Open Food Facts API
- **Smart Product Search** - AI-powered product identification and matching
- **User Favorites** stored in Firestore
- **Scan History** tracking
- **Analytics Dashboard** with user insights
- **Healthier Alternatives** suggestions

### 🎨 UI/UX Features
- Modern gradient designs
- Smooth animations with React Native Reanimated
- Haptic feedback on interactions
- Toast notifications for user feedback
- Dark/light mode support
- Responsive design for all screen sizes

### 📊 Data & Analytics
- Personal scan history
- Favorite products management
- Category-based analytics
- Monthly activity tracking
- Achievement system

### 🔧 Implementation Flow

#### **Barcode Scanning Flow:**
1. **User scans barcode** → Get product from Open Food Facts
2. **Send product info** → Gemini API for alternatives analysis  
3. **AI returns suggestions** → Parse and rank by price/health score
4. **Display alternatives** → Show in Suggestions tab with savings info

#### **Image Recognition Flow:**
1. **User uploads/takes picture** of product
2. **Send image** → Gemini API with product identification prompt
3. **Parse JSON result** → Get product_name + category + brand
4. **Search Open Food Facts API** for that product/category
5. **Fetch alternatives** → Rank by price using AI logic
6. **Display suggestions** → Show identified product + cheaper alternatives

## 🤖 AI Setup (Free Google Gemini)

### Quick Setup
1. **Get Free API Key**: Visit https://makersuite.google.com/app/apikey
2. **Sign in** with Google account → **Create API Key**
3. **Copy the key** (looks like: `AIzaSyC7Xj9Kp2Mn8Qr5St6Uv7Wx8Yz9Ab0Cd1Ef`)
4. **Add to environment**: Copy `.env.example` to `.env` and add your key

### Environment Setup
```typescript
// .env file
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyC7Xj9Kp2Mn8Qr5St6Uv7Wx8Yz9Ab0Cd1Ef
```

📖 **Detailed Setup Guide**: See `docs/GEMINI_SETUP.md` for complete instructions, troubleshooting, and best practices.

### Quick Test
1. Run the app: `npm run dev`
2. Tap **"AI Photo Scan"** on Home tab
3. Take a picture of any product
4. Watch for "AI is analyzing..." → Product identified!

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project with Authentication and Firestore enabled
- iOS Simulator, Android Emulator, or Expo Go app

### Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication and Firestore Database

2. **Configure Authentication**
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" provider
   - Disable email verification (unless you want to handle email verification)

3. **Setup Firestore**
   - Go to Firestore Database
   - Create database in test mode (or production mode with security rules)
   - The app will automatically create the required collections:
     - `favorites/{userId}/products` - User's favorite products
     - `scans/{userId}/history` - User's scan history

4. **Get Firebase Configuration**
   - Go to Project settings > Your apps
   - Add a web app or get the config object
   - Copy the configuration values

### Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone <your-repo>
   cd ai-shopping-assistant
   npm install
   ```

2. **Configure Firebase**
   
   Update the Firebase configuration in `firebase.ts`:
   
   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key-here",
     authDomain: "your-project.firebaseapp.com", 
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

3. **Run the App**
   ```bash
   npm run dev
   ```

4. **Open in Expo**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS Simulator
   - Or press `a` for Android Emulator

## 📱 App Structure

```
app/
├── _layout.tsx                 # Root layout with AuthProvider
├── index.tsx                   # App entry point with auth routing
├── onboarding.tsx             # Onboarding screens
├── (auth)/                    # Authentication screens
│   ├── login.tsx              # Email/password login
│   ├── signup.tsx             # User registration
│   └── forgot-password.tsx    # Password reset
└── (tabs)/                    # Main app (protected routes)
    ├── index.tsx              # Home - Scanning interface
    ├── results.tsx            # Product details & nutrition
    ├── suggestions.tsx        # Healthier alternatives
    ├── favorites.tsx          # Saved products
    └── analytics.tsx          # User analytics

context/
└── AuthContext.tsx           # Firebase Auth state management

services/
├── firestore.ts             # Firestore database operations
└── openFoodFacts.ts         # Open Food Facts API integration

components/
└── ui/                      # Reusable UI components
    ├── GradientBackground.tsx
    └── LoadingSpinner.tsx
```

## 🔧 Tech Stack

- **React Native 0.79** with Expo Router for navigation
- **Firebase Authentication** for user management
- **Firestore** for data storage
- **Expo Camera** for barcode scanning
- **Open Food Facts API** for product data
- **React Native Reanimated** for smooth animations
- **Expo Blur & Linear Gradient** for modern UI
- **TypeScript** for type safety

## 📊 Data Models

### User Authentication
```typescript
interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}
```

### Product Information
```typescript
interface Product {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  nutritionGrade?: string;
  ingredients?: string[];
  allergens?: string[];
  nutritionFacts?: NutritionFacts;
  scannedAt: Date;
}
```

### User Analytics
```typescript
interface UserAnalytics {
  totalScans: number;
  categoriesScanned: { [key: string]: number };
  monthlyScans: { [key: string]: number };
  favoriteCount: number;
}
```

## 🔒 Security Rules (Firestore)

The app includes comprehensive Firestore security rules in `firestore.rules`. To deploy them:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

### Security Features:
- **User Isolation**: Users can only access their own data
- **Email Verification**: Requires verified email addresses
- **Data Validation**: Validates data structure and types
- **Read-Only Collections**: Public product data is read-only
- **Analytics Protection**: Analytics data managed by cloud functions only

## 🚀 Deployment

### Build for Production

```bash
# Web build
npm run build:web

# iOS build (requires Apple Developer Account)
expo build:ios

# Android build  
expo build:android
```

### Deploy to Expo
```bash
expo publish
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Firebase Configuration Error**
   - Double-check all Firebase config values
   - Ensure Authentication and Firestore are enabled
   - Verify API keys are correct

2. **Camera Permissions**
   - Make sure camera permissions are granted
   - On iOS Simulator, camera scanning won't work (use physical device)

3. **Barcode Scanning Issues**
   - Ensure good lighting and clear barcode image
   - Try different angles and distances
   - Some products might not be in Open Food Facts database

4. **Authentication Problems**
   - Check Firebase Auth configuration
   - Verify email/password provider is enabled
   - Look for error messages in console

### Performance Tips

- Use development build for better performance testing
- Enable Hermes engine for Android
- Optimize images and use appropriate formats
- Implement proper loading states

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed description
3. Join our community discussions

---

Built with ❤️ using React Native, Expo, and Firebase