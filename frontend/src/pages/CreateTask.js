import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

const CATEGORIES = ['Moving', 'Repairs', 'Shopping', 'Gardening', 'IT Help', 'Photography', 'Tutoring', 'Pets'];
const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 43.2220, lng: 76.8512 };

const mapStyles = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

export default function CreateTask() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '', payment: '' });
  const [markerPos, setMarkerPos] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
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
  }, [user]);

  const handleMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });

    // Reverse geocode using Google Maps Geocoder
    if (window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setLocationName(results[0].formatted_address);
        } else {
          setLocationName(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      });
    } else {
      setLocationName(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
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
          {/* Form panel */}
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

            <div style={{ marginBottom: 8 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Location</label>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                Click anywhere on the map to set the task location. The address will be detected automatically.
              </p>
            </div>

            {markerPos ? (
              <div style={{ background: 'var(--green-pale)', border: '1px solid var(--green-border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                  Selected Location
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{locationName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg)', border: '1.5px dashed var(--border)', borderRadius: 10, padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No location selected — click on the map
              </div>
            )}

            {markerPos && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setMarkerPos(null); setLocationName(''); }}
                style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}
              >
                Clear location
              </button>
            )}
          </div>

          {/* Map */}
          <div style={{ position: 'relative' }}>
            {!isLoaded ? (
              <div className="loading-wrap"><div className="spinner" /> Loading map...</div>
            ) : (
              <>
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
                    cursor: 'crosshair',
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

                {/* Map hint overlay */}
                <div style={{
                  position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(20,31,18,0.85)', color: 'white', padding: '8px 16px',
                  borderRadius: 20, fontSize: 13, fontWeight: 500,
                  backdropFilter: 'blur(4px)',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}>
                  Click on the map to set task location
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
