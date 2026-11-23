import { useMemo, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { CollectionPage } from '@/components/collection/CollectionPage';
import { CollectionEmptyView, CollectionErrorView } from '@/components/collection/CollectionStates';
import { PageDots } from '@/components/collection/PageDots';
import { LoadingView } from '@/components/layout/LoadingView';
import { CARD_ASPECT_RATIO } from '@/constants/card';
import { APP_BACKGROUND_COLOR, REFRESH_CONTROL_COLORS } from '@/constants/ui';
import { useCollection } from '@/hooks/useCollection';

const { width: screenWidth } = Dimensions.get('window');

// 2列 x 4行 = 8アイテム/ページ
const PAGE_SIZE = 8;

// アイテム幅を画面サイズに基づいて計算（余白考慮）
const ITEM_MARGIN = 12;
const ITEM_WIDTH = Math.floor(screenWidth / 2) - ITEM_MARGIN - 8;
// 名刺の標準比率 (91mm x 55mm) に合わせた画像高さ
const CARD_IMAGE_HEIGHT = Math.round(ITEM_WIDTH / CARD_ASPECT_RATIO);

// ページごとに分割
const paginate = <T,>(data: T[], pageSize: number): T[][] => {
  const pages: T[][] = [];
  for (let i = 0; i < data.length; i += pageSize) {
    pages.push(data.slice(i, i + pageSize));
  }
  return pages;
};

export default function Collection() {
  const { collection, loading, refreshing, error, onRefresh, retry } = useCollection();
  const [currentPage, setCurrentPage] = useState(0);

  const pages = useMemo(() => paginate(collection, PAGE_SIZE), [collection]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setCurrentPage(Math.round(offsetX / screenWidth));
  };

  if (loading) {
    return (
      <LoadingView message="コレクションを読み込み中..." color="#3B82F6" textClassName="mt-4 text-gray-600" />
    );
  }

  if (error) {
    return <CollectionErrorView message={error} onRetry={retry} />;
  }

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} {...REFRESH_CONTROL_COLORS} />
  );

  if (collection.length === 0) {
    return <CollectionEmptyView refreshControl={refreshControl} />;
  }

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      {/* 横スクロールページャー */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        refreshControl={refreshControl}
      >
        {pages.map((page, pageIndex) => (
          <CollectionPage
            key={pageIndex}
            items={page}
            pageIndex={pageIndex}
            pageSize={PAGE_SIZE}
            pageWidth={screenWidth}
            itemWidth={ITEM_WIDTH}
            imageHeight={CARD_IMAGE_HEIGHT}
          />
        ))}
      </ScrollView>

      <PageDots count={pages.length} current={currentPage} />
    </View>
  );
}
