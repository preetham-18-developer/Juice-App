/**
 * Product Image Constants
 *
 * RULE: Metro bundler requires ALL require() calls to be STATIC (no dynamic paths).
 * A require() inside a ternary is still evaluated at bundle time on ALL platforms.
 * Therefore: use remote Unsplash URLs for everything — safe on both web and native.
 * Local require() assets are only added here if they are STATIC and the format is
 * universally supported (no .avif — not supported on all browsers/devices).
 */

export const PRODUCT_IMAGE_MAP: Record<string, any> = {
  apple:       { uri: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80' },
  orange:      { uri: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800&q=80' },
  watermelon:  { uri: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=800&q=80' },
  banana:      { uri: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&q=80' },
  mixed:       { uri: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80' },
  berry:       { uri: 'https://images.unsplash.com/photo-1596333522248-101637328ff7?w=800&q=80' },
  pineapple:   { uri: 'https://images.unsplash.com/photo-1585250001066-0425e2700a7b?w=800&q=80' },
  mango:       { uri: 'https://images.unsplash.com/photo-1605027990121-cbae9e0642df?w=800&q=80' },
  lemon:       { uri: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=800&q=80' },
  lime:        { uri: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=800&q=80' },
  grape:       { uri: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&q=80' },
  guava:       { uri: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=800&q=80' },
  coconut:     { uri: 'https://images.unsplash.com/photo-1559181567-c3190b55fb96?w=800&q=80' },
  pomegranate: { uri: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=800&q=80' },
};

export const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  juice:     'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80',
  fruit:     'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&q=80',
  organic:   'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
  vegetable: 'https://images.unsplash.com/photo-1566385270613-5f056a4e5074?w=800&q=80',
};

export const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80';
