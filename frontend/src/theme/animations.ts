export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },
  scale: {
    press: 0.95,
    normal: 1,
  },
  opacity: {
    hidden: 0,
    visible: 1,
    disabled: 0.5,
  },
};
export type Animations = typeof animations;
