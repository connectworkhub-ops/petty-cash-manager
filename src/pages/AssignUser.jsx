import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, Users, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AssignUser() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState([])
    const [users, setUsers] = useState([])
    const [assignments, setAssignments] = useState([])

    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [selectedUserIds, setSelectedUserIds] = useState([])

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false)

    useEffect(() => {
        fetchInitialData()
    }, [])

    async function fetchInitialData() {
        setFetching(true)
        try {
            const [projectsRes, usersRes] = await Promise.all([
                supabase.from('projects').select('id, name').order('name'),
                supabase.from('users').select('id, name').order('name')
            ])

            setProjects(projectsRes.data || [])
            setUsers(usersRes.data || [])
            await fetchAssignments()
        } catch (error) {
            console.error('Error fetching initial data:', error)
        } finally {
            setFetching(false)
        }
    }

    async function fetchAssignments() {
        try {
            const { data, error } = await supabase
                .from('project_assignments')
                .select(`
                    id,
                    project_id,
                    user_id,
                    projects (name),
                    users (name)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setAssignments(data || [])
        } catch (error) {
            console.error('Error fetching assignments:', error)
        }
    }

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedProjectId || selectedUserIds.length === 0) {
            alert('Please select a project and at least one user.')
            return
        }

        setLoading(true)
        try {
            const newAssignments = selectedUserIds.map(userId => ({
                project_id: selectedProjectId,
                user_id: userId
            }))

            const { error } = await supabase
                .from('project_assignments')
                .upsert(newAssignments, { onConflict: 'project_id, user_id' })

            if (error) throw error

            setSelectedUserIds([])
            setIsUserDropdownOpen(false)
            await fetchAssignments()
            alert('Users assigned successfully')
        } catch (error) {
            console.error('Error assigning users:', error)
            alert('Error assigning users. Some might already be assigned.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this assignment?')) return

        try {
            const { error } = await supabase
                .from('project_assignments')
                .delete()
                .eq('id', id)

            if (error) throw error
            await fetchAssignments()
        } catch (error) {
            console.error('Error deleting assignment:', error)
            alert('Error deleting assignment')
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-midnight-800 p-6 rounded-xl shadow-lg border border-midnight-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                        <Users size={24} />
                    </div>
                    <h2 className="text-xl font-semibold text-text-main">Assign Users to Project</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <label className="block text-sm font-medium text-text-muted mb-2">Select Project</label>
                        <button
                            type="button"
                            onClick={() => {
                                setIsProjectDropdownOpen(!isProjectDropdownOpen)
                                setIsUserDropdownOpen(false)
                            }}
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
                                {projects.length === 0 && (
                                    <div className="text-center py-4 text-text-muted text-sm italic">
                                        No projects available.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-text-muted mb-2">Select Users</label>
                        <button
                            type="button"
                            onClick={() => {
                                setIsUserDropdownOpen(!isUserDropdownOpen)
                                setIsProjectDropdownOpen(false)
                            }}
                            className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg flex items-center justify-between text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <span className={selectedUserIds.length > 0 ? "text-text-main" : "text-text-muted"}>
                                {selectedUserIds.length > 0
                                    ? `${selectedUserIds.length} user(s) selected`
                                    : "Select users..."}
                            </span>
                            {isUserDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {isUserDropdownOpen && (
                            <div className="absolute z-20 mt-2 w-full bg-midnight-800 border border-midnight-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                {users.map(user => {
                                    const isSelected = selectedUserIds.includes(user.id)
                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleUserSelection(user.id)}
                                            className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors mb-1 last:mb-0 ${isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-midnight-700 text-text-muted'
                                                }`}
                                        >
                                            <span className="text-sm font-medium">{user.name}</span>
                                            {isSelected ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                        </div>
                                    )
                                })}
                                {users.length === 0 && (
                                    <div className="text-center py-4 text-text-muted text-sm italic">
                                        No users available. Add users first.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !selectedProjectId || selectedUserIds.length === 0}
                        className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Save Assignments'}
                    </button>
                </form>
            </div>

            <div className="bg-midnight-800 rounded-xl shadow-lg border border-midnight-700 overflow-hidden">
                <div className="p-4 border-b border-midnight-700">
                    <h3 className="font-semibold text-text-main">Current Assignments</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-midnight-900 text-text-muted font-medium border-b border-midnight-700">
                            <tr>
                                <th className="p-4">Sr. No.</th>
                                <th className="p-4">Project Name</th>
                                <th className="p-4">User Name</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-midnight-700">
                            {fetching ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center">
                                        <Loader2 className="animate-spin text-primary mx-auto" />
                                    </td>
                                </tr>
                            ) : assignments.map((asg, index) => (
                                <tr key={asg.id} className="hover:bg-midnight-700/30 transition-colors">
                                    <td className="p-4 text-text-muted">{index + 1}</td>
                                    <td className="p-4 text-text-main font-medium">{asg.projects?.name}</td>
                                    <td className="p-4 text-text-main">{asg.users?.name}</td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleDelete(asg.id)}
                                            className="p-2 text-text-muted hover:text-danger hover:bg-midnight-900 rounded-lg transition-colors"
                                            title="Delete Assignment"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!fetching && assignments.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-text-muted italic">
                                        No assignments found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
