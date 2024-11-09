import React, { useState } from 'react';
import Map from './Map';
import './App.css';

const App = () => {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="App">
      {!showMap ? (
        <button onClick={() => setShowMap(true)}>
          Show Map
        </button>
      ) : (
        <Map />
      )}
    </div>
  );
};

export default App;