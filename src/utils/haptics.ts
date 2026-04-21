export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  switch (type) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'medium':
      navigator.vibrate(30);
      break;
    case 'heavy':
      navigator.vibrate(60);
      break;
    case 'success':
      navigator.vibrate([10, 30, 10]);
      break;
    case 'warning':
      navigator.vibrate([30, 50, 30]);
      break;
    case 'error':
      navigator.vibrate([50, 100, 50, 100]);
      break;
  }
};
