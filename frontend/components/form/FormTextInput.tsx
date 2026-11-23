import type { ReactNode } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

type FormTextInputProps = Omit<TextInputProps, 'className'>;

/** 名刺作成フローの白い入力欄 */
export function FormTextInput(props: FormTextInputProps) {
  return (
    <TextInput
      className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
      {...props}
    />
  );
}

type LabeledTextInputProps = FormTextInputProps & {
  /** ラベル（文字数表示などを含めたい場合は ReactNode で渡す） */
  label: ReactNode;
  /** 入力欄の下の補足テキスト */
  hint?: string;
};

/** 名刺作成フローのラベルつき入力欄 */
export function LabeledTextInput({ label, hint, ...inputProps }: LabeledTextInputProps) {
  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      <FormTextInput {...inputProps} />
      {hint ? <Text className="text-xs text-gray-500 mt-1">{hint}</Text> : null}
    </View>
  );
}
