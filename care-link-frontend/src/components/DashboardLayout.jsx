import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser, clearStoredUser } from '../services/api';
import Logo from './Logo';

const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const storedUser = getStoredUser();
        if (storedUser) {
            setUser(storedUser);
        } else {
            navigate('/auth');
        }
    }, [navigate]);

    const handleLogout = () => {
        clearStoredUser();
        navigate('/auth');
    };

    if (!user) return null;

    const menuItems = [
        {
            path: '/dashboard',
            label: 'Overview',
            icon: '📊',
            roles: ['admin', 'family', 'elder', 'doctor']
        },
        {
            path: '/dashboard/medications',
            label: 'Medications',
            icon: '💊',
            roles: ['admin', 'family', 'elder']
        },
        {
            path: '/dashboard/vault',
            label: 'Medical Vault',
            icon: '📁',
            roles: ['admin', 'family', 'doctor']
        },
        {
            path: '/dashboard/family-access',
            label: 'Family Access',
            icon: '👥',
            roles: ['admin', 'family', 'doctor', 'elder']
        },
        {
            path: '/dashboard/access-requests',
            label: 'Access Requests',
            icon: '🔔',
            roles: ['elder', 'admin']
        },
        {
            path: '/dashboard/sos',
            label: 'SOS Emergency',
            icon: '🚨',
            roles: ['admin', 'family', 'elder', 'doctor']
        },
        // Add more items as needed
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'
                    } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-20`}
            >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <Logo
                        size="sm"
                        showText={isSidebarOpen}
                        textClassName="text-healthcare-dark"
                    />
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1 hover:bg-gray-100 rounded-lg lg:hidden"
                    >
                        {isSidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        if (!item.roles.includes(user.role)) return null;

                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-50 text-healthcare-primary'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-healthcare-dark'
                                    } ${!isSidebarOpen && 'justify-center'}`}
                                title={!isSidebarOpen ? item.label : ''}
                            >
                                <span className="text-xl">{item.icon}</span>
                                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 px-3 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors ${!isSidebarOpen && 'justify-center'
                            }`}
                    >
                        <span className="text-xl">🚪</span>
                        {isSidebarOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-healthcare-dark capitalize">
                        {location.pathname.split('/').pop() || 'Dashboard'}
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="font-semibold text-healthcare-dark">{user.name || 'User'}</p>
                            <p className="text-xs text-gray-500 capitalize">
                                {user.role}{user.age ? ` • Age ${user.age}` : ''}
                            </p>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl
              ${user.role === 'elder' ? 'bg-blue-100 text-blue-600' :
                                user.role === 'family' ? 'bg-purple-100 text-purple-600' :
                                    user.role === 'doctor' ? 'bg-green-100 text-green-600' :
                                        'bg-orange-100 text-orange-600'}`}
                        >
                            {user.role === 'elder' ? '👴' :
                                user.role === 'family' ? '👨‍👩‍👧‍👦' :
                                    user.role === 'doctor' ? '⚕️' : '👨‍💼'}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
