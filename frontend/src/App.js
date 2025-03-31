import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthForm from './components/AuthForm';
import RegisterForm from './components/RegisterForm';
import HomePage from './components/HomePage';
import VerificationForm from './components/VerificationForm';
import RegisterFinal from './components/RegisterFinal';

function App() {
  console.log('App component rendered');
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/confirm-auth" element={<VerificationForm type="login" />} />
        <Route path="/confirm-reg" element={<VerificationForm type="register" />} />
        <Route path="/register-final" element={<RegisterFinal />} />
        <Route path="/mail" element={<div>Mail Page</div>} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;