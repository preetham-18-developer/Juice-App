/**
 * Global Store Configuration
 * Defines the physical location of the primary shop/warehouse.
 * Used for distance calculations and delivery fee mapping.
 */
export const STORE_CONFIG = {
  name: 'Juicy App Main Hub',
  // Sample Coordinates (Central Point)
  // Replace these with your actual shop coordinates
  latitude: 19.0760, // Example: Mumbai
  longitude: 72.8777,
  
  // Logistics Defaults
  DEFAULT_MAX_RADIUS_KM: 15,
  BASE_ESTIMATED_DELIVERY_MINS: 30,
};
