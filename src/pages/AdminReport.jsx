import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Download, Loader2, History, User, Coins, ChevronRight, X } from 'lucide-react'

export default function AdminReport() {
    const [reportData, setReportData] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeModal, setActiveModal] = useState(null) // { type: 'project' | 'transfer', title: string, entries: [] }

    useEffect(() => {
        fetchReport()
    }, [])

    async function fetchReport() {
        setLoading(true)
        try {
            const { data: projects } = await supabase.from('projects').select('*').order('name')
            if (!projects) return

            const report = await Promise.all(projects.map(async (p) => {
                // 1. Fetch Project Petty Cash History
                const { data: cashEntries } = await supabase
                    .from('petty_cash_entries')
                    .select('*')
                    .eq('project_id', p.id)
                    .order('created_at', { ascending: false })

                // 2. Fetch User Allocations (State)
                const { data: userAllocations } = await supabase
                    .from('user_petty_cash')
                    .select('user_id, amount')
                    .eq('project_id', p.id)

                // 3. Fetch User Transfer History (New Table - handle if missing)
                let transferHistory = []
                try {
                    const { data: th } = await supabase
                        .from('user_petty_cash_history')
                        .select('*, users(name)')
                        .eq('project_id', p.id)
                        .order('created_at', { ascending: false })
                    if (th) transferHistory = th
                } catch (e) {
                    console.error('Transfer history fetch failed:', e)
                }

                // 4. Fetch All Expenses for this project
                const { data: allExpenses } = await supabase
                    .from('expenses')
                    .select('*')
                    .eq('project_id', p.id)

                // 5. Fetch Assigned Users
                const { data: assignments } = await supabase
                    .from('project_assignments')
                    .select('user_id, users(name)')
                    .eq('project_id', p.id)

                const totalProjectRec = cashEntries?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
                const totalProjectUsed = allExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
                const projectBalance = totalProjectRec - totalProjectUsed

                const userSummaries = assignments?.map(a => {
                    const allocation = userAllocations?.find(ua => ua.user_id === a.user_id)?.amount || 0
                    const used = allExpenses?.filter(e => e.user_id === a.user_id).reduce((sum, e) => sum + Number(e.amount), 0) || 0
                    return {
                        userId: a.user_id,
                        userName: a.users?.name || 'Unknown',
                        received: allocation,
                        used: used,
                        balance: allocation - used
                    }
                }) || []

                return {
                    ...p,
                    totalProjectRec,
                    totalProjectUsed,
                    projectBalance,
                    cashEntries: cashEntries || [],
                    transferHistory: transferHistory || [],
                    userSummaries,
                    allExpenses: allExpenses || []
                }
            }))

            setReportData(report)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const [exporting, setExporting] = useState(null)

    const handleExport = async (project) => {
        setExporting(project.id)
        try {
            const { utils, writeFile } = await import('xlsx')
            const wb = utils.book_new()

            // Summary Sheet
            const summaryData = [
                ['Project Report Summary'],
                ['Project Name', project.name],
                ['Total Received', project.totalProjectRec],
                ['Total Used', project.totalProjectUsed],
                ['Balance', project.projectBalance],
                [''],
                ['User-wise Breakdown'],
                ['User Name', 'Allocated', 'Spent', 'Remaining'],
                ...project.userSummaries.map(u => [u.userName, u.received, u.used, u.balance])
            ]
            const wsSummary = utils.aoa_to_sheet(summaryData)
            utils.book_append_sheet(wb, wsSummary, "Summary")

            // Detailed Expenses Sheet
            const expenseData = [
                ['Date', 'Type', 'Head', 'User', 'Description', 'Amount'],
                ...project.allExpenses.map(e => [
                    new Date(e.created_at).toLocaleDateString(),
                    e.expense_type,
                    e.expense_head,
                    e.user_name,
                    e.description || '',
                    e.amount
                ])
            ]
            const wsExpenses = utils.aoa_to_sheet(expenseData)
            utils.book_append_sheet(wb, wsExpenses, "Expenses")

            writeFile(wb, `${project.name}_Full_Report.xlsx`)
        } catch (error) {
            console.error('Export failed:', error)
        } finally {
            setExporting(null)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <h2 className="text-xl font-semibold text-text-main">Admin Project Reports</h2>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-12 bg-midnight-800 rounded-xl border border-midnight-700">
                    <Loader2 className="animate-spin text-primary w-10 h-10 mb-4" />
                    <p className="text-text-muted">Analyzing project data...</p>
                </div>
            ) : reportData.map((project) => (
                <div key={project.id} className="bg-midnight-800 rounded-2xl shadow-xl border border-midnight-700 overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-midnight-900/50 p-5 flex items-center justify-between border-b border-midnight-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Coins size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-text-main">{project.name}</h3>
                        </div>
                        <button
                            onClick={() => handleExport(project)}
                            disabled={exporting === project.id}
                            className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1 transition-colors"
                        >
                            {exporting === project.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            Export
                        </button>
                    </div>

                    {/* Project Totals */}
                    <div className="p-5">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <span className="text-xs text-text-muted font-medium mb-1 block">Total Petty Cash Rec:</span>
                                <button 
                                    onClick={() => setActiveModal({ 
                                        type: 'project', 
                                        title: `History: ${project.name}`, 
                                        entries: project.cashEntries 
                                    })}
                                    className="text-lg font-bold text-text-main hover:text-primary transition-colors flex items-center gap-1.5"
                                >
                                    ₹{project.totalProjectRec.toLocaleString()}
                                    <History size={14} className="text-text-muted" />
                                </button>
                            </div>
                            <div>
                                <span className="text-xs text-text-muted font-medium mb-1 block">Total Petty Cash Balance:</span>
                                <span className={`text-lg font-bold ${project.projectBalance >= 0 ? 'text-emerald-500' : 'text-danger'}`}>
                                    ₹{project.projectBalance.toLocaleString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-text-muted font-medium mb-1 block">Total Petty Cash Used:</span>
                                <span className="text-lg font-bold text-text-main">
                                    ₹{project.totalProjectUsed.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex flex-col justify-end">
                                <span className="text-xs text-text-muted font-medium mb-1 block">Transfer History:</span>
                                <button 
                                    onClick={() => setActiveModal({ 
                                        type: 'transfer', 
                                        title: `Transfer History: ${project.name}`, 
                                        entries: project.transferHistory 
                                    })}
                                    className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                                >
                                    View
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* User Sections Divider */}
                        <div className="mt-8 mb-4 border-t border-midnight-700/50 pt-4">
                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">User-wise breakdown</h4>
                            <div className="space-y-4">
                                {project.userSummaries.map((user) => (
                                    <div key={user.userId} className="bg-midnight-900/30 rounded-xl p-4 border border-midnight-700">
                                        <div className="flex items-center gap-2 mb-3">
                                            <User size={14} className="text-primary" />
                                            <span className="font-semibold text-text-main text-sm">{user.userName}:</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-text-muted uppercase mb-1">Total Rec</span>
                                                <span className="text-sm font-medium text-text-main">₹{user.received.toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-text-muted uppercase mb-1">Total Used</span>
                                                <span className="text-sm font-medium text-text-main">₹{user.used.toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-text-muted uppercase mb-1">Total Balance</span>
                                                <span className={`text-sm font-bold ${user.balance >= 0 ? 'text-emerald-500' : 'text-danger'}`}>
                                                    ₹{user.balance.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Modal Overlay */}
            {activeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-midnight-800 w-full max-w-lg rounded-2xl border border-midnight-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-midnight-700 flex justify-between items-center bg-midnight-900/50">
                            <h3 className="font-bold text-text-main">{activeModal.title}</h3>
                            <button onClick={() => setActiveModal(null)} className="p-1 text-text-muted hover:text-text-main transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 flex-1">
                            {activeModal.entries.length === 0 ? (
                                <div className="text-center py-10 text-text-muted text-sm italic">
                                    No records found for this view.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeModal.entries.map((entry, i) => (
                                        <div key={i} className="bg-midnight-900 rounded-lg p-3 flex justify-between items-center border border-midnight-700">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-text-muted">
                                                    {new Date(entry.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                                {activeModal.type === 'transfer' && (
                                                    <span className="text-sm font-medium text-primary mt-0.5">
                                                        Sent to: {entry.users?.name || 'Unknown'}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-lg font-bold text-text-main">
                                                ₹{entry.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-midnight-900/50 text-center">
                            <button 
                                onClick={() => setActiveModal(null)}
                                className="w-full bg-midnight-700 hover:bg-midnight-600 text-text-main py-2 rounded-xl transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
