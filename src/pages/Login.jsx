import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Loader2, Lock, User } from 'lucide-react'

export default function Login() {
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await login(name, password)
            navigate('/')
        } catch (err) {
            setError('Invalid name or password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black/90 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-midnight-900 rounded-2xl shadow-2xl border border-midnight-700 overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="text-primary" size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-text-main">Petty Cash Manager</h1>
                        <p className="text-text-muted mt-2">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">User Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-3 pl-10 bg-midnight-800 border border-midnight-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main transition-all"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 pl-10 bg-midnight-800 border border-midnight-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main transition-all"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-danger text-sm text-center bg-danger/10 p-3 rounded-lg border border-danger/20">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
