import type { CardLink } from '@/utils/api';

/** 名刺作成フローで追加できるリンクの最大数 */
export const MAX_CARD_LINKS = 4;

/** URL入力中の正規化（http:// を https:// に置き換えるだけで、それ以外はそのまま） */
export function normalizeLinkInput(text: string): string {
  return text.startsWith('http://') ? 'https://' + text.substring(7) : text;
}

/** 前後の空白を除き、スキームがなければ https:// を付ける */
export function withUrlScheme(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return 'https://' + trimmed;
}

/** スキームのあとに実際のURLがあるか（https:// だけ・短すぎるURLは不可） */
export function hasUrlBody(url: string): boolean {
  return url !== 'https://' && url !== 'http://' && url.length > 8;
}

/** タイトルとURLの両方が入っているリンクか */
export function isCompleteLink(link: CardLink): boolean {
  return !!link.title && !!link.url;
}

/** 空のリンク（編集画面の「追加」用） */
export function createEmptyLink(): CardLink {
  return { title: '', url: '' };
}

/** index 番目のリンクを取り除いた新しい配列を返す */
export function removeLinkAt(links: CardLink[], index: number): CardLink[] {
  return links.filter((_, i) => i !== index);
}

/** index 番目のリンクの field を value に変えた新しい配列を返す */
export function updateLinkAt(
  links: CardLink[],
  index: number,
  field: keyof CardLink,
  value: string
): CardLink[] {
  return links.map((link, i) => (i === index ? { ...link, [field]: value } : link));
}
