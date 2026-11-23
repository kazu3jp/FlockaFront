import { useMemo } from 'react';
import { Dimensions, FlatList, View, type ListRenderItem } from 'react-native';
import { LoadingView } from '@/components/layout/LoadingView';
import type { Card } from '@/utils/api';
import { AddCardButton } from './AddCardButton';
import { HOME_CARD_SPACING, HOME_CARD_WIDTH } from './cardSize';
import { MyCardItem } from './MyCardItem';

type CarouselItem = { type: 'add' } | { type: 'card'; card: Card };

type MyCardCarouselProps = {
  cards: Card[];
  selectedId: string | null;
  onSelect: (cardId: string) => void;
  isLoading: boolean;
};

const ITEM_WIDTH = HOME_CARD_WIDTH + HOME_CARD_SPACING;

const Separator = () => <View style={{ width: HOME_CARD_SPACING }} />;

/** 横スクロールの名刺一覧（先頭は「新しい名刺を作成」ボタン） */
export function MyCardCarousel({ cards, selectedId, onSelect, isLoading }: MyCardCarouselProps) {
  const items = useMemo<CarouselItem[]>(
    () => [{ type: 'add' }, ...cards.map((card) => ({ type: 'card' as const, card }))],
    [cards]
  );

  if (isLoading) {
    return (
      <LoadingView
        message="名刺を読み込み中..."
        className="flex-1 items-center justify-center h-72"
        textClassName="mt-2"
      />
    );
  }

  // 左右の余白（名刺が画面中央に来るように）
  const screenWidth = Dimensions.get('window').width;
  const sideMargin = (screenWidth - HOME_CARD_WIDTH) / 2;
  // 各名刺が中央に来る位置
  const snapOffsets = items.map((_, index) => index * ITEM_WIDTH);

  const renderItem: ListRenderItem<CarouselItem> = ({ item }) =>
    item.type === 'add' ? (
      <AddCardButton />
    ) : (
      <MyCardItem
        card={item.card}
        onPress={() => onSelect(item.card.id)}
        isSelected={item.card.id === selectedId}
      />
    );

  return (
    <FlatList
      className="max-h-72"
      data={items}
      horizontal
      keyExtractor={(item) => (item.type === 'add' ? 'add' : item.card.id)}
      renderItem={renderItem}
      extraData={selectedId}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingLeft: sideMargin - HOME_CARD_SPACING / 2,
        paddingRight: sideMargin - HOME_CARD_SPACING / 2,
      }}
      ItemSeparatorComponent={Separator}
      snapToOffsets={snapOffsets}
      decelerationRate="fast"
      pagingEnabled={false}
      initialScrollIndex={items.length > 1 ? 1 : 0} // 最初の名刺を中央に表示
      getItemLayout={(_, index) => ({
        length: ITEM_WIDTH,
        offset: ITEM_WIDTH * index,
        index,
      })}
    />
  );
}
