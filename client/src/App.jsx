import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Workspace from './pages/Workspace';
import SearchPapers from './pages/SearchPapers';

import PaperDrafter from './pages/PaperDrafter';
import Library from './pages/Library';
import Settings from './pages/Settings';
import Chatbot from './components/Chatbot';
import DocSpace from './pages/DocSpace';
import Guide from './pages/Guide';
import Landing from './pages/Landing';
import AiAssistant from './pages/AiAssistant';
import Contributions from './pages/Contributions';
import NewContribution from './pages/NewContribution';
import ContributionDetail from './pages/ContributionDetail';
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
        <Route path="/guide" element={
          <ProtectedRoute>
            <Guide />
          </ProtectedRoute>
        } />

        <Route path="/draft" element={
          <ProtectedRoute>
            <PaperDrafter />
          </ProtectedRoute>
        } />
        <Route path="/docspace" element={
          <ProtectedRoute>
            <DocSpace />
          </ProtectedRoute>
        } />
        <Route path="/library" element={
          <ProtectedRoute>
            <Library />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/ai" element={
          <ProtectedRoute>
            <AiAssistant />
          </ProtectedRoute>
        } />

        <Route path="/contributions" element={
          <ProtectedRoute>
            <Contributions />
          </ProtectedRoute>
        } />
        <Route path="/contributions/new" element={
          <ProtectedRoute>
            <NewContribution />
          </ProtectedRoute>
        } />
        <Route path="/contributions/:id" element={
          <ProtectedRoute>
            <ContributionDetail />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Landing />} />        <Route path="/landing" element={<Landing />} />
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Chatbot />
    </Router>
  );
}

export default App;
