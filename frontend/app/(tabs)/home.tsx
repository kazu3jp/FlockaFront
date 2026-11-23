import { router } from 'expo-router';
import { Alert, RefreshControl, SafeAreaView, ScrollView, View } from 'react-native';
import { CardQRCode } from '@/components/home/CardQRCode';
import { ExchangeActionButtons } from '@/components/home/ExchangeActionButtons';
import { MyCardCarousel } from '@/components/home/MyCardCarousel';
import QRExchangeLogPreview from '@/components/QRExchangeLogPreview';
import { APP_BACKGROUND_COLOR, REFRESH_CONTROL_COLORS } from '@/constants/ui';
import { useCardQRCode } from '@/hooks/useCardQRCode';
import { useMyCards } from '@/hooks/useMyCards';
import { useQRExchangeNotifications } from '@/hooks/useQRExchangeNotifications';

export default function Home() {
  const { cards, selectedId, setSelectedId, isLoading, refreshing, onRefresh } = useMyCards();
  const { qrValue, isGeneratingQR } = useCardQRCode(selectedId);
  // QR交換通知をチェック
  const { newExchangeLog, showPreview, closePreview } = useQRExchangeNotifications();

  const handleScanPress = () => {
    if (selectedId) {
      router.push(`/scan-qr?selectedCardId=${selectedId}`);
    } else {
      Alert.alert(
        '名刺を選択してください',
        '交換する名刺を選択してからQRコードを読み取ってください。',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} {...REFRESH_CONTROL_COLORS} />
        }
      >
        <View className="flex-1 items-center justify-center px-4 py-6">
          <View className="flex-col items-center gap-8 w-full">
            <CardQRCode value={qrValue} isGenerating={isGeneratingQR} showCaption={!!selectedId} />

            <ExchangeActionButtons onScanPress={handleScanPress} />

            <View className="w-full">
              <MyCardCarousel
                cards={cards}
                selectedId={selectedId}
                onSelect={setSelectedId}
                isLoading={isLoading}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* QR交換通知プレビュー */}
      <QRExchangeLogPreview visible={showPreview} onClose={closePreview} exchangeLog={newExchangeLog} />
    </SafeAreaView>
  );
}
