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
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        monitor.log('WARN', 'Location', 'Location services disabled at system level');
        return false;
      }

      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      if (existingStatus === 'granted') {
        return true;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      monitor.log('ERROR', 'Location', 'Permission workflow failed', { err });
      return false; 
    }
  },

  async getCurrentCoords(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Platform.OS === 'android' ? Location.Accuracy.Low : Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Location fetch timeout')), 10000)
      );

      const location = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;

      if (location?.coords?.latitude && location?.coords?.longitude) {
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }
      throw new Error("Invalid coordinates received");
    } catch (err: any) {
      monitor.log('ERROR', 'Location', 'GPS fetch failed, attempting fallback', { error: err?.message });
      try {
        const lastLocation = await Location.getLastKnownPositionAsync();
        if (lastLocation?.coords?.latitude && lastLocation?.coords?.longitude) {
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
    const baseAddress: StructuredAddress = {
      formattedAddress: '', street: '', houseNumber: '', area: '', 
      city: '', state: '', country: '', postalCode: '', landmark: '', latitude, longitude
    };

    // 1. Google Maps (Primary & Most Reliable)
    if (GOOGLE_MAPS_API_KEY) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
        const { data } = await axios.get(url, { timeout: 8000 });
        if (data.status === 'OK' && data.results.length > 0) {
          const result = data.results[0];
          const c = result.address_components;
          const getComp = (types: string[]) => c.find((comp: any) => types.some(t => comp.types.includes(t)))?.long_name || '';
          
          const city = getComp(['locality', 'administrative_area_level_2']);
          const state = getComp(['administrative_area_level_1']);
          
          if (city && state) {
            return {
              ...baseAddress,
              formattedAddress: result.formatted_address,
              houseNumber: getComp(['street_number']),
              street: getComp(['route']),
              area: getComp(['sublocality', 'sublocality_level_1', 'neighborhood']),
              city,
              state,
              postalCode: getComp(['postal_code']),
              country: getComp(['country']),
            };
          }
        }
      } catch (err) {
        monitor.log('WARN', 'Location', 'Google Geocode failed', { err });
      }
    }

    // 2. Nominatim OpenStreetMap (Secondary Reliable)
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'JuicyApp/1.0' }, timeout: 8000 });
      if (data?.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.county || '';
        const state = addr.state || '';
        
        if (city && state) {
          const street = addr.road || addr.suburb || '';
          const area = addr.neighbourhood || addr.suburb || addr.district || '';
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
      }
    } catch (err) {
      monitor.log('WARN', 'Location', 'Nominatim fallback failed', { err });
    }

    // 3. Native Expo Fallback (SDK 49 Compatible, try/catch wrapped)
    if (Platform.OS !== 'web') {
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results && results.length > 0) {
          const r = results[0];
          const city = r.city || r.subregion || '';
          const state = r.region || '';
          
          if (city && state) {
            const street = r.street || r.name || '';
            const area = r.district || r.subregion || '';
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
        }
      } catch (err) {
        monitor.log('ERROR', 'Location', 'Native geocode failed', { err });
      }
    }

    return null; // Force null so callers know address resolution completely failed
  }
};
