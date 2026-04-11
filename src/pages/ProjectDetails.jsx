import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2, ChevronDown, ChevronUp, CheckCircle2, User } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function ProjectDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(false)
    const [userBalanceInfo, setUserBalanceInfo] = useState({ allocated: 0, spent: 0, remaining: 0 })
    const [fetchingBalance, setFetchingBalance] = useState(true)

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [type, setType] = useState('Select')
    const [head, setHead] = useState('')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false)
    const [assignedUsers, setAssignedUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)

    const expenseTypes = [
        'Select',
        'Travelling Expense',
        'Food Expense',
        'Transport Expense',
        'Hotel Accomodation',
        'Production',
        'Manpower Expenses',
        'Stationery',
        'Fuel Expenses',
        'Rental Expneses',
        'Other Expense'
    ]

    useEffect(() => {
        fetchProject()
        fetchAssignedUsers()
    }, [id])

    useEffect(() => {
        if (id && currentUser) {
            fetchUserBalance()
        }
    }, [id, currentUser])

    async function fetchUserBalance() {
        setFetchingBalance(true)
        try {
            let allocated = 0;
            let spent = 0;

            if (currentUser?.role === 'Admin') {
                const { data: cashData } = await supabase.from('petty_cash_entries').select('amount').eq('project_id', id)
                const totalProjectCash = cashData?.reduce((sum, row) => sum + Number(row.amount), 0) || 0

                const { data: allocData } = await supabase.from('user_petty_cash').select('amount').eq('project_id', id)
                const totalAllocated = allocData?.reduce((sum, row) => sum + Number(row.amount), 0) || 0

                allocated = totalProjectCash - totalAllocated;
            } else {
                const { data: allocData } = await supabase.from('user_petty_cash').select('amount').eq('project_id', id).eq('user_id', currentUser?.id).single()
                allocated = allocData ? Number(allocData.amount) : 0;
            }

            const { data: expenseData } = await supabase.from('expenses').select('amount').eq('project_id', id).eq('user_id', currentUser?.id)
            spent = expenseData?.reduce((sum, row) => sum + Number(row.amount), 0) || 0

            setUserBalanceInfo({
                allocated: allocated,
                spent: spent,
                remaining: allocated - spent
            })
        } catch (error) {
            console.error('Error fetching balance:', error)
        } finally {
            setFetchingBalance(false)
        }
    }

    async function fetchAssignedUsers() {
        try {
            const { data, error } = await supabase
                .from('project_assignments')
                .select(`
                    user_id,
                    users (name)
                `)
                .eq('project_id', id)

            if (error) throw error

            const users = data?.map(item => ({
                id: item.user_id,
                name: item.users?.name
            })) || []

            setAssignedUsers(users)

            // Logic for initial user selection
            if (currentUser?.role === 'Admin') {
                if (users.length > 0) {
                    setSelectedUser(users[0])
                }
            } else {
                // Regular user can only be themselves
                setSelectedUser({ id: currentUser?.id, name: currentUser?.name })
            }
        } catch (error) {
            console.error('Error fetching assigned users:', error)
        }
    }

    async function fetchProject() {
        const { data } = await supabase.from('projects').select('*').eq('id', id).single()
        if (data) setProject(data)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!amount || !head) return

        setLoading(true)
        try {
            const { error } = await supabase.from('expenses').insert([{
                project_id: id,
                created_at: new Date(date).toISOString(),
                expense_type: type,
                expense_head: head,
                user_name: currentUser?.role === 'Admin' ? currentUser?.name : (selectedUser?.name || currentUser?.name || 'User'),
                user_id: currentUser?.id,
                description,
                amount: parseFloat(amount)
            }])

            if (error) throw error

            alert("Expense save successfully.")
            // Reset form
            setHead('')
            setDescription('')
            setAmount('')
            setDate(new Date().toISOString().split('T')[0])
            setType('Select')
            await fetchUserBalance()
            if (assignedUsers.length > 0) {
                setSelectedUser(assignedUsers[0])
            }
        } catch (error) {
            console.error(error)
            alert("Error saving expense")
        } finally {
            setLoading(false)
        }
    }

    if (!project) return <div className="p-8"><Loader2 className="animate-spin text-primary" /></div>

    return (
        <div className="space-y-6">


            <div className="flex items-center gap-4 mb-8">
                {project.logo ? (
                    <img src={project.logo} alt={project.name} className="w-16 h-16 rounded-xl object-cover bg-midnight-900 shadow-sm border border-midnight-700" />
                ) : (
                    <div className="w-16 h-16 rounded-xl bg-midnight-900 border border-midnight-700 flex items-center justify-center text-text-muted">
                        <span className="text-xs">No Logo</span>
                    </div>
                )}
                <h2 className="text-2xl font-bold text-text-main">{project.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl">
                <div className="bg-midnight-800 p-5 rounded-xl shadow-lg border border-midnight-700 flex flex-col justify-center">
                    <span className="text-text-muted text-sm font-medium mb-1">Petty Cash</span>
                    {fetchingBalance ? <Loader2 className="animate-spin w-5 h-5 text-text-muted" /> : <span className="text-base font-semibold text-text-main">₹{userBalanceInfo.allocated.toFixed(2)}</span>}
                </div>
                <div className="bg-midnight-800 p-5 rounded-xl shadow-lg border border-midnight-700 flex flex-col justify-center">
                    <span className="text-text-muted text-sm font-medium mb-1">Total Spent</span>
                    {fetchingBalance ? <Loader2 className="animate-spin w-5 h-5 text-text-muted" /> : <span className="text-base font-semibold text-primary">₹{userBalanceInfo.spent.toFixed(2)}</span>}
                </div>
                <div className="bg-midnight-800 p-5 rounded-xl shadow-lg border border-midnight-700 flex flex-col justify-center">
                    <span className="text-text-muted text-sm font-medium mb-1">Balance</span>
                    {fetchingBalance ? <Loader2 className="animate-spin w-5 h-5 text-text-muted" /> : <span className={`text-base font-semibold ${userBalanceInfo.remaining < 0 ? 'text-danger' : 'text-emerald-500'}`}>₹{userBalanceInfo.remaining.toFixed(2)}</span>}
                </div>
            </div>

            <div className="bg-midnight-800 p-6 rounded-xl shadow-lg border border-midnight-700 max-w-3xl">
                <h3 className="text-lg font-semibold mb-6 text-text-main border-b border-midnight-700 pb-2">Add Expense</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-1.5">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main transition-shadow"
                                required
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-text-muted mb-1.5">Expense Type</label>
                            <button
                                type="button"
                                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg flex items-center justify-between text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                            >
                                <span>{type}</span>
                                {isTypeDropdownOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {isTypeDropdownOpen && (
                                <div className="absolute z-20 mt-2 w-full bg-midnight-800 border border-midnight-700 rounded-lg shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {expenseTypes.map((t) => (
                                        <div
                                            key={t}
                                            onClick={() => {
                                                setType(t)
                                                setIsTypeDropdownOpen(false)
                                            }}
                                            className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors mb-1 last:mb-0 ${type === t ? 'bg-primary/20 text-primary' : 'hover:bg-midnight-700 text-text-muted'
                                                }`}
                                        >
                                            <span className="text-sm font-medium">{t}</span>
                                            {type === t && <CheckCircle2 size={16} />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1.5">Expense Head</label>
                        <input
                            type="text"
                            value={head}
                            onChange={(e) => setHead(e.target.value)}
                            className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main transition-shadow"
                            placeholder="e.g. Taxi, Lunch, Office Supplies"
                            required
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-text-muted mb-1.5">User</label>
                        <div className="w-full p-2.5 border border-midnight-700 rounded-lg bg-midnight-900/50 text-text-muted flex items-center gap-2 cursor-not-allowed">
                            <User size={16} className="text-text-muted/50" />
                            <span>{currentUser?.name || 'Unknown'}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1.5">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main transition-shadow resize-none"
                            rows="3"
                            placeholder="Enter details about the expense..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1.5">Amount (₹)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full p-2.5 pl-8 bg-midnight-900 border border-midnight-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main transition-shadow font-medium text-lg"
                                placeholder="0.00"
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center mt-6 shadow-lg shadow-primary/20 active:scale-[0.99]"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Save Expense'}
                    </button>
                </form>
            </div>
        </div>
    )
}
