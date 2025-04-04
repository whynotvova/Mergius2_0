import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthForm from './components/AuthForm';
import RegisterForm from './components/RegisterForm';
import HomePage from './components/HomePage';
import VerificationForm from './components/VerificationForm';
import RegisterFinal from './components/RegisterFinal';
import MailPage from './components/MailPage';

function App() {
  const location = useLocation();

  return (
    <>
      <Header isMailPage={location.pathname === '/mail'} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/confirm-auth" element={<VerificationForm type="login" />} />
        <Route path="/confirm-reg" element={<VerificationForm type="register" />} />
        <Route path="/register-final" element={<RegisterFinal />} />
        <Route path="/mail" element={<MailPage />} />
        <Route path="/profile" element={<div>Profile Page</div>} />
        <Route path="/settings" element={<div>Settings Page</div>} />
      </Routes>
      {location.pathname !== '/mail' && <Footer />}
    </>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}