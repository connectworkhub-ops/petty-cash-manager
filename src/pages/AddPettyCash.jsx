import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, Edit2, Wallet, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'

export default function AddPettyCash() {
    const [projectId, setProjectId] = useState('')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState([])
    const [projectSummaries, setProjectSummaries] = useState([])
    const [historyPopup, setHistoryPopup] = useState(null) // { projectId, entries: [] }
    const [editingEntry, setEditingEntry] = useState(null)
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false)

    useEffect(() => {
        fetchProjects()
        fetchSummaries()
    }, [])

    async function fetchProjects() {
        const { data } = await supabase.from('projects').select('id, name')
        if (data) setProjects(data)
    }

    async function fetchSummaries() {
        const { data: projectsData } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
        if (!projectsData) return

        const summaries = await Promise.all(projectsData.map(async (p) => {
            const { data: cash } = await supabase.from('petty_cash_entries').select('amount').eq('project_id', p.id)
            const total = cash?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
            return { ...p, totalAmount: total }
        }))
        setProjectSummaries(summaries)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!projectId || !amount) return

        setLoading(true)
        try {
            const { error } = await supabase.from('petty_cash_entries').insert([{
                project_id: projectId,
                amount: parseFloat(amount)
            }])
            if (error) throw error

            alert("Petty Cash added.")
            setAmount('')
            setProjectId('')
            setIsProjectDropdownOpen(false)
            fetchSummaries()
        } catch (error) {
            console.error(error)
            alert("Error adding petty cash")
        } finally {
            setLoading(false)
        }
    }

    const openHistory = async (project) => {
        const { data } = await supabase
            .from('petty_cash_entries')
            .select('*')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })

        setHistoryPopup({ project, entries: data || [] })
    }

    const handleUpdateEntry = async (e) => {
        e.preventDefault()
        if (!editingEntry) return

        try {
            const { error } = await supabase
                .from('petty_cash_entries')
                .update({ amount: parseFloat(editingEntry.amount) })
                .eq('id', editingEntry.id)

            if (error) throw error

            // Refresh history list
            const { data } = await supabase
                .from('petty_cash_entries')
                .select('*')
                .eq('project_id', historyPopup.project.id)
                .order('created_at', { ascending: false })

            setHistoryPopup(prev => ({ ...prev, entries: data || [] }))
            setEditingEntry(null)
            fetchSummaries() // Refresh main grid
        } catch (error) {
            console.error(error)
            alert("Error updating entry")
        }
    }

    return (
        <div className="space-y-8">
            <div className="bg-midnight-800 p-6 rounded-xl shadow-lg border border-midnight-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                        <Wallet size={24} />
                    </div>
                    <h2 className="text-xl font-semibold text-text-main">Add Petty Cash</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-text-muted mb-1">Select Project Name</label>
                        <button
                            type="button"
                            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                            className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg flex items-center justify-between text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                        >
                            <span className={projectId ? "text-text-main" : "text-text-muted"}>
                                {projectId
                                    ? projects.find(p => p.id === projectId)?.name
                                    : "Select a project"}
                            </span>
                            {isProjectDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {isProjectDropdownOpen && (
                            <div className="absolute z-20 mt-2 w-full bg-midnight-800 border border-midnight-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                {projects.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => {
                                            setProjectId(p.id)
                                            setIsProjectDropdownOpen(false)
                                        }}
                                        className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors mb-1 last:mb-0 ${projectId === p.id ? 'bg-primary/20 text-primary' : 'hover:bg-midnight-700 text-text-muted'
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{p.name}</span>
                                        {projectId === p.id && <CheckCircle2 size={18} />}
                                    </div>
                                ))}
                                {projects.length === 0 && (
                                    <div className="text-center py-4 text-text-muted text-sm italic">
                                        No projects available.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Amount (₹)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main transition-shadow"
                            placeholder="Enter amount"
                            required
                            min="0"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Save'}
                    </button>
                </form>
            </div>

            <div className="bg-midnight-800 rounded-xl shadow-lg border border-midnight-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-midnight-900 text-text-muted font-medium border-b border-midnight-700">
                            <tr>
                                <th className="p-4 whitespace-nowrap">Sr. No.</th>
                                <th className="p-4 whitespace-nowrap">Date</th>
                                <th className="p-4 whitespace-nowrap">Project Name</th>
                                <th className="p-4 whitespace-nowrap">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-midnight-700">
                            {projectSummaries.map((project, index) => (
                                <tr key={project.id} className="hover:bg-midnight-700/50 transition-colors">
                                    <td className="p-4 text-text-muted">{index + 1}</td>
                                    <td className="p-4 whitespace-nowrap text-text-muted">{new Date(project.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-text-main">{project.name}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => openHistory(project)}
                                            className="text-secondary hover:underline font-semibold"
                                        >
                                            ₹{project.totalAmount.toLocaleString()}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* History Popup */}
            {historyPopup && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-midnight-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col border border-midnight-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-text-main">History: {historyPopup.project.name}</h3>
                            <button onClick={() => setHistoryPopup(null)} className="text-text-muted hover:text-text-main">✕</button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-midnight-900 text-text-muted sticky top-0">
                                    <tr>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Amount</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-midnight-700">
                                    {historyPopup.entries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-midnight-700/50">
                                            <td className="p-3 text-text-muted">{new Date(entry.created_at).toLocaleString()}</td>
                                            <td className="p-3 font-medium text-text-main">₹{entry.amount.toLocaleString()}</td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => setEditingEntry(entry)}
                                                    className="text-text-muted hover:text-primary"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Entry Popup */}
            {editingEntry && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-midnight-800 rounded-xl p-6 w-full max-w-sm border border-midnight-700 shadow-2xl">
                        <h3 className="text-lg font-semibold mb-4 text-text-main">Edit Amount</h3>
                        <form onSubmit={handleUpdateEntry} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-text-muted">Amount</label>
                                <input
                                    type="number"
                                    value={editingEntry.amount}
                                    onChange={(e) => setEditingEntry({ ...editingEntry, amount: e.target.value })}
                                    className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingEntry(null)}
                                    className="flex-1 py-2 border border-midnight-700 rounded-lg hover:bg-midnight-700 text-text-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
