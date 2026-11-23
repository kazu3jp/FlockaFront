import type { ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback } from 'react-native';

type KeyboardDismissScrollViewProps = {
  children: ReactNode;
  /** ScrollView の className（名刺作成フロー: "flex-1 bg-gray-50" / edit-card: "flex-1"） */
  scrollClassName?: string;
};

/**
 * キーボードを避け、背景タップでキーボードを閉じるスクロール画面。
 * KeyboardAvoidingView + TouchableWithoutFeedback + ScrollView の組み合わせ。
 */
export function KeyboardDismissScrollView({
  children,
  scrollClassName = 'flex-1 bg-gray-50',
}: KeyboardDismissScrollViewProps) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      enabled={true}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          className={scrollClassName}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Platform.OS === 'ios' ? 20 : 0
          }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : undefined}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios' ? true : false}
        >
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
