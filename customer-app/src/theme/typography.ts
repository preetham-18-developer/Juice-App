import { Platform, TextStyle } from 'react-native';

export const TYPOGRAPHY = {
  // Luxury Headers using Outfit
  h1: {
    fontFamily: 'Outfit_700Bold',
    fontWeight: '700',
    fontSize: 42,
    lineHeight: 48,
    color: '#1A1A1A',
  } as TextStyle,
  h2: {
    fontFamily: 'Outfit_700Bold',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 38,
    color: '#1A1A1A',
  } as TextStyle,
  h3: {
    fontFamily: 'Outfit_600SemiBold',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 30,
    color: '#1A1A1A',
  } as TextStyle,
  
  // Body & Labels using Poppins
  body: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  } as TextStyle,
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: '#E67E22',
  } as const as TextStyle,
  price: {
    fontFamily: 'Outfit_700Bold',
    fontWeight: '700',
    fontSize: 18,
    color: '#1A1A1A',
  } as TextStyle,
  subtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#6B7280',
  } as TextStyle,
  caption: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#6B7280',
  } as TextStyle,
};
