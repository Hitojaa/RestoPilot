import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Dishes from './pages/Dishes';
import Schedule from './pages/Schedule';
import Pricing from './pages/Pricing';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/dishes"   element={<Dishes />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/pricing"  element={<Pricing />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
