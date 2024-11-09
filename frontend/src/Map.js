// src/Map.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLoadScript, GoogleMap } from '@react-google-maps/api';

const Map = () => {
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const mapRef = useRef(null);
  const savedPosition = useRef(null);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAwTD3-V30SQKb9tmM7UyVhx_ron9jcH5s"
  });

  const getIPLocation = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/location');
      const data = await response.json();
      
      if (data.loc) {
        const [lat, lng] = data.loc.split(',').map(coord => parseFloat(coord));
        console.log('Using IP-based location:', { lat, lng });
        const newPos = { lat, lng };
        setCenter(newPos);
        savedPosition.current = newPos;
      }
    } catch (error) {
      console.error('Error fetching IP location:', error);
    }
  }, []);

  const getBrowserLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log("Got precise location:", newPos);
          setCenter(newPos);
          savedPosition.current = newPos;
          
          // Reset the map view
          if (mapRef.current) {
            mapRef.current.setZoom(18);
            mapRef.current.panTo(newPos);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          getIPLocation();
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.log("Geolocation not available");
      getIPLocation();
    }
  }, [getIPLocation]);

  useEffect(() => {
    getBrowserLocation();
  }, [getBrowserLocation]);

  const onLoad = useCallback(map => {
    mapRef.current = map;
  }, []);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <button 
        onClick={getBrowserLocation}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1,
          padding: '10px 20px',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Reset View
      </button>
      <GoogleMap
        onLoad={onLoad}
        zoom={18}
        center={center}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true,
          fullscreenControl: true
        }}
      />
    </div>
  );
};

export default Map;