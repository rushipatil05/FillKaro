import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Profiles from './pages/Profiles';
import History from './pages/History';

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/"           element={<Navigate to="/profiles" replace />} />
          <Route path="/profiles"   element={<Profiles />} />
          <Route path="/history"    element={<History />} />
        </Routes>
      </main>
    </div>
  );
}
