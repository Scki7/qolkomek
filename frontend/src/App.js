import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Home from './pages/Home';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import MapPage from './pages/MapPage';
import CreateTask from './pages/CreateTask';
import TaskDetail from './pages/TaskDetail';
import TaskStatus from './pages/TaskStatus';
import RatingPage from './pages/RatingPage';
import ChatPage from './pages/ChatPage';
import Profile from './pages/Profile';
import MyTasks from './pages/MyTasks';
import AdminPanel from './pages/AdminPanel';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-container"><div className="loading"><div className="spinner" /></div></div>;
  return user ? children : <Navigate to="/signin" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/tasks/:id" element={<TaskDetail />} />

      <Route path="/create-task" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
      <Route path="/tasks/:id/status" element={<ProtectedRoute><TaskStatus /></ProtectedRoute>} />
      <Route path="/tasks/:id/rate" element={<ProtectedRoute><RatingPage /></ProtectedRoute>} />
      <Route path="/chat/:taskId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/:id" element={<Profile />} />
      <Route path="/my-tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
