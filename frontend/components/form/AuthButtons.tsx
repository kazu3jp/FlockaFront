import { ActivityIndicator, Pressable, Text } from 'react-native';

type AuthPrimaryButtonProps = {
  title: string;
  onPress: () => void;
  /** true の間はグレー背景＋スピナー表示で押せなくなる */
  loading?: boolean;
};

/** スタート・ログイン・新規登録画面の黒い大きなボタン */
export function AuthPrimaryButton({ title, onPress, loading = false }: AuthPrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-16 items-center justify-center rounded-lg ${loading ? 'bg-gray-400' : 'bg-black'}`}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text className="text-xl font-bold text-white">
          {title}
        </Text>
      )}
    </Pressable>
  );
}

type AuthSecondaryButtonProps = {
  title: string;
  onPress: () => void;
  /** true: 枠線つき（スタート画面の「ログイン」）/ false: 文字だけ（「新規登録はこちら」など） */
  outlined?: boolean;
};

/** スタート・ログイン・新規登録画面の白い（文字だけ／枠線つき）大きなボタン */
export function AuthSecondaryButton({ title, onPress, outlined = false }: AuthSecondaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={
        outlined
          ? 'h-16 items-center justify-center border border-gray-400 mt-8 rounded-lg'
          : 'h-16 items-center justify-center mt-2'
      }
    >
      <Text className="text-xl font-bold">
        {title}
      </Text>
    </Pressable>
  );
}
