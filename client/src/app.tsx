import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import HomePage from './pages/HomePage/HomePage';
import UniversityListPage from './pages/UniversityListPage';
import UniversityDetailPage from './pages/UniversityDetailPage';
import PracticePage from './pages/PracticePage';
import WrongBookPage from './pages/WrongPage/WrongPage';
import FavoritesPage from './pages/FavoritesPage/FavoritesPage';
import VipPage from './pages/VipPage/VipPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import AdminPage from './pages/AdminPage/AdminPage';

const RoutesComponent = () => {
  return (
    <AuthProvider>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="universities" element={<UniversityListPage />} />
        <Route path="universities/:id" element={<UniversityDetailPage />} />

        <Route path="practice/:paperId" element={
          <ProtectedRoute>
            <PracticePage />
          </ProtectedRoute>
        } />
        <Route path="wrong-book" element={
          <ProtectedRoute>
            <WrongBookPage />
          </ProtectedRoute>
        } />
        <Route path="favorites" element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        } />
        <Route path="vip" element={<VipPage />} />
        <Route path="profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="admin" element={
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
    </AuthProvider>
  );
};

export default RoutesComponent;
