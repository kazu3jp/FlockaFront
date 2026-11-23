import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { APP_BACKGROUND_COLOR } from '../../constants/ui';

type AuthCardLayoutProps = {
  title: string;
  /** タイトル下の灰色テキスト */
  subtitle: ReactNode;
  /** 灰色テキストの下余白（sign-up-auth: 20 / forgot・reset: 12） */
  subtitleMarginBottom?: number;
  children: ReactNode;
};

/** 背景の中央に白いカードを置く画面の枠（sign-up-auth / forgot-password / reset-password） */
export function AuthCardLayout({ title, subtitle, subtitleMarginBottom = 12, children }: AuthCardLayoutProps) {
  return (
    <View style={{ flex: 1, backgroundColor: APP_BACKGROUND_COLOR, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <View style={{ width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>{title}</Text>
        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: subtitleMarginBottom, textAlign: 'center' }}>{subtitle}</Text>
        {children}
      </View>
    </View>
  );
}
