import { useCallback, useEffect, useState } from 'react';
import { apiClient, type CollectionItem } from '@/utils/api';
import { getErrorMessage } from '@/utils/errors';

/** 受け取った名刺（コレクション）の取得・プルトゥリフレッシュ・再試行 */
export function useCollection() {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);
      const data = await apiClient.getCollection();
      setCollection(data);
    } catch (err) {
      console.error('Failed to fetch collection:', err);
      setError(getErrorMessage(err, 'コレクションの取得に失敗しました'));
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCollection(true);
    setRefreshing(false);
  }, [fetchCollection]);

  /** エラー後の再試行（ローディング表示あり） */
  const retry = useCallback(() => fetchCollection(), [fetchCollection]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  return { collection, loading, refreshing, error, onRefresh, retry };
}
