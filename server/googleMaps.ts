import * as db from "./db";

interface DistanceMatrixResponse {
  rows: Array<{
    elements: Array<{
      status: string;
      duration?: {
        value: number; // in seconds
        text: string;
      };
      distance?: {
        value: number; // in meters
        text: string;
      };
    }>;
  }>;
  status: string;
}

/**
 * Calculate travel time between two addresses using Google Maps Distance Matrix API
 * @param origin Starting address
 * @param destination Destination address
 * @returns Travel time in minutes, or null if calculation fails
 */
export async function calculateTravelTime(
  origin: string,
  destination: string
): Promise<number | null> {
  try {
    // Get Google Maps API key from database
    const apiKeyConfig = await db.getApiConfig('google_maps_api_key');
    
    if (!apiKeyConfig || !apiKeyConfig.configValue) {
      console.warn('[GoogleMaps] API key not configured');
      return null;
    }

    const apiKey = apiKeyConfig.configValue;

    // Build API URL
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.append('origins', origin);
    url.searchParams.append('destinations', destination);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('mode', 'driving');
    url.searchParams.append('language', 'it');

    // Make API request
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error('[GoogleMaps] API request failed:', response.statusText);
      return null;
    }

    const data: DistanceMatrixResponse = await response.json();

    // Check response status
    if (data.status !== 'OK') {
      console.error('[GoogleMaps] API returned error status:', data.status);
      return null;
    }

    // Extract travel time
    const element = data.rows[0]?.elements[0];
    
    if (!element || element.status !== 'OK' || !element.duration) {
      console.error('[GoogleMaps] No valid route found');
      return null;
    }

    // Convert seconds to minutes and round up
    const travelTimeMinutes = Math.ceil(element.duration.value / 60);
    
    return travelTimeMinutes;
  } catch (error) {
    console.error('[GoogleMaps] Error calculating travel time:', error);
    return null;
  }
}

/**
 * Calculate travel time for an installation based on partner's starting address
 * @param partnerId Partner ID
 * @param installationAddress Installation address
 * @returns Travel time in minutes, or null if calculation fails
 */
export async function calculateTravelTimeForPartner(
  partnerId: number,
  installationAddress: string
): Promise<number | null> {
  try {
    const partner = await db.getPartnerById(partnerId);
    
    if (!partner || !partner.startingAddress) {
      console.warn('[GoogleMaps] Partner not found or starting address not set');
      return null;
    }

    return await calculateTravelTime(partner.startingAddress, installationAddress);
  } catch (error) {
    console.error('[GoogleMaps] Error calculating travel time for partner:', error);
    return null;
  }
}

