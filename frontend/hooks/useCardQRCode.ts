import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { apiClient } from '@/utils/api';

const INITIAL_QR_VALUE = 'Hello, QR Code!';

/** 選択中の名刺の交換用QRコードを、名刺が変わるたびに生成する */
export function useCardQRCode(cardId: string | null) {
  const [qrValue, setQrValue] = useState(INITIAL_QR_VALUE);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  useEffect(() => {
    if (!cardId) return;

    const generate = async () => {
      try {
        setIsGeneratingQR(true);
        const qrData = await apiClient.generateQRCode(cardId);
        setQrValue(qrData.qrData);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        Alert.alert('QRコード生成エラー', 'QRコードの生成に失敗しました。再度お試しください。', [
          { text: 'OK', style: 'default' },
        ]);
      } finally {
        setIsGeneratingQR(false);
      }
    };

    generate();
  }, [cardId]);

  return { qrValue, isGeneratingQR };
}
