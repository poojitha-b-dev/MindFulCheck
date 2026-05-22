import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  User, 
  Home, 
  BarChart2, 
  ClipboardCheck, 
  CalendarClock, 
  BookOpen, 
  Map,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from './Logo';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const navLinks = [
    { title: 'Home',          path: '/',             icon: <Home size={18} /> },
    { title: 'Dashboard',     path: '/dashboard',    icon: <BarChart2 size={18} /> },
    { title: 'Assessment',    path: '/assessment',   icon: <ClipboardCheck size={18} /> },
    { title: 'Mood Tracker',  path: '/mood-tracker', icon: <CalendarClock size={18} /> },
    { title: 'Resources',     path: '/resources',    icon: <BookOpen size={18} /> },
    { title: 'Find Help',     path: '/find-help',    icon: <Map size={18} /> },
    {
      title: 'Recharge Zone',
      path: '/wellness',
      icon: <Sparkles size={16} />,
      highlight: true,
    },
  ];

  return (
    <header
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Logo />
            <span className="text-xl font-bold text-primary-700">MindfulCheck</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              if ((link as any).highlight) {
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 shadow-sm'
                    }`}
                  >
                    {link.icon}
                    <span>{link.title}</span>
                  </Link>
                );
              }
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-500'
                  }`}
                >
                  {link.icon}
                  <span>{link.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 text-sm font-medium ${
                    location.pathname === '/profile'
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-500'
                  }`}
                >
                  <User size={20} />
                  <span>{currentUser.displayName || 'Profile'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-primary-500"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="btn-outline">Log in</Link>
                <Link to="/register" className="btn-primary">Sign up</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 focus:outline-none"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white absolute top-full left-0 right-0 shadow-md overflow-auto max-h-[80vh]">
            <div className="flex flex-col py-4 px-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                if ((link as any).highlight) {
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.icon}
                      <span>{link.title}</span>
                      <span className="ml-auto text-xs opacity-80">✨ New</span>
                    </Link>
                  );
                }
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.icon}
                    <span>{link.title}</span>
                  </Link>
                );
              })}

              {currentUser ? (
                <>
                  <Link
                    to="/profile"
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      location.pathname === '/profile'
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={20} />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="flex items-center space-x-3 p-3 text-left w-full rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 p-3">
                  <Link to="/login" className="btn-outline w-full text-center" onClick={() => setIsMenuOpen(false)}>Log in</Link>
                  <Link to="/register" className="btn-primary w-full text-center" onClick={() => setIsMenuOpen(false)}>Sign up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
