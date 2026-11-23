import { ActivityIndicator, Text, View, type ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

type CardQRCodeProps = {
  value: string;
  isGenerating: boolean;
  /** 「選択中の名刺の交換用QR」の注記を出すか */
  showCaption: boolean;
};

const shadowStyle: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 3,
  elevation: 4,
};

/** 選択中の名刺の交換用QRコード */
export function CardQRCode({ value, isGenerating, showCaption }: CardQRCodeProps) {
  return (
    <View className="items-center">
      {isGenerating ? (
        <View className="w-52 h-52 items-center justify-center bg-white rounded-lg" style={shadowStyle}>
          <ActivityIndicator size="large" color="#000000" />
          <Text className="mt-2 text-sm text-gray-600">QR生成中...</Text>
        </View>
      ) : (
        <View style={[shadowStyle, { borderRadius: 12 }]}>
          <View className="bg-white rounded-lg overflow-hidden">
            <QRCode value={value} size={200} quietZone={20} />
          </View>
        </View>
      )}
      {showCaption && <Text className="mt-2 text-sm text-gray-600">選択中の名刺の交換用QR</Text>}
    </View>
  );
}
