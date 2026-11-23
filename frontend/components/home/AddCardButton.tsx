import Entypo from '@expo/vector-icons/Entypo';
import { router } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { HOME_CARD_HEIGHT, HOME_CARD_WIDTH } from './cardSize';

/** 名刺一覧の先頭に表示する「新しい名刺を作成」ボタン */
export function AddCardButton() {
  return (
    <TouchableOpacity
      onPress={() => router.navigate('/create-card')}
      className="w-80 h-48 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-gray-100"
      style={{
        width: HOME_CARD_WIDTH,
        height: HOME_CARD_HEIGHT,
        borderRadius: 12,
        marginTop: 8,
      }}
    >
      <Entypo name="plus" size={48} color="gray" />
      <Text className="mt-2 text-gray-600">新しい名刺を作成</Text>
    </TouchableOpacity>
  );
}
