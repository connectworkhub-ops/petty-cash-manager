import { Link } from 'react-router-dom'
import { PlusSquare, Wallet, UserPlus, Users } from 'lucide-react'

export default function Master() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-main mb-6">Master Data</h2>

            <div className="grid grid-cols-1 gap-4">
                <Link
                    to="/add-project"
                    className="bg-midnight-800 p-6 rounded-xl shadow-lg border border-midnight-700 flex items-center gap-4 hover:bg-midnight-700 transition-colors group"
                >
                    <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary/20 transition-colors">
                        <PlusSquare size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-text-main">Add Project</h3>
                        <p className="text-sm text-text-muted">Create and manage projects</p>
                    </div>
                </Link>

                <Link
                    to="/add-user"
                    className="bg-midnight-800 p-6 rounded-xl shadow-lg border border-midnight-700 flex items-center gap-4 hover:bg-midnight-700 transition-colors group"
                >
                    <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-500 group-hover:bg-indigo-500/20 transition-colors">
                        <UserPlus size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-text-main">Add User</h3>
                        <p className="text-sm text-text-muted">Manage system users</p>
                    </div>
                </Link>

                <Link
                    to="/assign-user"
                    className="bg-midnight-800 p-6 rounded-xl shadow-lg border border-midnight-700 flex items-center gap-4 hover:bg-midnight-700 transition-colors group"
                >
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                        <Users size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-text-main">Assign User</h3>
                        <p className="text-sm text-text-muted">Link users to projects</p>
                    </div>
                </Link>

                <Link
                    to="/add-petty-cash"
                    className="bg-midnight-800 p-6 rounded-xl shadow-lg border border-midnight-700 flex items-center gap-4 hover:bg-midnight-700 transition-colors group"
                >
                    <div className="p-3 bg-secondary/10 rounded-lg text-secondary group-hover:bg-secondary/20 transition-colors">
                        <Wallet size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-text-main">Add Petty Cash</h3>
                        <p className="text-sm text-text-muted">Record cash inflows</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}
