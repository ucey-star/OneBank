import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom"; // 👈 Use HashRouter
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import Playground from "./pages/Playground";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<Dashboard />} /> 
        <Route path="/playground" element={<Playground />} />
      </Routes>
    </Router>
  );
}

export default App;
