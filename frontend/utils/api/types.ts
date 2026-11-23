/** API 共通のレスポンス形式 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CardLink {
  title: string;
  url: string;
}

export interface Card {
  id: string;
  card_name: string;
  image_key?: string;
  image_url?: string;
  bio?: string;
  links: CardLink[];
  created_at?: string;
  owner_name?: string;
}

/** カード作成・更新時に送信する内容 */
export interface CardInput {
  card_name: string;
  bio?: string;
  image_key?: string;
  links: CardLink[];
}

export interface UploadImageResult {
  imageKey: string;
  imageUrl: string;
}

export interface QRCodeData {
  qrData: string;
  token: string;
  cardName: string;
  expiresAt: string;
}

export interface QRExchangeResult {
  success: boolean;
  exchangeLogId: string;
  exchangedCards: {
    yourNewCard: Card;
    yourCardSent: Card;
  };
  message: string;
}

/** 公開カード情報（所有者情報付き） */
export type PublicCard = Card & {
  user?: {
    name: string;
    email: string;
  };
};

export interface QRTokenInfo {
  cardId: string;
  cardName: string;
  card: PublicCard;
  ownerName?: string;
  expiresAt: string;
}

export interface QRExchangeLog {
  id: string;
  scannerUser: {
    id: string;
    name: string;
  };
  scannerCard: Card;
  memo?: string;
  created_at: string;
}

export interface QRExchangeLogsResult {
  logs: QRExchangeLog[];
  total: number;
  newLogs: number;
}

/** コレクション（受け取ったカード）の1件 */
export interface CollectionItem {
  id: string;
  card: Card;
  memo?: string;
  location_name?: string;
  created_at: string;
}
