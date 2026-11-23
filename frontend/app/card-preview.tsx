import { LoadingView } from '@/components/layout/LoadingView';
import { APP_BACKGROUND_COLOR } from '@/constants/ui';
import { alertAndGoBack, confirmAlert } from '@/utils/alert';
import { apiClient, type CardLink, type PublicCard, type QRTokenInfo } from '@/utils/api';
import { getErrorMessage } from '@/utils/errors';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// リンクを開く
const openLink = (url: string) => {
  Linking.openURL(url).catch(err => {
    console.error("Failed to open URL:", err);
    Alert.alert("エラー", "リンクを開くことができませんでした。");
  });
};

/** 名刺画像（画像がなければ「画像なし」） */
function PreviewImage({ card }: { card: PublicCard }) {
  return (
    <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
      {(card.image_url || card.image_key) ? (
        <Image
          source={{ uri: apiClient.resolveCardImageUrl(card.image_url, card.image_key) }}
          className="w-full h-48 rounded-lg"
          resizeMode="contain"
        />
      ) : (
        <View className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
          <MaterialIcons name="image" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2">画像なし</Text>
        </View>
      )}
    </View>
  );
}

/** リンク一覧（タップでブラウザを開く） */
function PreviewLinks({ links }: { links: CardLink[] }) {
  return (
    <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <Text className="text-lg font-semibold text-gray-800 mb-3">リンク</Text>
      {links.map((link, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => openLink(link.url)}
          className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0"
        >
          <FontAwesome5 name="external-link-alt" size={16} color="#3B82F6" />
          <View className="ml-3 flex-1">
            <Text className="font-medium text-gray-800">{link.title}</Text>
            <Text className="text-sm text-blue-600" numberOfLines={1}>
              {link.url}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

/** 下部の「キャンセル」「交換」「削除」ボタン */
function ActionButtons({
  isExchanging,
  onCancel,
  onExchange,
  onDelete,
}: {
  isExchanging: boolean;
  onCancel: () => void;
  onExchange: () => void;
  onDelete: () => void;
}) {
  return (
    <View className="bg-white border-t border-gray-200 px-4 py-4">
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onCancel}
          className="flex-1 bg-gray-500 py-4 rounded-lg"
          disabled={isExchanging}
        >
          <Text className="text-white text-center font-semibold text-lg">
            キャンセル
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onExchange}
          className="flex-1 bg-blue-600 py-4 rounded-lg"
          disabled={isExchanging}
        >
          {isExchanging ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              交換
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDelete}
          className="flex-1 bg-red-600 py-4 rounded-lg"
        >
          <Text className="text-white text-center font-semibold text-lg">
            削除
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CardPreview() {
  const { qrData, selectedCardId } = useLocalSearchParams<{
    qrData: string;
    selectedCardId: string;
  }>();

  const [cardData, setCardData] = useState<QRTokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [memo, setMemo] = useState('');
  const [isExchanging, setIsExchanging] = useState(false);

  // QRトークン情報を取得
  useEffect(() => {
    const fetchCardData = async () => {
      if (!qrData) {
        alertAndGoBack("エラー", "QRコードデータが見つかりません。");
        return;
      }

      try {
        setIsLoading(true);
        setCardData(await apiClient.getQRTokenInfo(qrData));
      } catch (error) {
        console.error('Failed to fetch card data:', error);
        const errorMessage = getErrorMessage(error, 'Unknown error');
        alertAndGoBack(
          "名刺情報取得エラー",
          `名刺情報の取得に失敗しました。\n詳細: ${errorMessage}\n\nQRコードの有効期限が切れている可能性があります。`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCardData();
  }, [qrData]);

  // 名刺交換処理
  const handleExchange = async () => {
    if (!selectedCardId || !qrData) {
      Alert.alert("エラー", "交換に必要な情報が不足しています。");
      return;
    }

    try {
      setIsExchanging(true);

      const result = await apiClient.exchangeWithQRCode(
        qrData,
        selectedCardId,
        memo.trim() || `QRコード交換 (${new Date().toLocaleDateString()})`
      );

      // 即時交換成功 - 受け取った名刺の詳細を表示
      const yourNewCardName = result.exchangedCards?.yourNewCard?.card_name || '名刺';
      const yourSentCardName = result.exchangedCards?.yourCardSent?.card_name || 'あなたの名刺';

      Alert.alert(
        "交換成功！",
        `「${yourNewCardName}」を受け取りました！\n\n相手にも「${yourSentCardName}」が送信されました。\n\nコレクションに追加されました。`,
        [
          {
            text: "ホームに戻る",
            onPress: () => router.replace('/(tabs)/home')
          }
        ]
      );
    } catch (error) {
      console.error('Exchange failed:', error);
      const errorMessage = getErrorMessage(error, 'Unknown error');
      Alert.alert(
        "交換エラー",
        `名刺の交換に失敗しました。\n詳細: ${errorMessage}\n\n再度お試しください。`,
        [{ text: "OK", style: "default" }]
      );
    } finally {
      setIsExchanging(false);
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    confirmAlert({
      title: "交換をキャンセル",
      message: "名刺の交換をキャンセルしますか？",
      cancelText: "続ける",
      confirmText: "キャンセル",
      onConfirm: () => router.back(),
    });
  };

  // 名刺削除処理
  const handleDelete = () => {
    if (!cardData) {
      Alert.alert("エラー", "削除する名刺情報が見つかりません。");
      return;
    }

    confirmAlert({
      title: "名刺を削除",
      message: "この名刺をコレクションから削除しますか？",
      confirmText: "削除",
      onConfirm: async () => {
        try {
          await apiClient.deleteCollection(cardData.cardId);
          Alert.alert("削除成功", "名刺がコレクションから削除されました。", [
            { text: "OK", onPress: () => router.replace('/(tabs)/home') }
          ]);
        } catch (error) {
          console.error("Failed to delete card:", error);
          Alert.alert("削除エラー", "名刺の削除に失敗しました。再度お試しください。");
        }
      },
    });
  };

  if (isLoading) {
    return (
      <LoadingView
        message="名刺情報を読み込み中..."
        className="flex-1 justify-center items-center bg-white"
      />
    );
  }

  if (!cardData) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-red-500">名刺情報の読み込みに失敗しました</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-gray-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-medium">戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { card } = cardData;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ backgroundColor: APP_BACKGROUND_COLOR }}
    >
      <ScrollView className="flex-1">
        {/* ヘッダー */}
        <View className="bg-white px-4 py-6 border-b border-gray-200">
          <Text className="text-2xl font-bold text-center text-gray-800">
            {card.card_name}
          </Text>
          <Text className="text-sm text-center text-gray-600 mt-1">
            名刺プレビュー
          </Text>
        </View>

        <View className="p-4">
          <PreviewImage card={card} />

          {/* Bio情報 */}
          {card.bio && (
            <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <Text className="text-lg font-semibold text-gray-800 mb-2">Bio</Text>
              <Text className="text-gray-700 leading-6">{card.bio}</Text>
            </View>
          )}

          {Array.isArray(card.links) && card.links.length > 0 && (
            <PreviewLinks links={card.links} />
          )}

          {/* メモ入力 */}
          <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              メモ（任意）
            </Text>
            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="この名刺についてのメモを80文字以内で入力"
              multiline
              maxLength={80}
              className="border border-gray-300 rounded-lg p-3 h-20 text-gray-700"
              textAlignVertical="top"
            />
            <Text className="text-right text-xs text-gray-500 mt-1">
              {memo.length}/80文字
            </Text>
          </View>
        </View>
      </ScrollView>

      <ActionButtons
        isExchanging={isExchanging}
        onCancel={handleCancel}
        onExchange={handleExchange}
        onDelete={handleDelete}
      />
    </KeyboardAvoidingView>
  );
}
