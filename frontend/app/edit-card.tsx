import {
  createEmptyLink,
  isCompleteLink,
  removeLinkAt,
  updateLinkAt,
} from '@/components/card/cardLinks';
import { LoadingButton } from '@/components/form/LoadingButton';
import { KeyboardDismissScrollView } from '@/components/layout/KeyboardDismissScrollView';
import { APP_BACKGROUND_COLOR } from '@/constants/ui';
import { alertAndGoBack, confirmAlert } from '@/utils/alert';
import { apiClient, type Card, type CardLink } from '@/utils/api';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

/** 白い枠の入力セクション */
function Section({ children }: { children: ReactNode }) {
  return (
    <View className="bg-white rounded-lg p-6 mb-6 border border-gray-100 shadow shadow-gray-200">
      {children}
    </View>
  );
}

/** 入力欄の下の「n/最大文字」表示 */
function CharCount({ length, max }: { length: number; max: number }) {
  return (
    <Text className="text-right text-sm text-gray-500 mt-2">
      {length}/{max}文字
    </Text>
  );
}

/** 「戻る」ボタン */
function BackButton({ className }: { className: string }) {
  return (
    <TouchableOpacity onPress={() => router.back()} className={className}>
      <Text className="text-white font-bold text-lg">戻る</Text>
    </TouchableOpacity>
  );
}

