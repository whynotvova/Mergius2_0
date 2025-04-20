import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthForm from './components/AuthForm';
import RegisterForm from './components/RegisterForm';
import HomePage from './components/HomePage';
import VerificationForm from './components/VerificationForm';
import RegisterFinal from './components/RegisterFinal';
import MailPage from './components/MailPage';
import CalendarPage from './components/CalendarPage';
import ComposePage from './components/ComposePage';
import ProfilePage from './components/ProfilePage';
import CategoriesPage from './components/CategoriesPage';
import ThemesPage from './components/ThemesPage';
import SecurityPage from './components/SecurityPage';
import AccountPage from './components/AccountPage';
import EmailViewPage from './components/EmailViewPage';

function App() {
  return (
    <div className="page-body">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/confirm-auth" element={<VerificationForm type="login" />} />
        <Route path="/confirm-reg" element={<VerificationForm type="register" />} />
        <Route path="/register-final" element={<RegisterFinal />} />
        <Route path="/mail" element={<MailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/compose" element={<ComposePage />} />
        <Route path="/email-view" element={<EmailViewPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/themes" element={<ThemesPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/settings" element={<div>Settings Page</div>} />
      </Routes>
      <Footer />
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}