import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
  gridGap: 16,
  borderRadius: {
    card: 24,
    button: 16,
    input: 12,
  },
};