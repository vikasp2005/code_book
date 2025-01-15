import React from "react"
import { Link } from "react-router-dom";
const NavBar = () => {
    return (
        < nav className="bg-white shadow-sm" >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <Link to='/' className="text-xl font-bold text-gray-900">Code Book</Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link to='/login' className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded">
                            Login
                        </Link >
                        <Link to='/register' className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded">
                            Register
                        </Link>
                    </div>
                </div>
            </div>
        </nav >
    );
}

export default NavBar;