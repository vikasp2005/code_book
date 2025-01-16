import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Menu, FolderOpen, Trash } from "lucide-react";
import axios from 'axios';

const NavBar = ({ isAuthenticated, user, savedPrograms, onLoadProgram, onDeleteProgram }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showProgramsMenu, setShowProgramsMenu] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5000/api/auth/logout', {},
                { withCredentials: true }
            );
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center space-x-4">
                        {isAuthenticated && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowProgramsMenu(!showProgramsMenu)}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                                >
                                    <Menu className="h-4 w-4 mr-2" />
                                    Programs
                                </button>

                                {showProgramsMenu && (
                                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50">
                                        <div className="py-1 max-h-96 overflow-y-auto">
                                            {savedPrograms.map((program) => (
                                                <div
                                                    key={program._id}
                                                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-100"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            onLoadProgram(program._id);
                                                            setShowProgramsMenu(false);
                                                        }}
                                                        className="flex items-center flex-1"
                                                    >
                                                        <FolderOpen className="h-4 w-4 mr-2" />
                                                        <span className="truncate">{program.fileName}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteProgram(program._id)}
                                                        className="p-1 hover:text-red-600"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <Link to='/' className="text-xl font-bold text-gray-900">
                            Code Book
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {!isAuthenticated ? (
                            <>
                                <Link to='/login' className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded">
                                    Login
                                </Link>
                                <Link to='/register' className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded">
                                    Register
                                </Link>
                            </>
                        ) : (
                            <div className="relative">
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
                                                onClick={handleLogout}
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