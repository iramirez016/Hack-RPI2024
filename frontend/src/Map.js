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

// Add pulse animation
const pulseAnimation = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 0 15px rgba(220, 38, 38, 0.5);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 0 20px rgba(220, 38, 38, 0.7);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 0 15px rgba(220, 38, 38, 0.5);
    }
  }
`;

const Map = () => {
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [directions, setDirections] = useState(null);
  const [destination, setDestination] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentStyle, setCurrentStyle] = useState('default');
  const mapRef = useRef(null);
  const savedPosition = useRef(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAwTD3-V30SQKb9tmM7UyVhx_ron9jcH5s",
    libraries: ["places"]
  });

  const getIPLocation = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/location');
      const data = await response.json();
      
      if (data.loc) {
        const [lat, lng] = data.loc.split(',').map(coord => parseFloat(coord));
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
          setCenter(newPos);
          savedPosition.current = newPos;
          
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
      getIPLocation();
    }
  }, [getIPLocation]);

  useEffect(() => {
    getBrowserLocation();
  }, [getBrowserLocation]);

  const onMapLoad = useCallback(map => {
    mapRef.current = map;
  }, []);

  const calculateRoute = useCallback(() => {
    if (!destination) return;
    setIsSearching(true);

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: center,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          setIsSearching(false);
        } else {
          console.error(`error fetching directions ${result}`);
          setIsSearching(false);
        }
      }
    );
  }, [center, destination]);

  const clearRoute = () => {
    setDirections(null);
    setDestination("");
  };

  const toggleMapStyle = () => {
    setCurrentStyle(currentStyle === 'default' ? 'night' : 'default');
  };

  if (!isLoaded) return "Loading Maps";

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <style>{pulseAnimation}</style>

      {/* Search Box */}
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
          top: '25px',
          left: '20px',
          zIndex: 1,
          padding: '12px',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Navigation size={24} />
      </button>

      {/* Style Toggle Button */}
      <button 
        onClick={toggleMapStyle}
        style={{
          position: 'absolute',
          top: '25px',
          right: '20px',
          zIndex: 1,
          padding: '12px',
          backgroundColor: currentStyle === 'night' ? '#1a237e' : '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          fontSize: '20px',
          transition: 'background-color 0.3s ease'
        }}
      >
        {currentStyle === 'night' ? '☀️' : '🌙'}
      </button>

      {/* SOS Button */}
      <button 
        onClick={() => alert('Emergency services are being contacted!')}
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '20px',
          zIndex: 1,
          padding: '20px',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 0 15px rgba(220, 38, 38, 0.5)',
          fontSize: '24px',
          fontWeight: 'bold',
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s infinite'
        }}
      >
        SOS
      </button>

      <GoogleMap
        onLoad={onMapLoad}
        zoom={18}
        center={center}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true,
          fullscreenControl: false,
          styles: mapStyles[currentStyle],
          gestureHandling: 'greedy'
        }}
      >
        <Marker
          position={center}
          title="Your Location"
          animation={window.google.maps.Animation.DROP}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: currentStyle === 'night' ? "#69F0AE" : "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          }}
        />

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: currentStyle === 'night' ? "#69F0AE" : "#4285F4",
                strokeWeight: 5,
                strokeOpacity: 0.8
              }
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default Map;