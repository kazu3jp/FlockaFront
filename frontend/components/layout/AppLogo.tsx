import { Image, View } from 'react-native';

type AppLogoProps = {
  /** 外側の View の className（スタート画面は "items-center mb-20"） */
  className?: string;
};

/** アプリアイコン＋アプリ名のロゴ（index / sign-in / sign-up） */
export function AppLogo({ className = 'items-center' }: AppLogoProps) {
  return (
    <View className={className}>
      <Image
        source={require('../../assets/images/flocka-app-icon.png')}
        className="w-28 h-28"
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/images/flocka-app-name.png')}
        className='w-28 h-28'
        resizeMode='contain'
      />
    </View>
  );
}