/** カード画像の選択枠 */
function CardImagePicker({ imageUri, onPress }: { imageUri: string | null; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-full h-52 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          className="w-full h-full rounded-lg"
          resizeMode="contain"
        />
      ) : (
        <View className="items-center">
          <MaterialIcons name="add-photo-alternate" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2 text-lg">画像を選択</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

type LinkEditorProps = {
  index: number;
  link: CardLink;
  onChange: (field: keyof CardLink, value: string) => void;
  onRemove: () => void;
};

/** リンク1件の編集欄 */
function LinkEditor({ index, link, onChange, onRemove }: LinkEditorProps) {
  return (
    <View className="border border-gray-300 rounded-lg p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold">リンク {index + 1}</Text>
        <TouchableOpacity onPress={onRemove}>
          <MaterialIcons name="delete" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <TextInput
        value={link.title}
        onChangeText={(text) => onChange('title', text)}
        placeholder="タイトル (例: Twitter)"
        className="border border-gray-300 rounded-lg p-3 mb-3 text-lg"
      />
      <TextInput
        value={link.url}
        onChangeText={(text) => onChange('url', text)}
        placeholder="URL (例: https://twitter.com/username)"
        className="border border-gray-300 rounded-lg p-3 text-lg"
        keyboardType="url"
        autoCapitalize="none"
      />
    </View>
  );
}

export default function EditCard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [card, setCard] = useState<Card | null>(null);
  const [cardName, setCardName] = useState('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState<CardLink[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // カードデータを取得
  useEffect(() => {
    const fetchCardData = async () => {
      if (!id) {
        alertAndGoBack('エラー', 'カードIDが指定されていません。');
        return;
      }

      try {
        setLoading(true);
        const cards = await apiClient.getMyCards();
        const targetCard = cards.find((c) => c.id === id);

        if (!targetCard) {
          alertAndGoBack('エラー', '指定されたカードが見つかりません。');
          return;
        }

        setCard(targetCard);
        setCardName(targetCard.card_name || '');
        setBio(targetCard.bio || '');
        setLinks(Array.isArray(targetCard.links) ? targetCard.links : []);
        if (targetCard.image_key) {
          setSelectedImage(apiClient.getCardImageUrl(targetCard.image_key));
        }
      } catch (error) {
        console.error('Failed to fetch card:', error);
        alertAndGoBack('エラー', 'カード情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchCardData();
  }, [id]);

  // 画像選択
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // カード更新
  const handleUpdateCard = async () => {
    if (!card || !cardName.trim()) {
      Alert.alert('エラー', 'カード名は必須です。');
      return;
    }

    try {
      setUpdating(true);

      // 画像をアップロード（新しい画像が選択された場合）
      let imageKey = card.image_key;
      if (selectedImage && !selectedImage.startsWith('http')) {
        const uploadResult = await apiClient.uploadImage(selectedImage);
        imageKey = uploadResult.imageKey;
      }

      // カード情報を更新
      await apiClient.updateCard(card.id, {
        card_name: cardName,
        bio: bio || undefined,
        image_key: imageKey,
        links: links.filter(isCompleteLink),
      });

      Alert.alert('成功', 'カード情報を更新しました。', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Failed to update card:', error);
      Alert.alert('エラー', 'カード情報の更新に失敗しました。');
    } finally {
      setUpdating(false);
    }
  };

  // カード削除
  const handleDeleteCard = () => {
    if (!card) return;
    confirmAlert({
      title: 'カード削除',
      message: 'このカードを削除しますか？この操作は取り消せません。',
      confirmText: '削除',
      onConfirm: async () => {
        try {
          setDeleting(true);
          await apiClient.deleteCard(card.id);
          Alert.alert('成功', 'カードを削除しました。', [
            { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
          ]);
        } catch (error) {
          console.error('Failed to delete card:', error);
          Alert.alert('エラー', 'カードの削除に失敗しました。');
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
        <ActivityIndicator size="large" color="#000000" />
        <Text className="mt-4 text-xl">カード情報を読み込み中...</Text>
        <BackButton className="mt-6 bg-gray-500 px-8 py-4 rounded-lg" />
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
        <Text className="text-xl text-red-500 text-center">カード情報の読み込みに失敗しました</Text>
        <BackButton className="mt-6 bg-black px-8 py-4 rounded-lg" />
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView className="flex-1" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
        <KeyboardDismissScrollView scrollClassName="flex-1">
          <View className="p-6">
            <Section>
              <Text className="text-xl font-bold mb-4">カード画像</Text>
              <CardImagePicker imageUri={selectedImage} onPress={pickImage} />
            </Section>

            <Section>
              <Text className="text-xl font-bold mb-4">カード名 *</Text>
              <TextInput
                value={cardName}
                onChangeText={setCardName}
                placeholder="カード名を入力"
                className="border border-gray-300 rounded-lg p-4 text-lg"
                maxLength={50}
              />
              <CharCount length={cardName.length} max={50} />
            </Section>

            <Section>
              <Text className="text-xl font-bold mb-4">Bio（任意）</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="自己紹介を入力"
                multiline
                numberOfLines={4}
                className="border border-gray-300 rounded-lg p-4 h-28 text-lg"
                textAlignVertical="top"
                maxLength={200}
              />
              <CharCount length={bio.length} max={200} />
            </Section>

            <Section>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold">リンク</Text>
                <TouchableOpacity
                  onPress={() => setLinks((prev) => [...prev, createEmptyLink()])}
                  className="bg-black px-4 py-3 rounded-lg"
                >
                  <Text className="text-white font-bold">追加</Text>
                </TouchableOpacity>
              </View>

              {links.map((link, index) => (
                <LinkEditor
                  key={index}
                  index={index}
                  link={link}
                  onChange={(field, value) => setLinks((prev) => updateLinkAt(prev, index, field, value))}
                  onRemove={() => setLinks((prev) => removeLinkAt(prev, index))}
                />
              ))}
            </Section>
          </View>
        </KeyboardDismissScrollView>
      </SafeAreaView>

      {/* 更新と削除ボタン */}
      <View className="bg-white border-t border-gray-100 px-6 py-6">
        <View className="flex-row gap-4">
          <LoadingButton
            label="削除"
            loadingLabel="削除中..."
            loading={deleting}
            onPress={handleDeleteCard}
            className="flex-1 bg-red-500 py-4 rounded-lg"
            textClassName="text-white font-bold text-xl"
            pressFeedback="opacity"
          />
          <LoadingButton
            label="更新"
            loadingLabel="更新中..."
            loading={updating}
            onPress={handleUpdateCard}
            className="flex-1 bg-black py-4 rounded-lg"
            textClassName="text-white font-bold text-xl"
            pressFeedback="opacity"
          />
        </View>
      </View>
    </>
  );
}
