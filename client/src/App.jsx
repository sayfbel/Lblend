import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { ToastProvider } from './components/ToastProvider';

// Page Components
import Overview from './pages/User/Overview';
import Workspace from './pages/User/Workspace';
import AddAnnouncement from './pages/User/AddAnnouncement';
import Identity from './pages/User/Profile';
import Communication from './pages/User/Communication';
import Nexus from './pages/User/Nexus';

import './index.css';

function App() {
  return (
    <ToastProvider>
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={<Dashboard />}>
             {/* Sub-routes under dashboard */}
             <Route index element={<Navigate to="overview" replace />} />
             <Route path="overview" element={<Overview />} />
             <Route path="projects" element={<Workspace />} />
             <Route path="broadcasts" element={<AddAnnouncement />} />
             <Route path="identity" element={<Identity />} />
             <Route path="intelligence" element={<Communication />} />
             <Route path="nexus" element={<Nexus />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
    </ToastProvider>
  );
}

export default App;
