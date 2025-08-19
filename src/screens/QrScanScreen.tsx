import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import type { StackNavigationProp } from '@react-navigation/stack';

export default function QrScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState<typeof BarCodeScanner.Constants.Type.back | typeof BarCodeScanner.Constants.Type.front>(BarCodeScanner.Constants.Type.back);
  const [scanned, setScanned] = useState<boolean>(false);
  const [image, setImage] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Chat'>>();

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted' ? true : false);
    })();
  }, []);

  // Handle live QR scan
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    // Parse topic from QR data
    // Example: { subject, class, chapter } in QR data
    let topic: { subject: string; class: number; chapter: string };
    try {
      const parsed = JSON.parse(data);
      topic = {
        subject: parsed.subject || '',
        class: typeof parsed.class === 'number' ? parsed.class : Number(parsed.class) || 0,
        chapter: parsed.chapter || '',
      };
    } catch {
      topic = { subject: data, class: 0, chapter: '' };
    }
    navigation.navigate('Chat', topic);
  };

  // Handle image upload and QR decode
  const handleImageUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ base64: true });
    if (!result.cancelled && result.base64 && result.uri) {
      setImage(result.uri);
      // You can use a QR decode library here (e.g., jsQR)
      // For now, just show image and simulate navigation
      // navigation.navigate('Chat', { subject: 'ImageQR', class: '', chapter: '' });
    }
  };

  if (hasPermission === null) return <Text>Requesting camera permission...</Text>;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        type={type}
        style={{ flex: 1 }}
      />
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => setType(
          type === BarCodeScanner.Constants.Type.back
            ? BarCodeScanner.Constants.Type.front
            : BarCodeScanner.Constants.Type.back
        )}>
          <Text style={styles.buttonText}>Reverse Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleImageUpload}>
          <Text style={styles.buttonText}>Upload Image</Text>
        </TouchableOpacity>
        {scanned && (
          <TouchableOpacity onPress={() => setScanned(false)}>
            <Text style={styles.buttonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
      {image && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />
          <Text style={{ marginTop: 8 }}>Image selected. (QR decode logic needed)</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
  },
  buttonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagePreview: {
    alignItems: 'center',
    marginTop: 16,
  },
});
