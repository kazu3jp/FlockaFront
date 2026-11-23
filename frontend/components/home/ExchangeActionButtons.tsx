import Entypo from '@expo/vector-icons/Entypo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type ActionButtonProps = {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
};

function ActionButton({ icon, label, onPress, disabled = false }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      className="items-center"
    >
      <View
        className="bg-white p-4 rounded-full"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
          elevation: 4,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {icon}
      </View>
      <Text className="mt-2" style={{ opacity: disabled ? 0.6 : 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

type ExchangeActionButtonsProps = {
  onScanPress: () => void;
};

/** 名刺交換の手段（近くの人と・コードを送るは未実装のため無効） */
export function ExchangeActionButtons({ onScanPress }: ExchangeActionButtonsProps) {
  return (
    <View className="flex-row gap-8 justify-center">
      <ActionButton
        icon={<MaterialCommunityIcons name="cellphone-wireless" size={24} color="black" />}
        label="近くの人と"
        disabled
      />
      <ActionButton icon={<Entypo name="link" size={24} color="black" />} label="コードを送る" disabled />
      <ActionButton
        icon={<MaterialCommunityIcons name="qrcode-scan" size={24} color="black" />}
        label="読み取る"
        onPress={onScanPress}
      />
    </View>
  );
}
