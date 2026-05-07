import * as Location from 'expo-location';
import axios from 'axios';
import { monitor } from './MonitoringService';
import { Platform } from 'react-native';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface StructuredAddress {
  formattedAddress: string;
  street: string;
  houseNumber: string;
  area: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  landmark: string;
  latitude: number;
  longitude: number;
}

export const LocationService = {
  async requestPermissions(): Promise<boolean> {
    try {
      // Step 1: Check if services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        monitor.log('WARN', 'Location', 'Location services disabled at system level');
        return false;
      }

      // Step 2: Request foreground permissions safely
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return true;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      monitor.log('ERROR', 'Location', 'Permission workflow failed', { err });
      return false; // Fail gracefully, don't crash
    }
  },

  async getCurrentCoords(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // Use LastKnown as an instant fallback mechanism
      let lastKnown = null;
      try {
        lastKnown = await Location.getLastKnownPositionAsync();
      } catch (e) {
        // Ignore native exceptions here
      }

      // Step 4: Fetch with High Accuracy but wrap with safe timeout (8 seconds)
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Platform.OS === 'android' ? Location.Accuracy.Low : Location.Accuracy.Balanced, 
        // Accuracy.Low on Android prevents GPS hardware locks that cause ANRs
      });

      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Location fetch timeout')), 8000)
      );

      const location = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;

      if (location && location.coords) {
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }

      throw new Error("Invalid coordinates received");
    } catch (err: any) {
      monitor.log('ERROR', 'Location', 'GPS fetch failed, attempting fallback', { error: err?.message });
      
      // Fallback to LastKnownPosition if high-accuracy fails
      try {
        const lastLocation = await Location.getLastKnownPositionAsync();
        if (lastLocation?.coords) {
          return {
            latitude: lastLocation.coords.latitude,
            longitude: lastLocation.coords.longitude,
          };
        }
      } catch (fallbackErr) {
        monitor.log('ERROR', 'Location', 'Fallback GPS fetch also failed', { error: fallbackErr });
      }
      
      return null;
    }
  },

  async reverseGeocode(latitude: number, longitude: number): Promise<StructuredAddress | null> {
    const baseAddress = {
      formattedAddress: '', street: '', houseNumber: '', area: '', 
      city: '', state: '', country: '', postalCode: '', landmark: '', latitude, longitude
    };

    // 1. Google Maps (If Key exists)
    if (GOOGLE_MAPS_API_KEY) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
        const { data } = await axios.get(url, { timeout: 5000 });
        if (data.status === 'OK' && data.results.length > 0) {
          const result = data.results[0];
          const c = result.address_components;
          const getComp = (types: string[]) => c.find((comp: any) => types.some(t => comp.types.includes(t)))?.long_name || '';
          
          return {
            ...baseAddress,
            formattedAddress: result.formatted_address,
            houseNumber: getComp(['street_number']),
            street: getComp(['route']),
            area: getComp(['sublocality', 'sublocality_level_1', 'neighborhood']),
            city: getComp(['locality', 'administrative_area_level_2']),
            state: getComp(['administrative_area_level_1']),
            postalCode: getComp(['postal_code']),
            country: getComp(['country']),
          };
        }
      } catch (err) {
        monitor.log('WARN', 'Location', 'Google Geocode failed', { err });
      }
    }

    // 2. Native Expo Reverse Geocoding (Fastest, usually accurate enough)
    if (Platform.OS !== 'web') {
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results && results.length > 0) {
          const r = results[0];
          const street = r.street || r.name || '';
          const area = r.district || r.subregion || '';
          const city = r.city || r.subregion || '';
          const state = r.region || '';
          const postalCode = r.postalCode || '';
          
          const formattedParts = [street, area, city, state, postalCode].filter(Boolean);
          
          return {
            ...baseAddress,
            formattedAddress: formattedParts.join(', '),
            street,
            area,
            city,
            state,
            postalCode,
            country: r.country || '',
          };
        }
      } catch (err) {
        monitor.log('ERROR', 'Location', 'Native fallback geocode failed', { err });
      }
    }

    // 3. Nominatim OpenStreetMap Fallback (HTTP-based, crash-proof)
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'JuicyApp/1.0' }, timeout: 5000 });
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.suburb || '';
        const area = addr.neighbourhood || addr.suburb || addr.district || '';
        const city = addr.city || addr.town || addr.village || '';
        const state = addr.state || '';
        const postalCode = addr.postcode || '';
        
        const formattedParts = [street, area, city, state, postalCode].filter(Boolean);
        
        return {
          ...baseAddress,
          formattedAddress: data.display_name || formattedParts.join(', '),
          street,
          houseNumber: addr.house_number || '',
          area,
          city,
          state,
          country: addr.country || '',
          postalCode,
        };
      }
    } catch (err) {
      monitor.log('WARN', 'Location', 'Nominatim fallback failed', { err });
    }

    // Return pure coordinates if all geocoding fails
    return { ...baseAddress, formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
  }
};
