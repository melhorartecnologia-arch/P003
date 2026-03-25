import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileText,
  Search,
  Upload,
  Users,
  Shield,
  LogOut,
  Home,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Painel', icon: Home },
    { path: '/documentos', label: 'Documentos', icon: FileText },
    { path: '/busca', label: 'Busca', icon: Search },
    ...(hasRole('admin', 'operador')
      ? [{ path: '/upload', label: 'Upload', icon: Upload }]
      : []),
    ...(hasRole('admin')
      ? [
          { path: '/usuarios', label: 'Usuários', icon: Users },
          { path: '/auditoria', label: 'Auditoria', icon: Shield },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-900 text-white flex flex-col">
        <div className="p-4 border-b border-primary-800">
          <h1 className="text-lg font-bold">Documentos Oficiais</h1>
          <p className="text-xs text-primary-300 mt-1">DOU / DOE</p>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary-800">
          <div className="text-sm">
            <p className="font-medium">{user?.nome}</p>
            <p className="text-primary-300 text-xs">{user?.email}</p>
            <p className="text-primary-400 text-xs capitalize mt-1">{user?.perfil}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 mt-3 text-sm text-primary-300 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
