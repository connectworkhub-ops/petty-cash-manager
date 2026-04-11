import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Banknote, ChevronDown, ChevronUp, CheckCircle2, Loader2, Save } from 'lucide-react'

export default function AssignPettyCash() {
    const [projects, setProjects] = useState([])
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false)

    const [fetching, setFetching] = useState(true)
    const [fetchingDetails, setFetchingDetails] = useState(false)
    const [loading, setLoading] = useState(false)
    const [projectPettyCash, setProjectPettyCash] = useState(0)

    const [assignedUsers, setAssignedUsers] = useState([])
    // key: user_id, value: new increment amount for input field
    const [allocations, setAllocations] = useState({})
    // key: user_id, value: current cumulative total from database
    const [currentTotals, setCurrentTotals] = useState({})

    useEffect(() => {
        fetchProjects()
    }, [])

    useEffect(() => {
        if (selectedProjectId) {
            fetchProjectDetails(selectedProjectId)
        } else {
            setAssignedUsers([])
            setAllocations({})
            setCurrentTotals({})
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
        setFetchingDetails(true)
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

            const tempCurrentTotals = {}
            const tempAllocations = {}

            if (allocationsData) {
                allocationsData.forEach(row => {
                    tempCurrentTotals[row.user_id] = Number(row.amount) || 0
                })
            }

            // Ensure all assigned users exist in state even if 0
            users.forEach(u => {
                if (!(u.id in tempCurrentTotals)) {
                    tempCurrentTotals[u.id] = 0
                }
                // Inputs always start empty
                tempAllocations[u.id] = ''
            })

            setCurrentTotals(tempCurrentTotals)
            setAllocations(tempAllocations)

        } catch (error) {
            console.error('Error fetching project details:', error)
            alert('Failed to load project details.')
        } finally {
            setFetchingDetails(false)
        }
    }

    const handleAllocationChange = (userId, value) => {
        // Keep as string to allow empty input
        if (value === '' || value === null) {
            setAllocations(prev => ({ ...prev, [userId]: '' }))
            return
        }
        const numericValue = parseFloat(value)
        if (isNaN(numericValue) || numericValue < 0) return
        setAllocations(prev => ({ ...prev, [userId]: value }))
    }

    const totalAllocatedInInputs = Object.values(allocations).reduce((sum, val) => sum + Number(val || 0), 0)
    const cumulativeTotals = Object.values(currentTotals).reduce((sum, val) => sum + Number(val || 0), 0)
    const totalAllocatedAfterUpdate = cumulativeTotals + totalAllocatedInInputs
    const remainingBalance = projectPettyCash - totalAllocatedAfterUpdate
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
            const historyEntries = []
            const upsertData = []

            for (const [userId, incrementStr] of Object.entries(allocations)) {
                const increment = Number(incrementStr) || 0
                if (increment <= 0) continue

                const currentTotal = currentTotals[userId] || 0
                const newTotal = currentTotal + increment

                upsertData.push({
                    project_id: selectedProjectId,
                    user_id: userId,
                    amount: newTotal
                })

                historyEntries.push({
                    project_id: selectedProjectId,
                    user_id: userId,
                    amount: increment,
                    type: 'Allocation'
                })
            }

            if (upsertData.length === 0) {
                alert('Please enter an amount to assign.')
                setLoading(false)
                return
            }

            // 1. Update user totals
            const { error: upsertError } = await supabase
                .from('user_petty_cash')
                .upsert(upsertData, { onConflict: 'project_id, user_id' })

            if (upsertError) throw upsertError

            // 2. Log history
            const { error: historyError } = await supabase
                .from('user_petty_cash_history')
                .insert(historyEntries)

            if (historyError) throw historyError

            alert('Petty cash assigned successfully!')

            // Refresh totals and clear inputs
            fetchProjectDetails(selectedProjectId)
        } catch (error) {
            console.error('Error assigning petty cash:', error)
            alert('Error assigning petty cash.')
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

                {fetchingDetails ? (
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
                                <span className="font-medium text-text-main">₹{cumulativeTotals.toFixed(2)}</span>
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

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-text-muted mb-2">Allocations</label>
                            {assignedUsers.map(user => (
                                <div key={user.id} className="p-4 bg-midnight-900 border border-midnight-700 rounded-xl hover:bg-midnight-700/30 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-text-main font-semibold">{user.name}</span>
                                        <div className="text-right">
                                            <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-0.5">Total Transferred: ₹{(currentTotals[user.id] || 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">Add ₹</span>
                                        <input
                                            type="number"
                                            value={allocations[user.id] || ''}
                                            onChange={(e) => handleAllocationChange(user.id, e.target.value)}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className="w-full p-2.5 pl-14 bg-midnight-800 border border-midnight-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main text-right pr-4 transition-all"
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
