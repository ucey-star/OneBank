// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Switch to BrowserRouter
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import Playground from "./pages/Playground";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router>
      <ToastContainer />
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