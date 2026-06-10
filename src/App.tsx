import { Routes, Route } from 'react-router';
import Login from '@/pages/Login';
import DesktopPage from '@/pages/DesktopPage';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<DesktopPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
