import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export function useKeyboardVisible(enabled = true) {
  const [visible, setVisible] = useState(() => enabled && Keyboard.isVisible());
  useEffect(() => {
    if (!enabled) return;
    const shown = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => { shown.remove(); hidden.remove(); };
  }, [enabled]);
  return enabled && visible;
}
