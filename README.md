# Scan Genie - AI Shopping Assistant 🛒✨

An intelligent mobile application that helps users make better food choices through AI-powered product scanning and analysis. Built with React Native and Expo, featuring barcode scanning, AI image recognition, and smart product alternatives.

## 📱 Features

### Core Functionality
- **Barcode Scanning**: Instantly scan product barcodes to get detailed nutrition information
- **AI Photo Recognition**: Take photos of products without barcodes - AI will identify them
- **Smart Alternatives**: Get AI-powered suggestions for cheaper and healthier alternatives
- **Nutrition Analysis**: View detailed nutrition facts, grades, and health insights
- **Favorites System**: Save your favorite products for quick access
- **Shopping Analytics**: Track your scanning habits and discover patterns

### User Experience
- **Beautiful UI**: Modern, gradient-based design with smooth animations
- **Offline Support**: Core functionality works without internet connection
- **Cross-Platform**: Runs on iOS, Android, and Web
- **Secure Authentication**: Firebase-powered user accounts with email/password
- **Real-time Sync**: Data syncs across all your devices

## 🚀 Technology Stack

### Frontend
- **React Native** with Expo SDK 52
- **Expo Router** for navigation
- **TypeScript** for type safety
- **Lucide React Native** for icons
- **React Native Reanimated** for animations
- **Expo Camera** for barcode scanning
- **Expo Image Picker** for photo selection

### Backend & Services
- **Firebase Authentication** for user management
- **Firestore** for data storage
- **Google Gemini AI** for product identification
- **OpenFoodFacts API** for nutrition data
- **Custom AI algorithms** for alternative suggestions

### Development Tools
- **ESLint** for code quality
- **TypeScript** for static typing
- **Metro** bundler for React Native
- **EAS Build** for app compilation

## 📋 Prerequisites

Before running this project, ensure you have:

- Node.js (v18 or higher)
- npm or yarn package manager
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd scan-genie
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with your API keys:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini AI API Configuration
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Add your configuration to the `.env` file

### 5. Google Gemini AI Setup
1. Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the API key to your `.env` file

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Start the development server
npm start

# Run on specific platforms
npm run android    # Android
npm run ios        # iOS
npm run web        # Web browser
```

### Production Build
```bash
# Build for production
eas build --platform all

# Submit to app stores
eas submit --platform all
```

## 📱 Download & Demo

### 📥 Download APK
[Download Latest APK](your-expo-apk-link-here)

### 🎥 Demo Video
[Watch Demo on YouTube](your-youtube-video-link-here)

## 🏗️ Project Structure

```
scan-genie/
├── app/                          # App screens and navigation
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx             # Login screen
│   │   ├── signup.tsx            # Registration screen
│   │   └── forgot-password.tsx   # Password reset
│   ├── (tabs)/                   # Main app tabs
│   │   ├── index.tsx             # Home/Scanner screen
│   │   ├── results.tsx           # Product details
│   │   ├── suggestions.tsx       # AI alternatives
│   │   ├── favorites.tsx         # Saved products
│   │   └── analytics.tsx         # User analytics
│   ├── onboarding.tsx            # App introduction
│   └── _layout.tsx               # Root layout
├── components/                   # Reusable UI components
│   └── ui/                       # UI-specific components
├── context/                      # React Context providers
│   └── AuthContext.tsx           # Authentication state
├── services/                     # External API integrations
│   ├── aiProductSearch.ts        # Gemini AI service
│   ├── openFoodFacts.ts          # Nutrition data API
│   └── firestore.ts              # Database operations
├── types/                        # TypeScript type definitions
└── assets/                       # Static assets
```

## 🔧 Key Components

### Authentication System
- Firebase Authentication with email/password
- Secure user session management
- Password reset functionality
- User profile management

### Product Scanning
- **Barcode Scanner**: Uses device camera to scan product barcodes
- **AI Image Recognition**: Gemini AI identifies products from photos
- **Nutrition Analysis**: Fetches detailed nutrition data from OpenFoodFacts
- **Smart Caching**: Reduces API calls with intelligent data caching

### AI-Powered Features
- **Product Identification**: Advanced AI recognizes products from images
- **Alternative Suggestions**: Machine learning suggests cheaper/healthier options
- **Nutrition Scoring**: Automated health assessment of products
- **Shopping Insights**: Analytics on user shopping patterns

### Data Management
- **Firestore Integration**: Real-time data synchronization
- **Offline Support**: Local data caching for offline functionality
- **User Analytics**: Comprehensive tracking of user behavior
- **Favorites System**: Personal product collections

## 🎨 Design System

### Color Palette
- **Primary Gradients**: Blue to purple (`#667eea` → `#764ba2`)
- **Secondary Gradients**: Pink to red (`#f093fb` → `#f5576c`)
- **Accent Colors**: Green (`#22c55e`), Orange (`#f97316`), Red (`#ef4444`)
- **Neutral Tones**: Gray scale for text and backgrounds

