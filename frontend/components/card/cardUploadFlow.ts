import { router, useLocalSearchParams } from 'expo-router';

/** 基本情報入力画面（input-basic-info）に渡す params */
export type InputBasicInfoParams = {
  imageUri: string;
};

/** SNSリンク設定画面（input-links）に渡す params */
export type InputLinksParams = InputBasicInfoParams & {
  name: string;
  bio: string;
};

/** 画像選択 → 基本情報入力へ */
export function pushInputBasicInfo(params: InputBasicInfoParams): void {
  router.push({ pathname: '/card-upload-flow/input-basic-info', params });
}

/** 基本情報入力 → SNSリンク設定へ（名前・自己紹介は前後の空白を除いて渡す） */
export function pushInputLinks({ imageUri, name, bio }: InputLinksParams): void {
  router.push({
    pathname: '/card-upload-flow/input-links',
    params: { imageUri, name: name.trim(), bio: bio.trim() },
  });
}

export function useInputBasicInfoParams() {
  return useLocalSearchParams<InputBasicInfoParams>();
}

export function useInputLinksParams() {
  return useLocalSearchParams<InputLinksParams>();
}
