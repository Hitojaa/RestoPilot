import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const PAGE_TITLES = {
  '/':         'Dashboard',
  '/dishes':   'Mes Plats',
  '/schedule': 'Heures & Jours',
  '/pricing':  'Prix & Revenus',
};

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'RestoPilot';

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-56 min-h-screen">
        <Header title={title} />
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