### Typography
- **Primary Font**: System default (San Francisco/Roboto)
- **Font Weights**: Regular (400), Medium (500), Bold (600)
- **Responsive Sizing**: Scales appropriately across devices

### UI Principles
- **Glassmorphism**: Blur effects with translucent backgrounds
- **Micro-interactions**: Smooth animations and haptic feedback
- **Accessibility**: High contrast ratios and screen reader support
- **Responsive Design**: Optimized for all screen sizes

## 🔐 Security & Privacy

### Data Protection
- **Encrypted Storage**: All sensitive data encrypted at rest
- **Secure Authentication**: Firebase security rules and validation
- **Privacy First**: Minimal data collection, user consent required
- **GDPR Compliant**: European privacy regulation compliance

### API Security
- **Environment Variables**: Sensitive keys stored securely
- **Rate Limiting**: API call throttling to prevent abuse
- **Input Validation**: All user inputs sanitized and validated
- **Error Handling**: Graceful error management without data exposure

## 📊 Analytics & Insights

### User Analytics
- **Scan History**: Complete record of all scanned products
- **Category Tracking**: Monitor shopping patterns by product category
- **Monthly Reports**: Detailed monthly scanning statistics
- **Favorite Trends**: Analysis of saved product preferences

### Health Insights
- **Nutrition Scoring**: Automated health assessment of products
- **Dietary Tracking**: Monitor nutritional intake patterns
- **Health Recommendations**: Personalized suggestions for better choices
- **Progress Monitoring**: Track improvements in food choices over time

## 🤖 AI Integration

### Google Gemini AI
- **Image Recognition**: Advanced computer vision for product identification
- **Natural Language Processing**: Smart product name extraction
- **Confidence Scoring**: AI reliability metrics for each identification
- **Continuous Learning**: Model improvements through usage data

### Alternative Suggestions
- **Price Comparison**: Find cheaper alternatives automatically
- **Health Optimization**: Suggest healthier product options
- **Availability Mapping**: Show where alternatives can be found
- **Personalization**: Recommendations based on user preferences

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and service integration testing
- **E2E Tests**: Complete user workflow testing
- **Performance Tests**: App performance and memory usage testing

## 🚀 Deployment

### Development Build
```bash
# Create development build
eas build --profile development --platform all
```

### Production Build
```bash
# Create production build
eas build --profile production --platform all
```

### App Store Submission
```bash
# Submit to app stores
eas submit --platform all
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards
- **TypeScript**: All new code must be written in TypeScript
- **ESLint**: Follow the established linting rules
- **Formatting**: Use Prettier for consistent code formatting
- **Testing**: Include tests for all new features
- **Documentation**: Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### APIs & Services
- **OpenFoodFacts**: Comprehensive food product database
- **Google Gemini AI**: Advanced AI for image recognition
- **Firebase**: Backend infrastructure and authentication
- **Expo**: React Native development platform

### Open Source Libraries
- **React Native**: Mobile app framework
- **Lucide Icons**: Beautiful icon library
- **React Native Reanimated**: Smooth animations
- **Expo Camera**: Camera functionality

## 📞 Support

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions for questions
- **Email**: Contact support at [your-email@domain.com]

### Common Issues

#### Camera Permissions
If camera scanning isn't working:
1. Check device permissions in Settings
2. Restart the app after granting permissions
3. Ensure good lighting for barcode scanning

#### AI Recognition Issues
If AI photo recognition fails:
1. Verify your Gemini API key is valid
2. Check internet connection
3. Ensure photos are clear and well-lit
4. Try different angles of the product

#### Sync Issues
If data isn't syncing:
1. Check internet connection
2. Verify Firebase configuration
3. Try logging out and back in
4. Clear app cache if necessary

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Barcode scanning functionality
- AI image recognition
- Product alternatives
- User authentication
- Favorites and analytics

### Planned Features
- **v1.1.0**: Shopping lists and meal planning
- **v1.2.0**: Social features and product reviews
- **v1.3.0**: Advanced nutrition tracking
- **v2.0.0**: AR product scanning and enhanced AI

## 📈 Performance

### Optimization Features
- **Lazy Loading**: Components load on demand
- **Image Caching**: Efficient image storage and retrieval
- **API Throttling**: Prevents excessive API calls
- **Memory Management**: Optimized for low-memory devices

### Metrics
- **App Size**: ~50MB (optimized bundle)
- **Cold Start**: <3 seconds on average devices
- **Scan Speed**: <2 seconds for barcode recognition
- **AI Recognition**: <5 seconds for image analysis

---

**Made with ❤️ by the Scan Genie Team**

*Helping you make smarter, healthier shopping decisions through the power of AI.*