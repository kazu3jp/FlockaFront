import { StyleSheet, TextInput, TextInputProps } from 'react-native';

/** AuthCardLayout 内の入力欄（forgot-password / reset-password） */
export function AuthCardInput({ style, ...props }: TextInputProps) {
  return <TextInput style={[styles.input, style]} {...props} />;
}

const styles = StyleSheet.create({
  input: { height: 48, borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
});
