# Learning App - QR-Based Educational Assistant

A React Native/Expo TypeScript application that helps students learn through QR code scanning and AI-powered Q&A interactions.

## Features

### 🏠 Home Screen
- **Premium QR Code Scanner**: Scan QR codes to access learning materials
- **Blurred Glass Effect**: Modern glassmorphism design with blur effects
- **Animated UI**: Smooth pulse animations and entrance effects
- **"Scan to Learn" functionality**: Point camera at QR codes to start learning
- **Feature Cards**: Quick overview of app capabilities

### 💬 Chat Interface
- **AI-Powered Q&A**: Ask questions about specific subjects and chapters
- **Premium Chat UI**: Modern message bubbles with shadows and animations
- **Fixed Input Area**: Input field properly positioned above bottom navigation
- **Real-time Chat**: Interactive chat interface for learning
- **API Integration**: Connected to CDIS IITK API for educational content
- **Subject-Specific**: Supports Physics, Chemistry, Mathematics, and Biology
- **Loading Indicators**: Elegant loading states with animations

### 👤 Profile Screen
- **Learning Statistics**: Track questions asked, quizzes taken, and QR codes scanned
- **User Management**: Profile information and settings
- **Progress Tracking**: Monitor learning progress over time

## Technical Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **State Management**: React Context API
- **Camera**: Expo Camera for QR scanning
- **Blur Effects**: Expo Blur for glassmorphism design
- **Animations**: React Native Animatable for smooth transitions
- **Icons**: Expo Vector Icons
- **API**: Integration with https://cdis.iitk.ac.in/inf_api/

## Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React Context for state management
├── navigation/         # Navigation configuration
├── screens/           # App screens
│   ├── HomeScreen.tsx     # QR scanner and main interface
│   ├── ProfileScreen.tsx  # User profile and statistics
│   └── ChatScreen.tsx     # Q&A chat interface
├── services/          # API services
│   └── ApiService.ts      # CDIS IITK API integration
└── types/             # TypeScript type definitions
```

## API Integration

The app integrates with the CDIS IITK API for educational content:

**Endpoint**: `https://cdis.iitk.ac.in/inf_api/evaluate`

**Request Format**:
```json
{
  "question": "Your question here",
  "mode": "query",
  "subject": "physics|chemistry|mathematics|biology",
  "class": 9,
  "chapter": "Chapter name"
}
```

## QR Code Format

QR codes should contain JSON data with the following structure:
```json
{
  "subject": "Physics",
  "class": 9,
  "chapter": "Force and law of motion",
  "pdfFile": "optional_pdf_reference"
}
```

### Sample QR Codes for Testing

You can create QR codes with these JSON data for testing:

**Physics - Force and Law of Motion:**
```json
{"subject": "Physics", "class": 9, "chapter": "Force and law of motion"}
```

**Chemistry - Atoms and Molecules:**
```json
{"subject": "Chemistry", "class": 9, "chapter": "Atoms and Molecules"}
```

**Mathematics - Number Systems:**
```json
{"subject": "Mathematics", "class": 9, "chapter": "Number Systems"}
```

Use any online QR code generator (like qr-code-generator.com) to create QR codes with this JSON data.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm start
   ```

3. **Run on Device**:
   - Install Expo Go app on your mobile device
   - Scan the QR code displayed in terminal
   - Or press 'a' for Android emulator, 'w' for web

## App Flow

1. **Home Screen**: User sees "Scan to Learn" card
2. **QR Scanning**: User taps card to open camera and scan QR code
3. **Mode Selection**: After scanning, user chooses between "Ask Questions" or "Take Quiz"
4. **Chat Interface**: If "Ask Questions" is selected, user is taken to chat screen
5. **Q&A Interaction**: User can ask questions and receive AI-powered responses
6. **Progress Tracking**: All interactions are tracked in the profile

## Features in Development

- Quiz functionality
- Enhanced learning analytics
- Offline mode support
- Multiple language support
- Advanced user profiles

## UI/UX Enhancements

### Premium Design Elements
- **Glassmorphism**: Blurred glass effects using Expo Blur
- **Micro-animations**: Smooth entrance animations and pulse effects
- **Premium Typography**: Carefully selected font sizes and weights
- **Shadow Effects**: Subtle shadows for depth and modern look
- **Color Palette**: Professional blue and gray color scheme

### Responsive Design
- **Keyboard Handling**: Proper keyboard avoidance in chat screen
- **Bottom Navigation**: Input field positioned above navigation
- **Adaptive Layouts**: Responsive design for different screen sizes

## Camera Permissions

The app requires camera permissions to scan QR codes. Permissions are requested automatically when the user first attempts to scan.

## Testing

For testing purposes, if a QR code doesn't contain valid JSON, the app will use default values:
- Subject: Physics
- Class: 9
- Chapter: Motion

## Contributing

This is an educational project. Feel free to contribute by:
- Adding new features
- Improving UI/UX
- Enhancing API integration
- Adding tests

## License

This project is for educational purposes.
