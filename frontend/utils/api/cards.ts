import { ensureSuccess, unwrap, type HttpClient } from './client';
import { tokenManager } from './token';
import type { ApiResponse, Card, CardInput, UploadImageResult } from './types';

const UPLOAD_TIMEOUT_MS = 30000;
const CARD_IMAGE_PATH = '/cards/image/';

export function createCardsApi(http: HttpClient) {
  const getCardImageUrl = (imageKey: string): string =>
    `${http.baseUrl}${CARD_IMAGE_PATH}${imageKey}`;

  /** /cards/upload へ multipart で画像を送信する */
  const uploadImageDirect = async (imageUri: string): Promise<UploadImageResult> => {
    const formData = new FormData();
    // React Native の FormData は { uri, type, name } をファイルとして扱う
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `card-${Date.now()}.jpg`,
    } as unknown as Blob);

    const token = await tokenManager.get();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    // Content-Type は boundary 付きで自動設定させるため指定しない
    const uploadResponse = await fetch(`${http.baseUrl}/cards/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const result: ApiResponse<{ fileKey: string }> = await uploadResponse.json();
    if (!uploadResponse.ok || !result.success) {
      throw new Error(result.error || `Upload failed with status ${uploadResponse.status}`);
    }

    const fileKey = result.data!.fileKey;
    return {
      imageKey: fileKey,
      imageUrl: `${CARD_IMAGE_PATH}${fileKey}`,
    };
  };

  return {
    async getMyCards(): Promise<Card[]> {
      const response = await http.request<Card[]>('/cards');
      return unwrap(response, 'Failed to get cards');
    },

    async createCard(cardData: CardInput): Promise<Card> {
      const response = await http.request<Card>('/cards', {
        method: 'POST',
        body: JSON.stringify(cardData),
      });
      return unwrap(response, 'Failed to create card');
    },

    async updateCard(cardId: string, cardData: CardInput): Promise<Card> {
      const response = await http.request<Card>(`/cards/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify(cardData),
      });
      return unwrap(response, 'Failed to update card');
    },

    async deleteCard(cardId: string): Promise<void> {
      const response = await http.request(`/cards/${cardId}`, { method: 'DELETE' });
      ensureSuccess(response, 'Failed to delete card');
    },

    async uploadImage(imageUri: string): Promise<UploadImageResult> {
      try {
        const connected = await http.testConnection();
        if (!connected) {
          throw new Error('APIサーバーに接続できません');
        }
        return await uploadImageDirect(imageUri);
      } catch (error) {
        console.error('Image upload error:', error);

        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('アップロードがタイムアウトしました。ネットワーク接続を確認してください。');
        } else if (error instanceof TypeError && error.message.includes('Network request failed')) {
          throw new Error('ネットワーク接続に問題があります。インターネット接続を確認してください。');
        } else if (error instanceof Error) {
          throw new Error(`画像アップロードエラー: ${error.message}`);
        } else {
          throw new Error('画像のアップロードに失敗しました');
        }
      }
    },

    getCardImageUrl,

    /** 相対パス・絶対URL・画像キーのいずれかから表示用の画像URLを解決する */
    resolveCardImageUrl(imageUrl?: string | null, imageKey?: string | null): string | undefined {
      if (imageUrl?.startsWith(CARD_IMAGE_PATH)) return `${http.baseUrl}${imageUrl}`;
      if (imageUrl && /^https?:\/\//i.test(imageUrl)) return imageUrl;
      return imageKey ? getCardImageUrl(imageKey) : undefined;
    },
  };
}

export type CardsApi = ReturnType<typeof createCardsApi>;
