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

const dangerLight = '#DC2626';
const dangerDark = '#EF4444';

const successLight = '#16A34A';
const successDark = '#22C55E';

const warningLight = '#F59E0B';
const warningDark = '#FBBF24';

const infoLight = '#0EA5E9';
const infoDark = '#38BDF8';

export default {
  light: {
    text: '#0F172A',
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',

    tint: primaryLight,
    logo: primaryLight,

    info: infoLight,
    success: successLight,
    warning: warningLight,
    error: dangerLight,
    danger: dangerLight,

    tabIconDefault: '#94A3B8',
    tabIconSelected: primaryLight,
    border: '#E2E8F0',
    muted: '#64748B',
  },

  dark: {
    text: '#F8FAFC',
    background: '#020617',
    cardBackground: '#0F172A',

    tint: primaryDark,
    logo: primaryDark,

    info: infoDark,
    success: successDark,
    warning: warningDark,
    error: dangerDark,
    danger: dangerDark,

    tabIconDefault: '#64748B',
    tabIconSelected: primaryDark,
    border: '#1E293B',
    muted: '#94A3B8',
  },
};