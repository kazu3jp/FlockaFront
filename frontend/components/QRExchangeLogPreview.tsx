import { MaterialIcons } from '@expo/vector-icons';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CardLinkList } from '@/components/exchange/CardLinkList';
import { PreviewSection } from '@/components/exchange/PreviewSection';
import { apiClient, type QRExchangeLog } from '@/utils/api';

interface QRExchangeLogPreviewProps {
  visible: boolean;
  onClose: () => void;
  exchangeLog: QRExchangeLog | null;
}

/** QR交換で名刺を受け取ったときに表示するモーダル */
export default function QRExchangeLogPreview({ visible, onClose, exchangeLog }: QRExchangeLogPreviewProps) {
  if (!exchangeLog) return null;

  const { scannerCard, memo, created_at } = exchangeLog;
  const hasImage = Boolean(scannerCard.image_url || scannerCard.image_key);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-gray-50">
        {/* ヘッダー */}
        <View className="bg-white px-4 py-6 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">名刺を受け取りました！</Text>
              <Text className="text-sm text-gray-600 mt-1">「{scannerCard.card_name}」</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-gray-100">
              <MaterialIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* 名刺画像 */}
          <PreviewSection title={scannerCard.card_name} titleClassName="mb-3">
            {hasImage ? (
              <Image
                source={{ uri: apiClient.resolveCardImageUrl(scannerCard.image_url, scannerCard.image_key) }}
                className="w-full h-48 rounded-lg"
                resizeMode="contain"
              />
            ) : (
              <View className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <MaterialIcons name="image" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">画像なし</Text>
              </View>
            )}
          </PreviewSection>

          {/* Bio情報 */}
          {scannerCard.bio ? (
            <PreviewSection title="Bio">
              <Text className="text-gray-700 leading-6">{scannerCard.bio}</Text>
            </PreviewSection>
          ) : null}

          {/* リンク情報 */}
          {scannerCard.links && scannerCard.links.length > 0 && (
            <PreviewSection title="リンク" titleClassName="mb-3">
              <CardLinkList links={scannerCard.links} />
            </PreviewSection>
          )}

          {/* メモ情報 */}
          {memo ? (
            <PreviewSection title="メモ">
              <Text className="text-gray-700 leading-6">{memo}</Text>
            </PreviewSection>
          ) : null}

          {/* 交換日時 */}
          <PreviewSection title="交換日時" className="mb-6">
            <Text className="text-gray-700">{new Date(created_at).toLocaleString('ja-JP')}</Text>
          </PreviewSection>
        </ScrollView>

        {/* 閉じるボタン */}
        <View className="bg-white border-t border-gray-200 px-4 py-4">
          <TouchableOpacity onPress={onClose} className="bg-blue-600 py-4 rounded-lg">
            <Text className="text-white text-center font-semibold text-lg">閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
