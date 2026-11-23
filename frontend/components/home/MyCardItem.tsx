import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { apiClient, type Card } from '@/utils/api';
import { HOME_CARD_HEIGHT, HOME_CARD_WIDTH } from './cardSize';

type MyCardItemProps = {
  card: Card;
  isSelected: boolean;
  onPress: () => void;
};

const containerStyle: ViewStyle = {
  width: HOME_CARD_WIDTH,
  alignItems: 'center',
  marginTop: 8,
};

const goToEdit = (cardId: string) => router.push(`/edit-card?id=${cardId}`);

/** ホームの名刺一覧の1枚（タップで選択、長押し・鉛筆アイコンで編集） */
export function MyCardItem({ card, isSelected, onPress }: MyCardItemProps) {
  const frameStyle: ViewStyle = {
    width: HOME_CARD_WIDTH,
    height: HOME_CARD_HEIGHT,
    boxShadow: isSelected ? '0 0 0 4px #6d6d6d' : undefined, // 選択時にグレーの枠を表示
    borderRadius: 12,
    overflow: 'hidden', // 画像が角丸に収まるように
  };

  if (card.image_key) {
    return (
      <View style={containerStyle}>
        <TouchableOpacity
          onPress={onPress}
          onLongPress={() => goToEdit(card.id)}
          className="w-80"
          style={frameStyle}
        >
          <Image
            source={{ uri: apiClient.getCardImageUrl(card.image_key) }}
            resizeMode="contain"
            className="w-full h-48"
            style={{ width: HOME_CARD_WIDTH, height: HOME_CARD_HEIGHT }}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goToEdit(card.id)} className="flex-row items-center mt-2">
          <Text className="text-center text-lg font-medium text-black mr-1">{card.card_name}</Text>
          <MaterialIcons name="edit" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    );
  }

  // 画像が未設定の名刺はサンプル画像で表示する
  return (
    <View style={containerStyle}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={() => {
          if (card.id) goToEdit(card.id);
        }}
        className="w-80"
        style={frameStyle}
      >
        <Image
          source={require('../../assets/images/sample-profile-card.png')}
          resizeMode="contain"
          className="w-full"
          style={{ height: HOME_CARD_HEIGHT }}
        />
      </TouchableOpacity>
      <View className="flex-row items-center mt-2">
        <Text className="text-center text-lg font-medium text-black mr-1">
          {card.card_name || 'サンプル名刺'}
        </Text>
        {card.id ? (
          <TouchableOpacity onPress={() => goToEdit(card.id)}>
            <MaterialIcons name="edit" size={16} color="#6B7280" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
