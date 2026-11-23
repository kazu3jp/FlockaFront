import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { apiClient, type Card } from '@/utils/api';

/**
 * 自分の名刺一覧の取得・選択・プルトゥリフレッシュ。
 * 取得するたびに先頭の名刺を選択状態にする。
 * 画面に戻ってきたとき（編集から戻った時など）は再取得する。
 */
export function useMyCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // フォーカス時の再取得の判定にだけ使うので ref で持つ
  const hasInitializedRef = useRef(false);
  const refreshingRef = useRef(false);

  const fetchCards = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      const apiCards = await apiClient.getMyCards();
      setCards(apiCards);

      // 初期選択を最初の名刺に設定（追加ボタンではない）
      if (apiCards.length > 0) {
        setSelectedId(apiCards[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      Alert.alert('名刺取得エラー', '名刺情報の取得に失敗しました。再度お試しください。', [
        { text: 'OK', style: 'default' },
      ]);
    } finally {
      if (!isRefresh) {
        setIsLoading(false);
        hasInitializedRef.current = true;
      }
    }
  }, []);

  const onRefresh = useCallback(async () => {
    refreshingRef.current = true;
    setRefreshing(true);
    await fetchCards(true);
    refreshingRef.current = false;
    setRefreshing(false);
  }, [fetchCards]);

  // 初回ロード
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // 画面がフォーカスされた時にデータを更新（初期化完了後で、かつリフレッシュ中でない場合のみ）
  useFocusEffect(
    useCallback(() => {
      if (hasInitializedRef.current && !refreshingRef.current) {
        fetchCards(true);
      }
    }, [fetchCards])
  );

  return { cards, selectedId, setSelectedId, isLoading, refreshing, onRefresh };
}
