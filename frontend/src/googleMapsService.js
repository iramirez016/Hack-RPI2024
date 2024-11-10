// googleMapsService.js
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAwTD3-V30SQKb9tmM7UyVhx_ron9jcH5s';

export const getTimeZoneData = async (lat, lng, timestamp) => {
  const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${GOOGLE_MAPS_API_KEY}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching timezone data:", error);
    throw error;
  }
};

export const getCurrentTime = (timeZoneId, rawOffset, dstOffset) => {
  const now = new Date();
  const localTime = new Date(now.getTime() + rawOffset * 1000 + dstOffset * 1000);
  return localTime;
};
