import React from 'react';
import { Svg, Path, Rect, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';

interface LogoTitleProps {
  colorScheme?: 'light' | 'dark';
  size?: number;
}

const LogoTitle = ({ colorScheme = 'light', size = 32 }: LogoTitleProps) => {
  const startColor = colorScheme === 'dark' ? '#d1d5db' : '#303030';
  const endColor   = colorScheme === 'dark' ? '#6b7280' : '#101010';
  return (
    <Svg viewBox="0 0 374.24 432.13" width={size} height={size}>
      <Defs>
        <LinearGradient id="logoGrad" x1="0" y1="432.13" x2="374.24" y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={startColor} />
          <Stop offset="1" stopColor={endColor} />
        </LinearGradient>
      </Defs>
      <Polygon fill="url(#logoGrad)" points="91.15 55.41 91.15 376.72 0 324.1 0 108.03 91.15 55.41" />
      <Polygon fill="url(#logoGrad)" points="187.12 0 142.75 25.62 142.75 406.51 187.12 432.13 232.33 406.03 283.67 376.39 374.24 324.1 374.24 108.03 283.67 55.74 283.67 272.04 232.33 301.68 232.33 26.1 187.12 0" />
    </Svg>
  );
};

export default LogoTitle;