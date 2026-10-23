import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import type { Message } from '@aqours/contracts';

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

export function useConversationScroll(feed: RefObject<ScrollView | null>, messages: Message[], ownMessageId: string | null) {
  const following = useRef(true);
  const readerGesture = useRef(false);
  const metrics = useRef({ contentHeight: 0, viewportHeight: 0, offset: 0 });
  const confirmedContent = !ownMessageId || messages.some(item => item.id === ownMessageId);
  const align = useCallback((force: boolean) => {
    const { contentHeight, viewportHeight, offset } = metrics.current;
    if (!following.current || readerGesture.current || !confirmedContent || viewportHeight <= 0) return;
    const target = Math.max(0, contentHeight - viewportHeight);
    if (force || Math.abs(target - offset) > 1) feed.current?.scrollTo({ y: target, animated: false });
  }, [confirmedContent, feed]);
  useEffect(() => {
    if (!ownMessageId) return;
    following.current = true;
    readerGesture.current = false;
    align(false);
  }, [ownMessageId, align]);

  const updateOffset = ({ nativeEvent: event }: ScrollEvent) => {
    const { contentHeight, viewportHeight } = metrics.current;
    // Scroll events can arrive after a newer layout, including a zero-size old viewport.
    // Layout callbacks own dimensions; stale events cannot acknowledge a new scroll target.
    if (viewportHeight <= 0 || event.layoutMeasurement.height <= 0
      || Math.abs(event.contentSize.height - contentHeight) > 1
      || Math.abs(event.layoutMeasurement.height - viewportHeight) > 1) return false;
    metrics.current.offset = event.contentOffset.y;
    return true;
  };
  const updateFollowing = () => {
    const { contentHeight, viewportHeight, offset } = metrics.current;
    following.current = contentHeight - offset - viewportHeight < 80;
  };
  const onScroll = (event: ScrollEvent) => {
    if (!updateOffset(event)) { align(true); return; }
    if (readerGesture.current) updateFollowing();
    else align(false);
  };
  const onScrollEndDrag = (event: ScrollEvent) => {
    const current = updateOffset(event);
    if (readerGesture.current) {
      if (current) updateFollowing();
      readerGesture.current = Math.abs(event.nativeEvent.velocity?.y ?? 0) > 0;
    }
    align(!current);
  };
  const onMomentumScrollEnd = (event: ScrollEvent) => {
    const current = updateOffset(event);
    if (readerGesture.current) { if (current) updateFollowing(); readerGesture.current = false; }
    align(!current);
  };
  // Native size and offset events reconcile the requested position after layout settles.
  // Momentum alone is not evidence of a reader gesture: native animations emit it too.
  return {
    onScroll, onScrollEndDrag, onMomentumScrollEnd,
    onScrollBeginDrag: () => { readerGesture.current = true; following.current = false; },
    onMomentumScrollBegin: () => align(false),
    onViewportLayout: ({ nativeEvent: { layout } }: LayoutChangeEvent) => { metrics.current.viewportHeight = layout.height; align(false); },
    onContentSizeChange: (_width: number, height: number) => { metrics.current.contentHeight = height; align(false); },
    onLastMessageLayout: () => align(false),
  };
}
