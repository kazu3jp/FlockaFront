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

  const checkForNewExchanges = useCallback(async () => {
    if (isCheckingRef.current) return;

    // 前回チェックから10秒未満の場合はスキップ
    const now = Date.now();
    if (now - lastCheckTimeRef.current < CHECK_INTERVAL_MS) return;

    try {
      isCheckingRef.current = true;
      setIsChecking(true);
      lastCheckTimeRef.current = now;
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

  useEffect(() => {
    const interval = setInterval(checkForNewExchanges, CHECK_INTERVAL_MS);
    checkForNewExchanges();
    return () => clearInterval(interval);
  }, [checkForNewExchanges]);

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
