import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Insets, StyleProp, Text, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from 'react-native';

type PasswordFieldProps = Omit<TextInputProps, 'className' | 'secureTextEntry'> & {
  label?: string;
  /** ラベル横の補足（null で非表示） */
  hint?: string | null;
  /** 外側の View に付ける className（例: "mt-6"） */
  className?: string;
  /** 目アイコンのサイズ（sign-in: 24 / sign-up: 28） */
  iconSize?: number;
  /** 表示切替ボタンの hitSlop（sign-up のみ指定） */
  toggleHitSlop?: Insets;
  /** 表示切替ボタンの style（sign-up のみ `{ padding: 8 }`） */
  toggleStyle?: StyleProp<ViewStyle>;
};

/** ログイン・新規登録画面の、表示切替ボタンつきパスワード入力欄 */
export function PasswordField({
  label = 'パスワード',
  hint = '半角英数字のみ・8文字以上',
  className,
  iconSize = 24,
  toggleHitSlop,
  toggleStyle,
  ...inputProps
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <View className={className}>
      <View className="flex-row gap-5 items-center">
        <Text className='text-lg font-extrabold'>{label}</Text>
        {hint ? <Text className="text-sm text-gray-500">{hint}</Text> : null}
      </View>
      <View className="mt-3 h-14 border border-gray-400 rounded-lg px-4 flex-row items-center">
        <TextInput
          placeholder="パスワードを入力"
          className="flex-1 text-base"
          autoCapitalize="none"
          autoCorrect={false}
          {...inputProps}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          hitSlop={toggleHitSlop}
          style={toggleStyle}
        >
          <Ionicons
            name={showPassword ? "eye" : "eye-off"}
            size={iconSize}
            color="gray"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
