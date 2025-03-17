import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Code, Book, LogOut, User } from 'lucide-react';

const NavBar = ({ isAuthenticated, user, onLogout, onToggleSidebar, showSidebar }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            setScrolled(isScrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleToggleSidebar = () => {
        onToggleSidebar();
    };

    return (
        <header
            className={`sticky top-0 z-40 w-full transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-md' : 'bg-transparent'
                }`}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <button
                                onClick={handleToggleSidebar}
                                className={`p-2 rounded-lg transition-all duration-300 ${showSidebar ? 'bg-indigo-100 text-indigo-600 rotate-90' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                aria-label="Toggle sidebar"
                            >
                                <Menu size={20} />
                            </button>
                        </div>
                        <Link to="/" className="ml-4 flex items-center space-x-2">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1.5 rounded-lg text-white">
                                <Code size={20} />
                            </div>
                            <span className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                DevDock
                            </span>
                        </Link>
                    </div>

                    {/* Desktop navigation */}
                    <nav className="hidden md:block">
                        <ul className="ml-10 flex items-center space-x-4">
                            <li>
                                <Link
                                    to="/"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/'
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    Code Editor
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/notebook"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/notebook'
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    Notebook
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    <div className="flex items-center">
                        {isAuthenticated ? (
                            <div className="relative ml-3">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center space-x-2 text-sm focus:outline-none bg-white rounded-full p-1 border border-gray-200"
                                    id="user-menu-button"
                                    aria-expanded={isUserMenuOpen}
                                    aria-haspopup="true"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                        {user?.name?.[0] || user?.email?.[0] || <User size={16} />}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <div className="text-sm font-medium text-gray-700">
                                            {user?.name || user?.email?.split('@')[0]}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate max-w-[140px]">
                                            {user?.email}
                                        </div>
                                    </div>
                                    <ChevronDown size={16} className="text-gray-500 hidden md:block" />
                                </button>

                                {isUserMenuOpen && (
                                    <div
                                        className="animate-fade-in absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                        role="menu"
                                        aria-orientation="vertical"
                                        aria-labelledby="user-menu-button"
                                    >
                                        <div className="py-1" role="none">
                                            <button
                                                onClick={() => {
                                                    setIsUserMenuOpen(false);
                                                    onLogout();
                                                }}
                                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                role="menuitem"
                                            >
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex space-x-4">
                                <Link
                                    to="/login"
                                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 border border-gray-200 transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/register"
                                    className="rounded-md bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-sm font-medium text-white hover:from-indigo-700 hover:to-indigo-600 transition-colors shadow-sm"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="ml-2 inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`md:hidden ${isMenuOpen ? 'block animate-fade-in' : 'hidden'}`}>
                <div className="space-y-1 px-2 pb-3 pt-2">
                    <Link
                        to="/"
                        className={`block rounded-md px-3 py-2 text-base font-medium ${location.pathname === '/'
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <div className="flex items-center">
                            <Code className="mr-2 h-5 w-5" />
                            Code Editor
                        </div>
                    </Link>
                    <Link
                        to="/notebook"
                        className={`block rounded-md px-3 py-2 text-base font-medium ${location.pathname === '/notebook'
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <div className="flex items-center">
                            <Book className="mr-2 h-5 w-5" />
                            Notebook
                        </div>
                    </Link>
                    {isAuthenticated && (
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                onLogout();
                            }}
                            className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-700 hover:bg-gray-100"
                        >
                            <div className="flex items-center">
                                <LogOut className="mr-2 h-5 w-5" />
                                Sign out
                            </div>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default NavBar;
