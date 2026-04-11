import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Banknote, ChevronDown, ChevronUp, CheckCircle2, Loader2, Save } from 'lucide-react'

export default function AssignPettyCash() {
    const [projects, setProjects] = useState([])
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false)

    const [fetching, setFetching] = useState(true)
    const [loading, setLoading] = useState(false)
    const [projectPettyCash, setProjectPettyCash] = useState(0)

    const [assignedUsers, setAssignedUsers] = useState([])
    // key: user_id, value: allocated amount
    const [allocations, setAllocations] = useState({})

    useEffect(() => {
        fetchProjects()
    }, [])

    useEffect(() => {
        if (selectedProjectId) {
            fetchProjectDetails(selectedProjectId)
        } else {
            setAssignedUsers([])
            setAllocations({})
            setProjectPettyCash(0)
        }
    }, [selectedProjectId])

    async function fetchProjects() {
        setFetching(true)
        try {
            const { data } = await supabase.from('projects').select('id, name').order('name')
            setProjects(data || [])
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setFetching(false)
        }
    }

    async function fetchProjectDetails(projectId) {
        setFetching(true)
        try {
            // 1. Fetch Total Petty Cash for project
            const { data: cashData } = await supabase
                .from('petty_cash_entries')
                .select('amount')
                .eq('project_id', projectId)
            
            const totalProjectCash = cashData?.reduce((sum, row) => sum + Number(row.amount), 0) || 0
            setProjectPettyCash(totalProjectCash)

            // 2. Fetch assigned users
            const { data: assignmentData, error: assignmentError } = await supabase
                .from('project_assignments')
                .select(`
                    user_id,
                    users (name)
                `)
                .eq('project_id', projectId)

            if (assignmentError) throw assignmentError

            const users = assignmentData?.map(item => ({
                id: item.user_id,
                name: item.users?.name
            })) || []

            setAssignedUsers(users)

            // 3. Fetch existing allocations
            const { data: allocationsData } = await supabase
                .from('user_petty_cash')
                .select('user_id, amount')
                .eq('project_id', projectId)

            const tempAllocations = {}
            if (allocationsData) {
                allocationsData.forEach(row => {
                    tempAllocations[row.user_id] = Number(row.amount) || 0
                })
            }
            
            // Ensure all assigned users exist in state even if 0
            users.forEach(u => {
                if (!(u.id in tempAllocations)) {
                    tempAllocations[u.id] = 0
                }
            })

            setAllocations(tempAllocations)

        } catch (error) {
            console.error('Error fetching project details:', error)
            alert('Failed to load project details.')
        } finally {
            setFetching(false)
        }
    }

    const handleAllocationChange = (userId, value) => {
        let numericValue = value === '' ? 0 : parseFloat(value)
        if (isNaN(numericValue) || numericValue < 0) numericValue = 0

        setAllocations(prev => ({
            ...prev,
            [userId]: numericValue
        }))
    }

    const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + Number(val || 0), 0)
    const remainingBalance = projectPettyCash - totalAllocated
    const isExceeded = remainingBalance < 0

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedProjectId) return
        
        if (isExceeded) {
            alert('Cannot save: Total allocated exceeds project petty cash limit.')
            return
        }

        setLoading(true)
        try {
            const updates = Object.entries(allocations).map(([userId, amount]) => ({
                project_id: selectedProjectId,
                user_id: userId,
                amount: Number(amount)
            }))

            if (updates.length === 0) {
                alert('No users to assign petty cash.')
                setLoading(false)
                return
            }

            const { error } = await supabase
                .from('user_petty_cash')
                .upsert(updates, { onConflict: 'project_id, user_id' })

            if (error) throw error

            alert('Petty cash assigned to users successfully!')
        } catch (error) {
            console.error('Error assigning petty cash:', error)
            alert('Error assigning petty cash. Have you run the SQL migration yet?')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-midnight-800 p-6 rounded-xl shadow-lg border border-midnight-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-text-main">Assign Petty Cash</h2>
                        <p className="text-sm text-text-muted mt-1">Distribute project cash to assigned users</p>
                    </div>
                </div>

                <div className="relative mb-6">
                    <label className="block text-sm font-medium text-text-muted mb-2">Select Project</label>
                    <button
                        type="button"
                        disabled={fetching && !projects.length}
                        onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                        className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg flex items-center justify-between text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <span className={selectedProjectId ? "text-text-main" : "text-text-muted"}>
                            {selectedProjectId
                                ? projects.find(p => p.id === selectedProjectId)?.name
                                : "Choose a project..."}
                        </span>
                        {isProjectDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {isProjectDropdownOpen && (
                        <div className="absolute z-30 mt-2 w-full bg-midnight-800 border border-midnight-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            {projects.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => {
                                        setSelectedProjectId(p.id)
                                        setIsProjectDropdownOpen(false)
                                    }}
                                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors mb-1 last:mb-0 ${selectedProjectId === p.id ? 'bg-primary/20 text-primary' : 'hover:bg-midnight-700 text-text-muted'
                                        }`}
                                >
                                    <span className="text-sm font-medium">{p.name}</span>
                                    {selectedProjectId === p.id && <CheckCircle2 size={18} />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {fetching && selectedProjectId ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : selectedProjectId && assignedUsers.length > 0 ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-midnight-900/50 rounded-lg p-4 border border-midnight-700">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-text-muted">Total Project Petty Cash:</span>
                                <span className="font-medium text-text-main">₹{projectPettyCash.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-text-muted">Total Allocated to Users:</span>
                                <span className="font-medium text-text-main">₹{totalAllocated.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-midnight-700">
                                <span className="text-text-muted">Admin Retained Balance:</span>
                                <span className={`font-semibold ${isExceeded ? 'text-danger' : 'text-emerald-500'}`}>
                                    ₹{remainingBalance.toFixed(2)}
                                </span>
                            </div>
                            {isExceeded && (
                                <div className="mt-3 text-xs text-danger bg-danger/10 p-2 rounded border border-danger/20">
                                    Allocation exceeds project total by ₹{Math.abs(remainingBalance).toFixed(2)}. Please reduce assigned amounts.
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-text-muted mb-2">Allocations</label>
                            {assignedUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between gap-4 p-3 bg-midnight-900 border border-midnight-700 rounded-lg">
                                    <span className="text-text-main font-medium">{user.name}</span>
                                    <div className="relative w-1/3 min-w-[120px]">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">₹</span>
                                        <input
                                            type="number"
                                            value={allocations[user.id] === 0 ? '' : allocations[user.id]}
                                            onChange={(e) => handleAllocationChange(user.id, e.target.value)}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className="w-full p-2 pl-8 bg-midnight-800 border border-midnight-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main text-right"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || isExceeded}
                            className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Allocations</>}
                        </button>
                    </form>
                ) : selectedProjectId ? (
                    <div className="text-center p-8 bg-midnight-900/30 rounded-lg border border-dashed border-midnight-600">
                        <p className="text-text-muted">No users assigned to this project.</p>
                        <p className="text-xs text-text-muted mt-2">Go to "Assign User" to link users to this project.</p>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
