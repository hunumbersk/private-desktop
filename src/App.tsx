import { Routes, Route } from 'react-router';
import DesktopPage from '@/pages/DesktopPage';
import Login from '@/pages/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DesktopPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
