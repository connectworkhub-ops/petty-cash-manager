import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Loader2, Calendar, Tag, User, FileText, IndianRupee } from 'lucide-react'

export default function MyExpenses() {
    const { user: currentUser } = useAuth()
    const [projects, setProjects] = useState([])
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [expenses, setExpenses] = useState([])
    const [loadingProjects, setLoadingProjects] = useState(true)
    const [loadingExpenses, setLoadingExpenses] = useState(false)

    useEffect(() => {
        if (currentUser) {
            fetchProjects()
        }
    }, [currentUser])

    useEffect(() => {
        if (selectedProjectId && currentUser) {
            fetchExpenses(selectedProjectId)
        } else {
            setExpenses([])
        }
    }, [selectedProjectId, currentUser])

    async function fetchProjects() {
        setLoadingProjects(true)
        try {
            if (currentUser?.role === 'Admin') {
                const { data, error } = await supabase
                    .from('projects')
                    .select('id, name')
                    .order('name')
                if (error) throw error
                setProjects(data || [])
            } else {
                const { data, error } = await supabase
                    .from('project_assignments')
                    .select('project_id, projects(id, name)')
                    .eq('user_id', currentUser.id)
                if (error) throw error
                const userProjects = data.map(a => a.projects).filter(Boolean)
                // sort by name
                userProjects.sort((a, b) => a.name.localeCompare(b.name))
                setProjects(userProjects)
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoadingProjects(false)
        }
    }

    async function fetchExpenses(projectId) {
        setLoadingExpenses(true)
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('project_id', projectId)
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .order('id', { ascending: false })

            if (error) throw error
            setExpenses(data || [])
        } catch (error) {
            console.error('Error fetching expenses:', error)
        } finally {
            setLoadingExpenses(false)
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-main">My Expenses</h2>

            <div className="bg-midnight-800 p-5 rounded-xl shadow-lg border border-midnight-700">
                <label className="block text-sm font-medium text-text-muted mb-2">Select Project</label>
                {loadingProjects ? (
                    <div className="flex items-center gap-2 text-text-muted p-2">
                        <Loader2 className="animate-spin w-5 h-5" />
                        <span>Loading projects...</span>
                    </div>
                ) : (
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full p-3 bg-midnight-900 border border-midnight-700 rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none"
                    >
                        <option value="">-- Choose a Project --</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {selectedProjectId && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-text-main mb-4">Expense Records</h3>
                    
                    {loadingExpenses ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-primary" />
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="text-center p-8 bg-midnight-800 rounded-xl border border-midnight-700">
                            <p className="text-text-muted">No expenses found for this project.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {expenses.map((expense) => {
                                const expenseDate = new Date(expense.created_at).toLocaleDateString();
                                return (
                                    <div key={expense.id} className="bg-midnight-800 p-5 rounded-xl shadow-lg border border-midnight-700 transition-all hover:border-midnight-600">
                                        <div className="flex justify-between items-start mb-3 border-b border-midnight-700/50 pb-3">
                                            <div className="flex items-center gap-2 text-text-main font-semibold">
                                                <IndianRupee size={16} className="text-primary" />
                                                <span className="text-lg">{expense.amount?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-text-muted bg-midnight-900 px-2 py-1 rounded-md">
                                                <Calendar size={12} />
                                                <span>{expenseDate}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 mt-3">
                                            <div className="flex items-start gap-2">
                                                <Tag size={14} className="text-text-muted mt-0.5 shrink-0" />
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-medium text-text-main">{expense.expense_type}</span>
                                                    <span className="text-primary/70">|</span>
                                                    <span className="text-xs text-text-muted">{expense.expense_head}</span>
                                                    {expense.description && (
                                                        <>
                                                            <span className="text-primary/70">|</span>
                                                            <span className="text-xs text-text-muted italic">{expense.description}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
