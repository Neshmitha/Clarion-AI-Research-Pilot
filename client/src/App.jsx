import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Workspace from './pages/Workspace';
import SearchPapers from './pages/SearchPapers';
import DocSpace from './pages/DocSpace';
import PaperDrafter from './pages/PaperDrafter';
import Chatbot from './components/Chatbot';

const ProtectedRoute = ({ children }) => {

  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/workspace" element={
          <ProtectedRoute>
            <Workspace />
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute>
            <SearchPapers />
          </ProtectedRoute>
        } />
        <Route path="/doc-space" element={
          <ProtectedRoute>
            <DocSpace />
          </ProtectedRoute>
        } />
        <Route path="/draft" element={
          <ProtectedRoute>
            <PaperDrafter />
          </ProtectedRoute>
        } />
        <Route path="/doc-space/:id" element={
          <ProtectedRoute>
            <DocSpace />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Login />} />
      </Routes>
      <Chatbot />
    </Router>

  );
}

export default App;
