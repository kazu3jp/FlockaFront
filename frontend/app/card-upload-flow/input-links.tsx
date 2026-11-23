import { CardPreviewSection } from '@/components/card/CardPreviewSection';
import {
  hasUrlBody,
  MAX_CARD_LINKS,
  normalizeLinkInput,
  removeLinkAt,
  withUrlScheme,
} from '@/components/card/cardLinks';
import { useInputLinksParams } from '@/components/card/cardUploadFlow';
import { FlowNavButtons } from '@/components/form/FlowNavButtons';
import { FormTextInput } from '@/components/form/FormTextInput';
import { KeyboardDismissScrollView } from '@/components/layout/KeyboardDismissScrollView';
import { showInputError } from '@/utils/alert';
import { apiClient, type CardLink } from '@/utils/api';
import { getErrorMessage } from '@/utils/errors';
import Entypo from '@expo/vector-icons/Entypo';
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

/** 追加済みリンクの1行 */
function AddedLinkItem({ link, onRemove }: { link: CardLink; onRemove: () => void }) {
  return (
    <View className="flex-row items-center gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-700">{link.title}</Text>
        <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>{link.url}</Text>
      </View>
      <Pressable onPress={onRemove} className="p-2">
        <Entypo name="cross" size={16} color="#ef4444" />
      </Pressable>
    </View>
  );
}

/** 新しいリンクを追加するフォーム */
function NewLinkForm({ onAdd }: { onAdd: (link: CardLink) => boolean }) {
  const [sns, setSns] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const addDisabled = !sns.trim() || !link.trim() || link.trim().length <= 3;

  const handleAdd = () => {
    if (onAdd({ title: sns, url: link })) {
      setSns("");
      setLink("");
    }
  };

  return (
    <View className="mt-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">新しいリンクを追加</Text>
      <View className="gap-3">
        <FormTextInput
          placeholder="SNS名 (例: Instagram, Twitter)"
          value={sns}
          onChangeText={setSns}
          autoCapitalize="none"
        />
        <FormTextInput
          placeholder="instagram.com/username"
          value={link}
          // 入力中は https:// を強制しない（http:// だけ https:// に置き換える）
          onChangeText={(text) => setLink(normalizeLinkInput(text))}
          // 何も入力されていない場合のみ https:// を設定
          onFocus={() => {
            if (link === '') setLink('https://');
          }}
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text className="text-xs text-gray-500 -mt-2">※ https://で始まるURLのみ対応</Text>
        <Pressable
          onPress={handleAdd}
          className="p-3 bg-gray-600 rounded-lg items-center"
          disabled={addDisabled}
          style={{ opacity: addDisabled ? 0.5 : 1 }}
        >
          <Text className="text-white font-medium">リンクを追加</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function InputLinks() {
  const { imageUri, name, bio } = useInputLinksParams();
  const [links, setLinks] = useState<CardLink[]>([]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const isFull = links.length >= MAX_CARD_LINKS;

  /** リンクを追加する。入力エラーでアラートを出した場合は false を返す */
  const handleAddLink = ({ title, url }: CardLink): boolean => {
    if (isFull) {
      Alert.alert("制限エラー", "リンクは最大4つまでです。");
      return false;
    }
    if (!title.trim() || !url.trim()) {
      showInputError("SNS名とURLの両方を入力してください。");
      return false;
    }

    // 追加時にスキームがなければ https:// を自動付与する
    const finalUrl = withUrlScheme(url);
    // https:// のあとに実際のURLがあるかチェック
    if (!hasUrlBody(finalUrl)) {
      Alert.alert("URLエラー", "有効なURLを入力してください。");
      return false;
    }

    setLinks([...links, { title, url: finalUrl }]);
    return true;
  };

  const handleCreateCard = async () => {
    if (!name?.trim()) {
      Alert.alert("エラー", "名前が設定されていません。");
      return;
    }
    if (!imageUri) {
      Alert.alert("エラー", "画像が選択されていません。");
      return;
    }

    setIsCreating(true);

    try {
      // 1. 画像をアップロード
      const { imageKey } = await apiClient.uploadImage(imageUri);

      // 2. カードを作成
      await apiClient.createCard({
        card_name: name.trim(),
        bio: bio?.trim() || "",
        image_key: imageKey,
        links,
      });

      // 3. 成功メッセージと画面遷移（ホーム画面に戻る）
      Alert.alert("完了", "名刺が作成されました！", [
        { text: "OK", onPress: () => router.push("/(tabs)/home") }
      ]);
    } catch (error) {
      console.error('カード作成エラー:', error);
      Alert.alert(
        "エラー",
        getErrorMessage(error, "名刺の作成に失敗しました。もう一度お試しください。")
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <KeyboardDismissScrollView>
      <View className="p-4">
        <CardPreviewSection imageUri={imageUri}>
          {/* 基本情報表示 */}
          <View className="mt-4 p-3 bg-white rounded-lg">
            <Text className="text-sm font-medium text-gray-700">名前: {name}</Text>
            {bio && <Text className="text-xs text-gray-600 mt-1">自己紹介: {bio}</Text>}
          </View>
        </CardPreviewSection>

        {/* SNSリンク設定部分 */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-semibold mb-4">SNSリンク設定</Text>
          <Text className="text-sm text-gray-600 mb-4">
            最大4つまでリンクを追加できます ({links.length}/{MAX_CARD_LINKS})
          </Text>

          {links.map((link, index) => (
            <AddedLinkItem
              key={index}
              link={link}
              onRemove={() => setLinks(removeLinkAt(links, index))}
            />
          ))}

          {isFull ? (
            <View className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Text className="text-amber-700 text-sm text-center">リンクは最大4つまでです</Text>
            </View>
          ) : (
            <NewLinkForm onAdd={handleAddLink} />
          )}
        </View>
      </View>

      <FlowNavButtons
        onBack={() => router.back()}
        onNext={handleCreateCard}
        nextLabel="名刺を作成"
        loadingLabel="作成中..."
        loading={isCreating}
        nextDisabled={isCreating}
        nextDisabledOpacity={0.7}
        backDisabled={isCreating}
      />
    </KeyboardDismissScrollView>
  );
}
