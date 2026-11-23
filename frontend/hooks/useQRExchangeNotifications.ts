import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, type QRExchangeLog } from '../utils/api';

const CHECK_INTERVAL_MS = 10000;

export const useQRExchangeNotifications = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [newExchangeLog, setNewExchangeLog] = useState<QRExchangeLog | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  // ポーリング制御用の値は再レンダリング不要なので ref で持つ（コールバックを安定させる）
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);

  // 定期実行からはこちらを直接呼ぶ（タイマーのずれで間引きに引っかからないように）
  const runCheck = useCallback(async () => {
    if (isCheckingRef.current) return;

    try {
      isCheckingRef.current = true;
      setIsChecking(true);
      lastCheckTimeRef.current = Date.now();
      const data = await apiClient.getQRExchangeLogs();

      if (data.newLogs > 0 && data.logs.length > 0) {
        setNewExchangeLog(data.logs[0]); // 最新のログ
        setShowPreview(true);
      }
    } catch {
      // QR交換ログは必須機能ではないため、エラーは無視する
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, []);

  // 画面側から呼ばれるチェック。前回から10秒未満ならスキップする
  const checkForNewExchanges = useCallback(async () => {
    if (Date.now() - lastCheckTimeRef.current < CHECK_INTERVAL_MS) return;
    await runCheck();
  }, [runCheck]);

  useEffect(() => {
    const interval = setInterval(runCheck, CHECK_INTERVAL_MS);
    runCheck();
    return () => clearInterval(interval);
  }, [runCheck]);

  const closePreview = useCallback(() => {
    setShowPreview(false);
    setNewExchangeLog(null);
  }, []);

  return {
    checkForNewExchanges,
    isChecking,
    newExchangeLog,
    showPreview,
    closePreview,
  };
};
