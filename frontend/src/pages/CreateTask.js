import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

const CATEGORIES = ['Moving', 'Repairs', 'Shopping', 'Gardening', 'IT Help', 'Photography', 'Tutoring', 'Pets'];
const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 43.2220, lng: 76.8512 };

const mapStyles = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

// ВАЖНО: Выносим за пределы компонента, чтобы избежать повторных загрузок
const libraries = ['places'];

export default function CreateTask() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '', payment: '' });
  const [markerPos, setMarkerPos] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Реф для поиска
  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
    libraries: libraries, // Добавили libraries здесь
  });

  useEffect(() => {
    if (!user) navigate('/signin');
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapCenter(c);
        setMarkerPos(c);
        setLocationName('My current location');
      },
      () => {}
    );
  }, [user, navigate]);

  // Функция для поиска адреса
  const onPlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place.geometry) {
      const pos = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      setMarkerPos(pos);
      setMapCenter(pos);
      setLocationName(place.formatted_address);
    }
  };

  const handleMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });

    if (window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setLocationName(results[0].formatted_address);
        } else {
          setLocationName(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required');
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/tasks', {
        ...form,
        payment: form.payment ? parseFloat(form.payment) : null,
        latitude: markerPos?.lat || null,
        longitude: markerPos?.lng || null,
        location_name: locationName || null,
      });
      navigate(`/tasks/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ padding: '6px 10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <span className="page-topbar-title">Create New Task</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Posting...' : 'Post Task'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
          <div style={{ padding: '28px', overflowY: 'auto', borderRight: '1px solid var(--border)', background: 'white' }}>
            {error && <div className="error-banner">{error}</div>}

            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input
                className="form-input"
                placeholder="e.g. Help with furniture moving"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe what needs to be done in detail..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment (₸)</label>
              <input
                className="form-input"
                type="number"
                placeholder="Amount in tenge (optional)"
                value={form.payment}
                onChange={e => setForm({ ...form, payment: e.target.value })}
                min="0"
              />
            </div>

            <div className="divider" />

            {/* ПОИСК АДРЕСА */}
            <div className="form-group">
              <label className="form-label">Find Address</label>
              {isLoaded && (
                <Autocomplete
                  onLoad={ref => (autocompleteRef.current = ref)}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter address..."
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  />
                </Autocomplete>
              )}
            </div>

            {markerPos ? (
              <div style={{ background: 'var(--green-pale)', border: '1px solid var(--green-border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                  Selected Location
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{locationName}</div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg)', border: '1.5px dashed var(--border)', borderRadius: 10, padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Click on the map or use search
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            {!isLoaded ? (
              <div className="loading-wrap"><div className="spinner" /> Loading map...</div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={13}
                onClick={handleMapClick}
                options={{
                  styles: mapStyles,
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                  clickableIcons: false,
                }}
              >
                {markerPos && (
                  <Marker
                    position={markerPos}
                    icon={{
                      path: window.google?.maps?.SymbolPath?.CIRCLE,
                      fillColor: '#2d6a27',
                      fillOpacity: 1,
                      strokeColor: 'white',
                      strokeWeight: 3,
                      scale: 10,
                    }}
                  />
                )}
              </GoogleMap>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}