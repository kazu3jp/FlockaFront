import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import type { CardLink } from '@/utils/api';

const openLink = (url: string) => {
  Linking.openURL(url).catch((err) => {
    console.error('Failed to open URL:', err);
  });
};

/** 名刺のリンク一覧（タップで外部ブラウザを開く） */
export function CardLinkList({ links }: { links: CardLink[] }) {
  return (
    <>
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
    </>
  );
}
