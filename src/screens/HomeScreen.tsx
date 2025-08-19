import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  StatusBar,
  ImageBackground,
  Animated,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppContext } from '../context/AppContext';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [image, setImage] = useState<string | null>(null);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { dispatch } = useAppContext();
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();

    // Start pulse animation
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setShowScanner(false);

    // Parse QR data - assuming it contains subject, class, and chapter info
    let parsedData;
    try {
      parsedData = JSON.parse(data);
      
      // Ensure class is a number and not undefined
      if (parsedData.class) {
        parsedData.class = parseInt(parsedData.class, 10);
      } else {
        parsedData.class = 9; // Default class
      }
      
    } catch (error) {
      // If not JSON, create default structure
      parsedData = {
        subject: 'Chemistry', // Default for testing
        class: 9,
        chapter: 'Atoms and Molecules', // Use exact chapter name from curriculum
        pdfFile: data
      };
    }

    console.log('Parsed QR data:', parsedData);
    setQrData(parsedData);
    setShowModal(true);

    // Track QR scan in context
    dispatch({ type: 'ADD_QR_SCAN', payload: parsedData });
    dispatch({ type: 'INCREMENT_QR_SCANNED' });
  };

  const startScanning = () => {
    if (hasPermission === null) {
      Alert.alert('Permission Required', 'Camera permission is required to scan QR codes.');
      return;
    }
    if (hasPermission === false) {
      Alert.alert('No Access', 'No access to camera');
      return;
    }
    setScanned(false);
    setShowScanner(true);
    setImage(null);
  };

  // Camera reverse handler
  const handleReverseCamera = () => {
    setCameraType(prev => (prev === 'back' ? 'front' : 'back'));
  };

  // Image upload and QR decode handler
  const handleImageUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ base64: true });
    if (!result.cancelled && result.uri) {
      setImage(result.uri);
      // Simulate QR decode from image
      // You can add QR decode logic here (e.g., jsQR)
      // For now, just show image and allow user to close
      // Optionally, call handleBarCodeScanned with fake data
      // handleBarCodeScanned({ type: 'image', data: 'Simulated QR Data' });
    }
  };

  const handleOptionSelect = (option: 'quiz' | 'questions') => {
    setShowModal(false);
    if (option === 'questions' && qrData) {
      // Ensure class is properly set with validation
      const classNumber = qrData.class || 9; // Default to class 9 if missing
      console.log('Navigating to Chat with params:', {
        subject: qrData.subject,
        class: classNumber,
        chapter: qrData.chapter,
      });
      
      navigation.navigate('Chat', {
        subject: qrData.subject,
        class: classNumber,
        chapter: qrData.chapter,
      });
    } else {
      Alert.alert('Coming Soon', 'Quiz feature will be available soon!');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Gradient */}
      <View style={styles.backgroundGradient}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>

      {/* Header */}
      <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
        <Text style={styles.headerTitle}>Learning Hub</Text>
        <Text style={styles.headerSubtitle}>Unlock Knowledge with QR</Text>
      </Animatable.View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Premium Blurred Card with Scan Option */}
        <Animatable.View animation="fadeInUp" duration={1200} delay={300}>
          <Animated.View style={[styles.scanCardContainer, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity style={styles.scanCard} onPress={startScanning} activeOpacity={0.8}>
              <BlurView intensity={20} tint="light" style={styles.blurContainer}>
                <View style={styles.scanCardContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="qr-code-outline" size={60} color="#007AFF" />
                    <View style={styles.iconGlow} />
                  </View>
                  <Text style={styles.scanText}>Scan to Learn</Text>
                  <Text style={styles.scanSubtext}>Point your camera at a QR code{'\n'}to unlock educational content</Text>
                  <View style={styles.scanButton}>
                    <Ionicons name="camera-outline" size={16} color="white" />
                    <Text style={styles.scanButtonText}>Start Scanning</Text>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        </Animatable.View>

        {/* Feature Cards */}
        <Animatable.View animation="fadeInUp" duration={1000} delay={600} style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#007AFF" />
            <Text style={styles.featureText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>AI Q&A</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="school-outline" size={24} color="#007AFF" />
            <Text style={styles.featureText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Quizzes</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="analytics-outline" size={24} color="#007AFF" />
            <Text style={styles.featureText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Progress</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="library-outline" size={24} color="#007AFF" />
            <Text style={styles.featureText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Materials</Text>
          </View>
        </Animatable.View>
      </View>

      {/* QR Scanner Modal */}
      <Modal visible={showScanner} animationType="slide">
        <View style={styles.scannerContainer}>
          {/* Camera QR Scanner */}
          {!image && (
            <CameraView
              style={styles.camera}
              type={cameraType}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerHeader}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowScanner(false)}
                  >
                    <Ionicons name="close" size={30} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.reverseButton}
                    onPress={handleReverseCamera}
                  >
                    <Ionicons name="camera-reverse-outline" size={30} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleImageUpload}
                  >
                    <Ionicons name="image-outline" size={30} color="white" />
                  </TouchableOpacity>
                </View>
                <View style={styles.scannerFrame}>
                  <View style={styles.scannerBox} />
                  <Text style={styles.scannerText}>Point camera at QR code</Text>
                </View>
              </View>
            </CameraView>
          )}
          {/* Image Preview and Simulated QR Extraction */}
          {image && (
            <View style={[styles.camera, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' }]}> 
              <ImageBackground source={{ uri: image }} style={{ width: 250, height: 250, borderRadius: 12, overflow: 'hidden' }} />
              <Text style={{ color: 'white', marginTop: 16 }}>Image selected. (QR decode logic needed)</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setImage(null)}>
                <Ionicons name="close" size={30} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Premium Options Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <BlurView intensity={50} tint="dark" style={styles.modalOverlay}>
          <Animatable.View
            animation="bounceIn"
            duration={800}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              <Text style={styles.modalTitle}>QR Code Detected!</Text>
            </View>

            <View style={styles.qrInfoCard}>
              <View style={styles.qrInfoRow}>
                <Ionicons name="book-outline" size={16} color="#666" />
                <Text style={styles.qrInfoLabel}>Subject:</Text>
                <Text style={styles.qrInfoValue}>{qrData?.subject}</Text>
              </View>
              <View style={styles.qrInfoRow}>
                <Ionicons name="school-outline" size={16} color="#666" />
                <Text style={styles.qrInfoLabel}>Class:</Text>
                <Text style={styles.qrInfoValue}>{qrData?.class}</Text>
              </View>
              <View style={styles.qrInfoRow}>
                <Ionicons name="library-outline" size={16} color="#666" />
                <Text style={styles.qrInfoLabel}>Chapter:</Text>
                <Text style={styles.qrInfoValue}>{qrData?.chapter}</Text>
              </View>
            </View>

            <Text style={styles.modalSubtitle}>Choose your learning mode:</Text>

            <Animatable.View animation="fadeInLeft" delay={300}>
              <TouchableOpacity
                style={styles.premiumOptionButton}
                onPress={() => handleOptionSelect('questions')}
                activeOpacity={0.8}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons name="chatbubble-ellipses" size={28} color="white" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Ask Questions</Text>
                  <Text style={styles.optionDescription}>Get AI-powered answers instantly</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#007AFF" />
              </TouchableOpacity>
            </Animatable.View>

            <Animatable.View animation="fadeInRight" delay={500}>
              <TouchableOpacity
                style={styles.premiumOptionButton}
                onPress={() => handleOptionSelect('quiz')}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: '#FF6B6B' }]}>
                  <Ionicons name="trophy" size={28} color="white" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Take Quiz</Text>
                  <Text style={styles.optionDescription}>Test your knowledge</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#007AFF" />
              </TouchableOpacity>
            </Animatable.View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animatable.View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: '#007AFF',
    opacity: 0.1,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: '#4CAF50',
    opacity: 0.05,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scanCardContainer: {
    marginBottom: 40,
  },
  scanCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  blurContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  scanCardContent: {
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  iconGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: '#007AFF',
    opacity: 0.1,
    borderRadius: 40,
  },
  scanText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  scanSubtext: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 5,
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 3,
    minHeight: 85,
    minWidth: 75,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 12,
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    gap: 10,
  },
  closeButton: {
    padding: 10,
  },
  reverseButton: {
    padding: 10,
  },
  uploadButton: {
    padding: 10,
  },
  scannerFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginTop: 12,
    letterSpacing: -0.3,
  },
  qrInfoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  qrInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
    marginRight: 8,
    fontWeight: '500',
  },
  qrInfoValue: {
    fontSize: 12,
    color: '#1a202c',
    fontWeight: '600',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  premiumOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionIconContainer: {
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    color: '#1a202c',
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 8,
    padding: 12,
  },
  cancelText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
});
