/** ホームの名刺カルーセルに表示する名刺の幅 */
export const HOME_CARD_WIDTH = 320;
/**
 * 名刺の高さ（幅 / 1.65）。
 * constants/card の CARD_ASPECT_RATIO（91/55）とは値が少し違うため、見た目を保つために別定義している。
 */
export const HOME_CARD_HEIGHT = Math.round(HOME_CARD_WIDTH / 1.65);
/** 名刺同士の間隔 */
export const HOME_CARD_SPACING = 12;
