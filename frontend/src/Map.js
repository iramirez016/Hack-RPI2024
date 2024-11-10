// src/Map.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLoadScript, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { SearchIcon, Navigation } from 'lucide-react';

// Define map styles
const mapStyles = {
  default: [],
  night: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }]
    }
  ]
};

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
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Your existing search box */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1,
        width: '90%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Enter destination..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button
            onClick={calculateRoute}
            disabled={!destination || isSearching}
            style={{
              padding: '12px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px'
            }}
          >
            <SearchIcon size={20} />
          </button>
        </div>
        {directions && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                Distance: {directions.routes[0].legs[0].distance.text}
              </div>
              <div style={{ color: '#64748b' }}>
                Duration: {directions.routes[0].legs[0].duration.text}
              </div>
            </div>
            <button
              onClick={clearRoute}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Location Reset Button */}
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