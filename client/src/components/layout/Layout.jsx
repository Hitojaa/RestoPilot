import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/dishes':    'Mes Plats',
  '/schedule':  'Heures & Jours',
  '/pricing':   'Prix & Revenus',
  '/settings':  'Paramètres',
  '/import':    'Importer des données',
};

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'CleanPlate';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/*
        md:ml-56 → décale le contenu à droite de la sidebar sur desktop.
        Sur mobile la sidebar est un drawer par-dessus, donc ml-0.
      */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-56">
        <Header title={title} onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
