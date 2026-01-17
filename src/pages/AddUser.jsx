import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, UserPlus, Trash2 } from 'lucide-react'

export default function AddUser() {

    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('User')
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setFetching(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('users')
                .insert([{
                    name: name.trim(),
                    password: password.trim(),
                    role: role
                }])

            if (error) throw error

            setName('')
            setPassword('')
            setRole('User')
            fetchUsers()
            alert('User added successfully')
        } catch (error) {
            console.error('Error adding user:', error)
            alert('Error adding user')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchUsers()
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Error deleting user')
        }
    }

    return (
        <div className="space-y-6">


            <div className="bg-midnight-800 p-6 rounded-xl shadow-lg border border-midnight-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <UserPlus size={24} />
                    </div>
                    <h2 className="text-xl font-semibold text-text-main">Add New User</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">User Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main placeholder-text-muted/50"
                            placeholder="Enter user name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main placeholder-text-muted/50"
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main"
                        >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Save User'}
                    </button>
                </form>
            </div>

            <div className="bg-midnight-800 rounded-xl shadow-lg border border-midnight-700 overflow-hidden">
                <div className="p-4 border-b border-midnight-700">
                    <h3 className="font-semibold text-text-main">Existing Users</h3>
                </div>

                {fetching ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="divide-y divide-midnight-700">
                        {users.map((user) => (
                            <div key={user.id} className="p-4 flex justify-between items-center hover:bg-midnight-700/30 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-text-main text-sm font-medium">{user.name}</span>
                                    <span className="text-text-muted text-xs">{user.role || 'User'}</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    className="p-2 text-text-muted hover:text-danger hover:bg-midnight-900 rounded-lg transition-colors"
                                    title="Delete User"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {users.length === 0 && (
                            <div className="p-8 text-center text-text-muted">
                                No users found.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
