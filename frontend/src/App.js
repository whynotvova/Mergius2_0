import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthForm from './components/AuthForm';
import RegisterForm from './components/RegisterForm';
import SocialPhoneForm from './components/SocialPhoneForm';
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
import FaqPage from './components/FaqPage';
import TarifPage from './components/TarifPage';

function App() {
  return (
    <div className="page-body">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/otp" element={<VerificationForm />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/social-phone" element={<SocialPhoneForm />} />
        <Route path="/confirm-auth" element={<VerificationForm type="login" />} />
        <Route path="/confirm-reg" element={<VerificationForm type="register" />} />
        <Route path="/register-final" element={<RegisterFinal />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/tarifs" element={<TarifPage />} />
        <Route path="/mail" element={<MailPage />} />
        <Route path="/mail/:folderName" element={<MailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/compose" element={<ComposePage />} />
        <Route path="/email-view" element={<EmailViewPage />} />
        <Route path="/email" element={<Navigate to="/mail" replace />} />
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