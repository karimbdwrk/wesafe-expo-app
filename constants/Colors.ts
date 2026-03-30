// const tintColorLight = '#303030';
// const tintColorDark = '#fff';
// const tintColorDanger = '#b91c1c';


// export default {
//   light: {
//     text: '#000',
//     background: '#fff',
//     tint: tintColorLight,
//     tabIconDefault: '#ccc',
//     tabIconSelected: tintColorLight,
//     danger: tintColorDanger
//   },
//   dark: {
//     text: '#fff',
//     background: '#000',
//     tint: tintColorDark,
//     tabIconDefault: '#ccc',
//     tabIconSelected: tintColorDark,
//   },
// };

const primaryLight = '#2563EB';
const primaryDark = '#60A5FA';

const successLight = '#16A34A';
const successDark = '#22C55E';

const warningLight = '#F59E0B';
const warningDark = '#FBBF24';

const errorLight = '#DC2626';
const errorDark = '#EF4444';

const infoLight = '#0EA5E9';
const infoDark = '#38BDF8';

export default {
  light: {
    text: '#111111',
    textSecondary: '#525252',

    background: '#FAFAFA',
    cardBackground: '#FFFFFF',
    elevated: '#F5F5F5',

    tint: primaryLight,
    logo: primaryLight,

    info: infoLight,
    success: successLight,
    warning: warningLight,
    error: errorLight,
    danger: errorLight,

    border: '#E5E5E5',
    muted: '#737373',

    tabIconDefault: '#A3A3A3',
    tabIconSelected: primaryLight,
  },

  dark: {
    text: '#FAFAFA',
    textSecondary: '#A3A3A3',

    background: '#101010',
    cardBackground: '#171717',
    elevated: '#1F1F1F',

    tint: primaryDark,
    logo: primaryDark,

    info: infoDark,
    success: successDark,
    warning: warningDark,
    error: errorDark,
    danger: errorDark,

    border: '#2A2A2A',
    muted: '#737373',

    tabIconDefault: '#737373',
    tabIconSelected: primaryDark,
  },
};