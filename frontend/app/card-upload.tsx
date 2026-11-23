import { pushInputBasicInfo } from '@/components/card/cardUploadFlow';
import { CARD_ASPECT_RATIO, CARD_HEIGHT_MM, CARD_WIDTH_MM } from '@/constants/card';
import { APP_BACKGROUND_COLOR } from '@/constants/ui';
import Entypo from '@expo/vector-icons/Entypo';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";

// 出力サイズ（ピクセル）: 名刺サイズ（mm）の10倍 = 910×550px
const OUTPUT_WIDTH = CARD_WIDTH_MM * 10;
const OUTPUT_HEIGHT = CARD_HEIGHT_MM * 10;

// 画面上のプレビューサイズ（名刺比率を維持: 350×212px）
const PREVIEW_STYLE = {
  width: 350,
  height: Math.round(350 / CARD_ASPECT_RATIO),
  aspectRatio: CARD_ASPECT_RATIO,
};

type PickedImage = {
  uri: string;
  /** 概算のファイルサイズ（例: "120KB"）。取得できなければ null */
  size: string | null;
};

/** 画像を選んで名刺サイズにクロップ・リサイズ・圧縮する。キャンセル時は null */
async function pickCardImage(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true, // 編集を有効にして強制クロップ
    aspect: [CARD_WIDTH_MM, CARD_HEIGHT_MM], // 名刺の実際のサイズ比率（91mm × 55mm）
    quality: 0.8, // 圧縮品質80%
  });

  if (result.canceled) return null;

  const originalUri = result.assets[0].uri;
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      originalUri,
      [{ resize: { width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT } }],
      {
        compress: 0.7, // 70%圧縮
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return { uri: manipulatedImage.uri, size: await getFileSizeLabel(manipulatedImage.uri) };
  } catch (error) {
    console.error('Image processing failed:', error);
    // 処理に失敗した場合は元の画像を使用
    return { uri: originalUri, size: null };
  }
}

/** ファイルサイズを取得（概算） */
async function getFileSizeLabel(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return `${Math.round(blob.size / 1024)}KB`;
}

export default function CardUpload() {
  const [image, setImage] = useState<PickedImage | null>(null);

  const pickImage = async () => {
    const picked = await pickCardImage();
    if (picked) setImage(picked);
  };

  const handleNext = () => {
    if (!image) {
      Alert.alert("画像が選択されていません", "アップロードする画像を選択してください。");
      return;
    }
    pushInputBasicInfo({ imageUri: image.uri });
  };

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      <View className="text-start mb-10">
        <Text className="text-xl font-bold">名刺を選択</Text>
        <Text className="text-gray-400">名刺サイズ（91×55mm）で切り取り・自動調整されます</Text>
        <Text className="text-gray-400">サポートされている形式: PNG, JPG</Text>
      </View>
      <View className="items-center">
        {image ? (
          <Image
            source={{ uri: image.uri }}
            className="border border-gray-300 rounded-lg"
            style={PREVIEW_STYLE}
            resizeMode="cover"
          />
        ) : (
          <Pressable
            onPress={pickImage}
            className="flex-col items-center justify-center bg-white border border-gray-300 border-dashed rounded-lg"
            style={PREVIEW_STYLE}
          >
            <Entypo name="image" size={32} color="gray" />
            <Text className="text-lg font-bold text-gray-400 mt-2">名刺を選択</Text>
          </Pressable>
        )}
        <Text className="text-xs text-gray-500 mt-2">
          名刺サイズ（91×55mm、910×550px）{image?.size && ` • ${image.size}`}
        </Text>
        {image && (
          <Pressable
            onPress={pickImage}
            className="mt-3 px-4 py-2 bg-gray-100 rounded-lg"
          >
            <Text className="text-sm text-gray-700">名刺を変更</Text>
          </Pressable>
        )}
      </View>
      <View className="flex-row gap-4 mt-10 px-4">
        <Pressable
          onPress={() => router.back()}
          className="flex-1 py-3 rounded bg-white items-center justify-center"
        >
          <Text className="text-xl font-bold">キャンセル</Text>
        </Pressable>
        <Pressable
          onPress={handleNext}
          className="flex-1 py-3 rounded bg-black items-center justify-center"
        >
          <Text className="text-xl font-bold text-white">次へ</Text>
        </Pressable>
      </View>
    </View>
  );
}
