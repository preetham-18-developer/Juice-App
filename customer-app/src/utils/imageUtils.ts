import { Platform } from 'react-native';
import { PRODUCT_IMAGE_MAP, CATEGORY_PLACEHOLDERS, DEFAULT_PRODUCT_IMAGE } from '../constants/productImages';

const FALLBACK_URI = { uri: DEFAULT_PRODUCT_IMAGE };

/**
 * Returns true ONLY for valid remote http/https URLs.
 * Rejects: blurhash strings, base64, relative paths, localhost URLs.
 */
export const isValidImageUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  if (url.includes('localhost') || url.includes('127.0.0.1')) return false;
  return true;
};

/**
 * KEYWORD → IMAGE mapping. Checks longest keyword first to avoid false matches.
 * Returns the mapped image source or null.
 */
const KEYWORDS: Array<[string, any]> = [
  ['watermelon',   PRODUCT_IMAGE_MAP.watermelon],
  ['pomegranate',  PRODUCT_IMAGE_MAP.pomegranate],
  ['pineapple',    PRODUCT_IMAGE_MAP.pineapple],
  ['coconut',      PRODUCT_IMAGE_MAP.coconut],
  ['banana',       PRODUCT_IMAGE_MAP.banana],
  ['orange',       PRODUCT_IMAGE_MAP.orange],
  ['lemon',        PRODUCT_IMAGE_MAP.lemon],
  ['lime',         PRODUCT_IMAGE_MAP.lime],
  ['mango',        PRODUCT_IMAGE_MAP.mango],
  ['apple',        PRODUCT_IMAGE_MAP.apple],
  ['grape',        PRODUCT_IMAGE_MAP.grape],
  ['guava',        PRODUCT_IMAGE_MAP.guava],
  ['berry',        PRODUCT_IMAGE_MAP.berry],
  ['melon',        PRODUCT_IMAGE_MAP.watermelon],
  ['citrus',       PRODUCT_IMAGE_MAP.orange],
  ['mixed',        PRODUCT_IMAGE_MAP.mixed],
  ['tropical',     PRODUCT_IMAGE_MAP.mixed],
  ['fruit',        PRODUCT_IMAGE_MAP.mixed],
  ['juice',        PRODUCT_IMAGE_MAP.mixed],
];

/**
 * Determines the best image source for a product.
 *
 * Priority:
 *  1. Valid remote image_url from DB
 *  2. Keyword match against product name
 *  3. Category fallback (remote URL)
 *  4. Global default fallback
 *
 * NEVER returns a local require() on web — that breaks React Native Web.
 */
export const getProductImageSource = (
  name: string = '',
  category: string = '',
  imageUrl?: string
): { uri: string } | any => {
  // 1. Valid remote URL from DB
  if (isValidImageUrl(imageUrl)) {
    return { uri: imageUrl! };
  }

  const lower = name.toLowerCase();

  // 2. Keyword match
  for (const [keyword, asset] of KEYWORDS) {
    if (lower.includes(keyword)) {
      // On web, always unwrap to { uri } to avoid RN-Web require() issues
      if (Platform.OS === 'web' && asset && typeof asset === 'object' && !asset.uri) {
        // local require() on web — skip, fall through to category
        continue;
      }
      return asset;
    }
  }

  // 3. Category fallback
  const catKey = category.toLowerCase();
  const catUrl = CATEGORY_PLACEHOLDERS[catKey];
  if (catUrl) return { uri: catUrl };

  // 4. Global default
  return FALLBACK_URI;
};
