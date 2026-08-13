import { Routes, Route, Navigate } from 'react-router-dom';
import Landing  from './pages/Landing';
import Profiles from './pages/Profiles';

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<Landing />}  />
      <Route path="/profiles" element={<Profiles />} />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  );
}
