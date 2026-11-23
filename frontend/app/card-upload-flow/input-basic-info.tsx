import { CardPreviewSection } from '@/components/card/CardPreviewSection';
import { pushInputLinks, useInputBasicInfoParams } from '@/components/card/cardUploadFlow';
import { FlowNavButtons } from '@/components/form/FlowNavButtons';
import { LabeledTextInput } from '@/components/form/FormTextInput';
import { KeyboardDismissScrollView } from '@/components/layout/KeyboardDismissScrollView';
import { showInputError } from '@/utils/alert';
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function InputBasicInfo() {
  const { imageUri } = useInputBasicInfoParams();
  const [name, setName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const hasName = !!name.trim();

  const handleNext = () => {
    if (!hasName) {
      showInputError("名前を入力してください。");
      return;
    }
    // 次のページ（SNSリンク設定）に移動
    pushInputLinks({ imageUri, name, bio });
  };

  return (
    <KeyboardDismissScrollView>
      <View className="p-4">
        <CardPreviewSection imageUri={imageUri} />

        {/* 名刺情報入力 */}
        <View className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <Text className="text-lg font-semibold mb-4">基本情報</Text>
          <View className="gap-4">
            <LabeledTextInput
              label="名前 *"
              placeholder="趣味の名刺"
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
            <LabeledTextInput
              label={`自己紹介 (${bio.length}/80)`}
              hint="趣味や一言メッセージなど"
              placeholder="簡単な自己紹介やプロフィールを入力"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              maxLength={80}
              textAlignVertical="top"
            />
          </View>
        </View>
      </View>

      <FlowNavButtons
        onBack={() => router.back()}
        onNext={handleNext}
        nextLabel="次へ"
        nextDisabled={!hasName}
      />

      {!hasName && (
        <Text className="text-xs text-gray-500 text-center pb-4">
          ※ 名前の入力が必要です
        </Text>
      )}
    </KeyboardDismissScrollView>
  );
}
