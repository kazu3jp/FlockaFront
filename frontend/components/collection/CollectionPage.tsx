import { FlatList, View } from 'react-native';
import type { CollectionItem } from '@/utils/api';
import { CollectionGridItem, CollectionGridPlaceholder } from './CollectionGridItem';

type CollectionPageProps = {
  items: CollectionItem[];
  pageIndex: number;
  pageSize: number;
  pageWidth: number;
  itemWidth: number;
  imageHeight: number;
};

/** 横スクロールページャーの1ページ（2列のグリッド。足りない分は空き枠で埋める） */
export function CollectionPage({ items, pageIndex, pageSize, pageWidth, itemWidth, imageHeight }: CollectionPageProps) {
  const cells: (CollectionItem | null)[] = [...items];
  while (cells.length < pageSize) {
    cells.push(null);
  }

  return (
    <View className="py-16" style={{ width: pageWidth, flex: 1 }}>
      <FlatList
        data={cells}
        keyExtractor={(item, index) => (item ? item.id : `placeholder-${pageIndex}-${index}`)}
        numColumns={2}
        scrollEnabled={false} // ページ内はスクロールさせない
        contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center', justifyContent: 'flex-start', flexGrow: 1 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) =>
          item ? (
            <CollectionGridItem item={item} width={itemWidth} imageHeight={imageHeight} />
          ) : (
            <CollectionGridPlaceholder width={itemWidth} imageHeight={imageHeight} />
          )
        }
      />
    </View>
  );
}
