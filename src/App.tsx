import { Routes, Route } from 'react-router';
import DesktopPage from '@/pages/DesktopPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DesktopPage />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
