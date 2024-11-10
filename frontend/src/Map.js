import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLoadScript, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { SearchIcon, Navigation, Home } from 'lucide-react';

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

const animations = `
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

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Map = () => {
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [directions, setDirections] = useState(null);
  const [destination, setDestination] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentStyle, setCurrentStyle] = useState('default');
  const [showSafeSpaces, setShowSafeSpaces] = useState(false);
  const [nearestSafeSpaces, setNearestSafeSpaces] = useState([]);
  const mapRef = useRef(null);
  const savedPosition = useRef(null);

  const allSafeSpaces = useMemo(() => [
    { name: "Police Station", type: "police", coordinates: { lat: 40.7128, lng: -74.0060 } },
    { name: "Central Hospital", type: "hospital", coordinates: { lat: 40.7148, lng: -74.0068 } },
    { name: "Fire Station", type: "fire", coordinates: { lat: 40.7138, lng: -74.0040 } },
    { name: "Emergency Center", type: "emergency", coordinates: { lat: 40.7158, lng: -74.0055 } },
    { name: "Public Library", type: "public", coordinates: { lat: 40.7135, lng: -74.0080 } }
  ], []);

  const calculateDistance = (point1, point2) => {
    const R = 6371;
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const updateNearestSafeSpaces = useCallback(() => {
    if (!center || !mapRef.current) return;
  
    const service = new window.google.maps.places.PlacesService(mapRef.current);
    const searchTypes = [
      { type: 'police', query: 'police station' },
      { type: 'hospital', query: 'hospital' },
      { type: 'fire_station', query: 'fire station' },
      { type: 'library', query: 'public library' }
    ];
  
    const promises = searchTypes.map(({ type, query }) => {
      return new Promise((resolve) => {
        const request = {
          location: new window.google.maps.LatLng(center.lat, center.lng),
          radius: 5000, // 5km radius
          keyword: query,
          type: type === 'hospital' ? 'hospital' : 
                type === 'police' ? 'police' : 
                type === 'fire_station' ? 'fire_station' : 
                'library'
        };
  
        service.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results.map(place => ({
              name: place.name,
              type: type,
              coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              },
              address: place.vicinity,
              distance: window.google.maps.geometry.spherical.computeDistanceBetween(
                new window.google.maps.LatLng(center.lat, center.lng),
                place.geometry.location
              )
            })));
          } else {
            resolve([]);
          }
        });
      });
    });
  
    Promise.all(promises)
      .then(resultsArray => {
        const allPlaces = resultsArray.flat();
        const sortedPlaces = allPlaces
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5)
          .map(place => ({
            ...place,
            distanceText: place.distance < 1000 ? 
              `${Math.round(place.distance)} meters` : 
              `${(place.distance / 1000).toFixed(1)} km`
          }));
  
        setNearestSafeSpaces(sortedPlaces);
      })
      .catch(error => {
        console.error('Error fetching safe spaces:', error);
      });
  }, [center]);

  const onMapLoad = useCallback((map) => {
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

  const clearRoute = useCallback(() => {
    // Clear directions
    setDirections(null);
    // Clear destination input
    setDestination("");
    // Clear nearby safe spaces list
    setNearestSafeSpaces([]);
    // Reset map style to default (optional)
    setShowSafeSpaces(false);
    
    // Reset map zoom and center to saved position or initial location
    if (mapRef.current && savedPosition.current) {
        mapRef.current.setZoom(18); // Or a preferred default zoom level
        mapRef.current.panTo(savedPosition.current); // Center back to saved position or default location
    }

    // Reset any search-related states
    setIsSearching(false);
}, []);


  const toggleMapStyle = useCallback(() => {
    setCurrentStyle(prev => prev === 'default' ? 'night' : 'default');
  }, []);

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

  const navigateToSafeSpace = useCallback((coordinates) => {
    setDestination(`${coordinates.lat},${coordinates.lng}`);
    calculateRoute();
    setShowSafeSpaces(false);
  }, [calculateRoute]);

  useEffect(() => {
    getBrowserLocation();
  }, [getBrowserLocation]);

  useEffect(() => {
    updateNearestSafeSpaces();
  }, [updateNearestSafeSpaces]);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAwTD3-V30SQKb9tmM7UyVhx_ron9jcH5s",
    libraries: ["places", "geometry"]
  });

  if (!isLoaded) return "Loading Maps";

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <style>{animations}</style>

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

      {/* Safe Spaces Button and Menu */}
      <div style={{ position: 'absolute', top: '90px', right: '20px', zIndex: 1 }}>
        <button 
          onClick={() => setShowSafeSpaces(!showSafeSpaces)}
          style={{
            padding: '12px',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3b77db';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4285f4';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Home size={24} />
        </button>

        {showSafeSpaces && (
          <div style={{
            position: 'absolute',
            top: '120%',
            right: '0',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            padding: '12px',
            width: '280px',
            animation: 'slideIn 0.3s ease-out forwards'
          }}>
            <div style={{ 
              borderBottom: '2px solid #f1f5f9', 
              paddingBottom: '8px', 
              marginBottom: '8px',
              fontWeight: '600',
              color: '#1e293b'
            }}>
              Nearest Safe Spaces
            </div>
            {nearestSafeSpaces.map((space, index) => (
              <button
                key={index}
                onClick={() => navigateToSafeSpace(space.coordinates)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#4285f4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{ fontWeight: '500', color: '#1e293b' }}>{space.name}</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Type: {space.type}</div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#4285f4', 
                  marginTop: '4px'
                }}>
                  Distance: {space.distanceText}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

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
        {center && (
          <Marker
            position={center}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(40, 40)
            }}
            title="You are here"
          />
        )}

        {nearestSafeSpaces.map((space, index) => (
          <Marker
            key={index}
            position={space.coordinates}
            icon={{
              url: `https://maps.google.com/mapfiles/ms/icons/${
                space.type === 'police' ? 'red' : 
                space.type === 'hospital' ? 'purple' : 
                'yellow'}-dot.png`,
              scaledSize: new window.google.maps.Size(32, 32)
            }}
            title={`${space.name} - ${space.distanceText}`}
          />
        ))}

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