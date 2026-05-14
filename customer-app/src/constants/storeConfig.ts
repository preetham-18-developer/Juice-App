/**
 * Global Store Configuration
 * Defines the physical location of the primary shop/warehouse.
 * Used for distance calculations and delivery fee mapping.
 */
export const STORE_CONFIG = {
  name: 'Juicy App Main Hub',
  // Nellore Allipuram Shop Coordinates
  latitude: 14.4426,
  longitude: 79.9865,
  
  // Logistics Defaults
  DEFAULT_MAX_RADIUS_KM: 5,
  BASE_ESTIMATED_DELIVERY_MINS: 30,
};
