import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { alertAndGoBack } from '@/utils/alert';

/** 連続スキャンを無視する間隔 */
const SCAN_DEBOUNCE_MS = 1000;

export default function ScanQr() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const lastScanTime = useRef(0);
  const { selectedCardId } = useLocalSearchParams<{ selectedCardId: string }>();

  // 画面がフォーカスされたときにスキャンフラグをリセット
  useFocusEffect(
    useCallback(() => {
      setIsScanned(false);
      lastScanTime.current = 0;
    }, [])
  );

  if (!permission) {
    return <View className="flex-1" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-center pb-2">We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  // QRコードスキャン後の処理
  const handleQRCodeScanned = (qrData: string) => {
    // 既にスキャン済みの場合は処理しない
    if (isScanned) return;

    // デバウンス: 1秒以内の連続スキャンを防ぐ
    const now = Date.now();
    if (now - lastScanTime.current < SCAN_DEBOUNCE_MS) return;
    lastScanTime.current = now;

    if (!selectedCardId) {
      alertAndGoBack('エラー', '交換する名刺が選択されていません。');
      return;
    }

    // スキャンフラグを立てて重複を防ぐ
    setIsScanned(true);

    // 名刺プレビューページに遷移
    router.push({
      pathname: '/card-preview',
      params: { qrData, selectedCardId },
    });
  };

  return (
    <View className="flex-1">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={isScanned ? undefined : ({ data }) => handleQRCodeScanned(data)}
      />
    </View>
  );
}
