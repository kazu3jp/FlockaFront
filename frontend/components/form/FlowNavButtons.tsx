import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type FlowNavButtonsProps = {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  backLabel?: string;
  /** 「次へ」側を押せなくする */
  nextDisabled?: boolean;
  /** 「次へ」が押せないときの不透明度（input-basic-info: 0.5 / input-links: 0.7） */
  nextDisabledOpacity?: number;
  /** 「戻る」側を押せなくする（押せないときは不透明度 0.5） */
  backDisabled?: boolean;
  /** true のとき「次へ」にスピナーと loadingLabel を表示 */
  loading?: boolean;
  loadingLabel?: string;
};

/** 名刺作成フロー下部の「戻る」「次へ」ボタン */
export function FlowNavButtons({
  onBack,
  onNext,
  nextLabel,
  backLabel = '戻る',
  nextDisabled = false,
  nextDisabledOpacity = 0.5,
  backDisabled = false,
  loading = false,
  loadingLabel,
}: FlowNavButtonsProps) {
  return (
    <View className="flex-row gap-4 p-4 pb-8">
      <Pressable
        onPress={onBack}
        className="flex-1 py-3 rounded-lg bg-white border border-gray-300 items-center justify-center"
        disabled={backDisabled}
        style={{
          opacity: backDisabled ? 0.5 : 1
        }}
      >
        <Text className="text-lg font-medium text-gray-700">{backLabel}</Text>
      </Pressable>
      <Pressable
        onPress={onNext}
        className="flex-1 py-3 rounded-lg bg-black items-center justify-center"
        disabled={nextDisabled}
        style={{
          opacity: nextDisabled ? nextDisabledOpacity : 1
        }}
      >
        <View className="flex-row items-center">
          {loading && (
            <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
          )}
          <Text className="text-lg font-bold text-white">
            {loading && loadingLabel ? loadingLabel : nextLabel}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
