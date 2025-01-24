import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, LogOut, Menu } from "lucide-react";

const NavBar = ({
    isAuthenticated,
    user,
    onLogout,
    onToggleSidebar = () => { },
    showSidebar = false
}) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.user-menu-container')) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onToggleSidebar}
                            className="p-2 hover:bg-gray-100 rounded"
                            aria-label={showSidebar ? "Hide saved programs" : "Show saved programs"}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <Link to='/' className="text-xl font-bold text-gray-900">
                            Code Book
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {!isAuthenticated ? (
                            <>
                                <Link
                                    to='/login'
                                    state={{ from: location.pathname }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                                >
                                    Login
                                </Link>
                                <Link to='/register' className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded">
                                    Register
                                </Link>
                            </>
                        ) : (
                            <div className="relative user-menu-container">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100"
                                >
                                    <User className="h-6 w-6" />
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                                        <div className="p-4 border-b">
                                            <p className="text-sm font-medium text-gray-900">{user.username}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    onLogout();
                                                    setShowUserMenu(false);
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <LogOut className="h-4 w-4 mr-2" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;