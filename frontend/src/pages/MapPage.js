import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 43.2220, lng: 76.8512 };

const CATEGORIES = ['All', 'Moving', 'Repairs', 'Shopping', 'Gardening', 'IT Help', 'Photography', 'Tutoring', 'Pets'];

const mapStyles = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

// ВАЖНО: Вынесено наружу, чтобы избежать ошибки "Loader must not be called again"
const libraries = ['places'];

export default function MapPage() {
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  
  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
    libraries: libraries,
  });

  useEffect(() => {
    const params = { status: 'open' };
    if (activeCategory && activeCategory !== 'All') params.category = activeCategory;
    api.get('/tasks', { params }).then(res => setTasks(res.data)).catch(() => {});
  }, [activeCategory]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ: Добавлена проверка на существование геометрии
  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      
      if (place && place.geometry && place.geometry.location) {
        const newPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCenter(newPos);
      } else {
        console.log("Autocomplete: Place not found or has no geometry");
      }
    }
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setSelected(null);
    if (cat === 'All') setSearchParams({});
    else setSearchParams({ category: cat });
  };

  const tasksWithCoords = tasks.filter(t => t.latitude && t.longitude);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
            <span className="page-topbar-title">Task Map</span>
            
            {isLoaded && (
              <Autocomplete
                onLoad={(ref) => (autocompleteRef.current = ref)}
                onPlaceChanged={onPlaceChanged}
              >
                <input
                  type="text"
                  placeholder="Find address..."
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} // Предотвращаем перезагрузку
                  style={{
                    width: '300px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border)',
                    fontSize: '13px',
                    outline: 'none',
                    background: 'var(--bg)'
                  }}
                />
              </Autocomplete>
            )}
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {tasksWithCoords.length} tasks on map
          </span>
        </div>

        <div className="map-layout">
          <div className="map-panel">
            <div className="map-panel-header">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-2)' }}>
                Filter by Category
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 9,
                      border: 'none',
                      background: activeCategory === cat ? 'var(--green-pale)' : 'transparent',
                      color: activeCategory === cat ? 'var(--green)' : 'var(--text-2)',
                      fontWeight: activeCategory === cat ? 600 : 400,
                      fontSize: 13,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                      borderLeft: activeCategory === cat ? '3px solid var(--green)' : '3px solid transparent',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="map-panel-list">
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 8 }}>
                {tasks.length} result{tasks.length !== 1 ? 's' : ''}
              </div>
              {tasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                  No tasks found
                </div>
              )}
              {tasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelected(task);
                    if (task.latitude && task.longitude) {
                      setCenter({ lat: parseFloat(task.latitude), lng: parseFloat(task.longitude) });
                    }
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    border: `1.5px solid ${selected?.id === task.id ? 'var(--green)' : 'var(--border)'}`,
                    background: selected?.id === task.id ? 'var(--green-pale)' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: 'var(--text)' }}>{task.title}</div>
                  {task.category && (
                    <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, marginBottom: 4 }}>{task.category}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {task.location_name ? (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.location_name}</span>
                    ) : <span />}
                    {task.payment && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>{task.payment} ₸</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="map-container">
            {!isLoaded ? (
              <div className="loading-wrap">
                <div className="spinner" /> Loading map...
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={13}
                options={{
                  styles: mapStyles,
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
              >
                {tasksWithCoords.map(task => (
                  <Marker
                    key={task.id}
                    position={{ lat: parseFloat(task.latitude), lng: parseFloat(task.longitude) }}
                    onClick={() => setSelected(task)}
                    icon={{
                      path: window.google?.maps?.SymbolPath?.CIRCLE,
                      fillColor: selected?.id === task.id ? '#2d6a27' : '#4fad44',
                      fillOpacity: 1,
                      strokeColor: 'white',
                      strokeWeight: 2,
                      scale: selected?.id === task.id ? 10 : 8,
                    }}
                  />
                ))}

                {selected && selected.latitude && selected.longitude && (
                  <InfoWindow
                    position={{ lat: parseFloat(selected.latitude), lng: parseFloat(selected.longitude) }}
                    onCloseClick={() => setSelected(null)}
                  >
                    <div style={{ maxWidth: 220, fontFamily: "'DM Sans', sans-serif", padding: '4px 2px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#151a14' }}>{selected.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        {selected.category && (
                          <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{selected.category}</span>
                        )}
                        {selected.payment && (
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#2d6a27' }}>{selected.payment} ₸</span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/tasks/${selected.id}`)}
                        style={{ background: '#2d6a27', color: 'white', border: 'none', padding: '8px 0', borderRadius: 8, fontWeight: 600, fontSize: 13, width: '100%', cursor: 'pointer' }}
                      >
                        View Task
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}