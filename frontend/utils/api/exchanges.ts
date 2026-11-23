import { ensureSuccess, isNotFoundError, unwrap, type HttpClient } from './client';
import type {
  Card,
  CollectionItem,
  PublicCard,
  QRCodeData,
  QRExchangeLogsResult,
  QRExchangeResult,
  QRTokenInfo,
} from './types';

/** QR トークン情報の擬似的な有効期限（取得時点から30分） */
const QR_TOKEN_INFO_TTL_MS = 30 * 60 * 1000;

const emptyQRExchangeLogs = (): QRExchangeLogsResult => ({ logs: [], total: 0, newLogs: 0 });

interface CollectionsResponse {
  collections: {
    id: string;
    card: Card;
    memo?: string;
    location: string | null;
    collected_at: string;
  }[];
  total: number;
}

function parseCardIdFromQRData(qrData: string): string {
  try {
    const qrObj = JSON.parse(qrData);
    if (qrObj.cardId) {
      return qrObj.cardId;
    }
  } catch {
    // 下で共通のエラーを投げる
  }
  throw new Error('Invalid QR data format');
}

export function createExchangesApi(http: HttpClient) {
  return {
    async generateQRCode(cardId: string, expiresIn: number = 3600): Promise<QRCodeData> {
      const response = await http.request<QRCodeData>('/exchanges/qr/generate', {
        method: 'POST',
        body: JSON.stringify({ cardId, expiresIn }),
      });
      return unwrap(response, 'Failed to generate QR code');
    },

    async exchangeWithQRCode(
      qrData: string,
      myCardId: string,
      memo?: string,
      locationName?: string,
      latitude?: number,
      longitude?: number
    ): Promise<QRExchangeResult> {
      const response = await http.request<Omit<QRExchangeResult, 'success'>>('/exchanges/qr', {
        method: 'POST',
        body: JSON.stringify({
          qrData,
          myCardId,
          memo,
          location_name: locationName,
          latitude,
          longitude,
        }),
      });
      const data = unwrap(response, 'Failed to exchange cards');
      return {
        success: true,
        exchangeLogId: data.exchangeLogId,
        exchangedCards: data.exchangedCards,
        message: data.message || 'QR交換が完了しました',
      };
    },

    /** QRデータ(JSON)の cardId から公開カード情報を取得する */
    async getQRTokenInfo(qrData: string): Promise<QRTokenInfo> {
      const cardId = parseCardIdFromQRData(qrData);
      const response = await http.request<PublicCard>(`/cards/public/${cardId}`);
      const card = unwrap(response, 'Failed to get QR token info');
      return {
        cardId: card.id,
        cardName: card.card_name,
        card,
        ownerName: card.user?.name,
        expiresAt: new Date(Date.now() + QR_TOKEN_INFO_TTL_MS).toISOString(),
      };
    },

    /** 自分のカードが読み取られたログ（通知用）。失敗時は空データを返す */
    async getQRExchangeLogs(): Promise<QRExchangeLogsResult> {
      try {
        const response = await http.request<QRExchangeLogsResult>('/exchanges/qr-logs');
        if (response.success && response.data) {
          return response.data;
        }
        return emptyQRExchangeLogs();
      } catch (error) {
        console.warn('QR exchange logs request failed, returning empty data:', error);
        return emptyQRExchangeLogs();
      }
    },

    async getCollection(): Promise<CollectionItem[]> {
      const response = await http.request<CollectionsResponse>('/exchanges');
      if (response.success && response.data) {
        return response.data.collections.map((item) => ({
          id: item.id,
          card: item.card,
          memo: item.memo,
          location_name: item.location || undefined,
          created_at: item.collected_at,
        }));
      }
      if (isNotFoundError(response.error)) {
        return [];
      }
      throw new Error(response.error || 'Failed to get collection');
    },

    /** 注意: このエンドポイントは現在404を返すため画面からは使用していない */
    async getExchangeDetail(exchangeId: string): Promise<CollectionItem> {
      const response = await http.request<CollectionItem>(`/exchanges/${exchangeId}`);
      if (response.success && response.data) {
        return response.data;
      }
      if (isNotFoundError(response.error)) {
        throw new Error('Exchange record not found');
      }
      throw new Error(response.error || 'Failed to get exchange detail');
    },

    async updateExchangeMemo(exchangeId: string, memo: string): Promise<void> {
      const response = await http.request(`/exchanges/${exchangeId}`, {
        method: 'PUT',
        body: JSON.stringify({ memo: memo ?? '' }),
      });
      ensureSuccess(response, 'Failed to update memo');
    },

    /** 交換記録を削除する。既に存在しない場合は成功扱い */
    async deleteExchange(exchangeId: string): Promise<void> {
      const response = await http.request(`/exchanges/${exchangeId}`, { method: 'DELETE' });
      if (!response.success && !isNotFoundError(response.error)) {
        throw new Error(response.error || 'Failed to delete exchange');
      }
    },

    async deleteCollection(cardId: string): Promise<void> {
      const response = await http.request(`/exchanges/${cardId}`, { method: 'DELETE' });
      ensureSuccess(response, 'Failed to delete collection');
    },
  };
}

export type ExchangesApi = ReturnType<typeof createExchangesApi>;
