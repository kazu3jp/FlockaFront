import { Text, TextInput, TextInputProps, View } from 'react-native';

type AuthTextFieldProps = Omit<TextInputProps, 'className'> & {
  label: string;
  /** 外側の View に付ける className（例: "mt-6"） */
  className?: string;
};

/** ログイン・新規登録画面のラベルつき入力欄（メールアドレスなど） */
export function AuthTextField({ label, className, ...inputProps }: AuthTextFieldProps) {
  return (
    <View className={className}>
      <Text className='text-lg font-extrabold'>{label}</Text>
      <TextInput
        className="mt-3 h-14 border border-gray-400 rounded-lg px-4 text-base"
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
      />
    </View>
  );
}
