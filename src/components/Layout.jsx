import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, PlusSquare, Wallet, FileBarChart, Grid, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../lib/AuthContext'

export default function Layout() {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuth()

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Grid, label: 'Master', path: '/master', adminOnly: true },
        { icon: FileBarChart, label: 'Report', path: '/report' },
    ]

    const filteredNavItems = navItems.filter(item => !item.adminOnly || user?.role === 'Admin')

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-black/90 flex justify-center">
            {/* Mobile Container */}
            <div className="w-full max-w-md bg-midnight-900 min-h-screen relative shadow-2xl flex flex-col">

                {/* Top Bar */}
                <header className="bg-midnight-800 shadow-sm p-4 sticky top-0 z-10 border-b border-midnight-700 flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-text-main">
                        Welcome <span className="text-primary">{user?.name}</span>
                    </h1>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-text-muted hover:text-danger transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 overflow-y-auto pb-24">
                    <Outlet />
                </main>

                {/* Bottom Navigation (Always Visible) */}
                <nav className="fixed bottom-0 w-full max-w-md bg-midnight-800 border-t border-midnight-700 flex justify-around items-center p-2 z-10 safe-area-bottom">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="flex flex-col items-center p-2"
                            >
                                <div
                                    className={clsx(
                                        "p-2 rounded-xl transition-colors",
                                        isActive ? "bg-primary text-white" : "bg-transparent text-text-muted hover:bg-midnight-700"
                                    )}
                                >
                                    <Icon size={24} />
                                </div>
                                <span className={clsx("text-xs mt-1", isActive ? "text-primary font-medium" : "text-text-muted")}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}
