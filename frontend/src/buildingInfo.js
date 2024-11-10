import React, { useEffect, useState } from 'react';
import { getTimeZoneData, getCurrentTime } from './googleMapsService';

const BuildingInfo = ({ lat, lng }) => {
  const [localTime, setLocalTime] = useState(null);

  useEffect(() => {
    const fetchTimeZoneData = async () => {
      try {
        const timestamp = Math.floor(Date.now() / 1000); // Current time in seconds
        const timeZoneData = await getTimeZoneData(lat, lng, timestamp);
        const { timeZoneId, rawOffset, dstOffset } = timeZoneData;

        // Calculate the local time for the building
        const time = getCurrentTime(timeZoneId, rawOffset, dstOffset);
        setLocalTime(time.toLocaleTimeString());
      } catch (error) {
        console.error("Failed to fetch time zone data", error);
      }
    };

    fetchTimeZoneData();
  }, [lat, lng]);

  return (
    <div>
      <h2>Building Information</h2>
      {localTime ? <p>Local Time: {localTime}</p> : <p>Loading local time...</p>}
    </div>
  );
};

export default BuildingInfo;