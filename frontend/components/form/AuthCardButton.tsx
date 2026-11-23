import { ActivityIndicator, Pressable, Text } from 'react-native';

type AuthCardButtonProps = {
  title: string;
  onPress: () => void;
  /** true の間はスピナー表示＋押せなくなる */
  loading?: boolean;
  /** loading 以外で押せなくする条件（例: 再送のクールダウン中） */
  disabled?: boolean;
  /** primary: 濃紺背景・白文字 / outline: 白背景・枠線 */
  variant?: 'primary' | 'outline';
  marginBottom?: number;
};

/** AuthCardLayout 内のボタン（sign-up-auth / forgot-password / reset-password） */
export function AuthCardButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  marginBottom = 8,
}: AuthCardButtonProps) {
  const isDisabled = loading || disabled;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={{
        backgroundColor: isPrimary ? '#111827' : '#fff',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        ...(isPrimary ? {} : { borderWidth: 1, borderColor: '#E5E7EB' }),
        marginBottom,
        opacity: isDisabled ? 0.7 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : '#111827'} />
      ) : (
        <Text style={{ color: isPrimary ? '#fff' : '#111827', fontWeight: '600' }}>{title}</Text>
      )}
    </Pressable>
  );
}

type AuthCardLinkButtonProps = {
  title: string;
  onPress: () => void;
};

/** AuthCardLayout 内の文字だけのリンク（「ログインへ戻る」「ホームへ」） */
export function AuthCardLinkButton({ title, onPress }: AuthCardLinkButtonProps) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', paddingVertical: 8 }}>
      <Text style={{ color: '#374151' }}>{title}</Text>
    </Pressable>
  );
}
