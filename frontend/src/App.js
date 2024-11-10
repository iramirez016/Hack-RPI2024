import React, { useState } from 'react';
import Map from './Map';
import './App.css';

const App = () => {
  const [showMap, setShowMap] = useState(false);

  // Automatically show map after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowMap(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">
      {!showMap ? (
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h1>SafeWalk</h1>
            <p>Loading your safe navigation...</p>
          </div>
        </div>
      ) : (
        <Map />
      )}
    </div>
  );
};

export default App;