import { Platform, TextStyle } from 'react-native';

export const TYPOGRAPHY = {
  // Luxury Serif for Headers (Editorial/Fashion Style)
  h1: {
    fontFamily: Platform.select({ ios: 'CormorantGaramond_700Bold', android: 'CormorantGaramond_700Bold', web: 'Cormorant Garamond' }),
    fontSize: 42,
    lineHeight: 48,
    color: '#1A1A1A',
  } as TextStyle,
  h2: {
    fontFamily: Platform.select({ ios: 'CormorantGaramond_600SemiBold', android: 'CormorantGaramond_600SemiBold', web: 'Cormorant Garamond' }),
    fontSize: 32,
    lineHeight: 38,
    color: '#1A1A1A',
  } as TextStyle,
  h3: {
    fontFamily: Platform.select({ ios: 'CormorantGaramond_500Medium', android: 'CormorantGaramond_500Medium', web: 'Cormorant Garamond' }),
    fontSize: 24,
    lineHeight: 30,
    color: '#1A1A1A',
  } as TextStyle,
  
  // Clean Sans-Serif for Body & Labels (Modern Premium)
  body: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  } as TextStyle,
  label: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: '#E67E22',
  } as const as TextStyle,
  price: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#1A1A1A',
  } as TextStyle,
  subtext: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#6B7280',
  } as TextStyle,
  caption: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#6B7280',
  } as TextStyle,
};
