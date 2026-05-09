import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { getProductImageSource } from '../../utils/imageUtils';
import Animated, { FadeIn } from 'react-native-reanimated';

interface ProductImageProps {
  name: string;
  category: string;
  imageUrl?: string;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

// Blurhash only works on native — on web it gets treated as a URL → 500 error
const BLURHASH = Platform.OS !== 'web'
  ? '|rF?hV%2WCj[ayj[a|j[az_Nae-WIUj[azayj[ayfQfQM{M{azayayayCTj[ayjhj[ayj[fQayGWj[ayf7azj[ayfQATj[ayjhj[ayj[ayfQgwgwayjpazayj[ay_7ayayj[ayj[ayayayayo fQayayayj[ayj[ayayayayj[ayj[ayayayayj[ayj[ayayay'
  : undefined;

export const ProductImage: React.FC<ProductImageProps> = ({ 
  name, 
  category, 
  imageUrl, 
  style,
  contentFit = 'cover'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const source = getProductImageSource(name, category, imageUrl);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        placeholder={BLURHASH}
        contentFit={contentFit}
        transition={500}
        style={StyleSheet.absoluteFill}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        cachePolicy="memory-disk"
      />
      
      {isLoading && (
        <Animated.View 
          entering={FadeIn}
          style={[StyleSheet.absoluteFill, styles.loaderContainer]}
        >
          <ActivityIndicator color="#3A8C3F" size="small" />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.5)',
  }
});
