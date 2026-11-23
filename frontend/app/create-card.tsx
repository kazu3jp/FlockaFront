import { APP_BACKGROUND_COLOR } from '@/constants/ui';
import { router } from "expo-router";
import { Image, ImageSourcePropType, Pressable, Text, View } from "react-native";

type CreateOptionProps = {
  title: string;
  image: ImageSourcePropType;
  onPress?: () => void;
};

/** 作成方法を選ぶカード（サンプル画像＋文言） */
function CreateOption({ title, image, onPress }: CreateOptionProps) {
  return (
    <Pressable onPress={onPress} className="flex-col items-center p-4 bg-white border border-gray-100 shadow shadow-gray-200 rounded">
      <Image source={image} className="w-80 h-48" resizeMode="contain" />
      <Text className="text-xl font-bold">{title}</Text>
    </Pressable>
  );
}

export default function CreateCard() {
  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      <Text className="text-2xl font-bold">
        名刺作成
      </Text>
      <View className="flex-col gap-6 mt-10">
        {/* TODO: テンプレートからの作成は未実装 */}
        <CreateOption
          title="テンプレートから作成"
          image={require('../assets/images/create-template-sample.png')}
        />
        <CreateOption
          title="名刺をアップロード"
          image={require('../assets/images/upload-card-sample.png')}
          onPress={() => router.navigate('/card-upload')}
        />
      </View>
    </View>
  );
}
