import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Download, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Report() {
    const { user: currentUser } = useAuth()
    const [reportData, setReportData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (currentUser) {
            fetchReport()
        }
    }, [currentUser])

    async function fetchReport() {
        setLoading(true)
        try {
            // Fetch only projects assigned to this user
            const { data: assignments, error: assignError } = await supabase
                .from('project_assignments')
                .select('project_id, projects(*)')
                .eq('user_id', currentUser.id)

            if (assignError) throw assignError

            const projects = assignments?.map(a => a.projects).filter(Boolean) || []

            const report = await Promise.all(projects.map(async (p) => {
                const { data: cash } = await supabase.from('petty_cash_entries').select('*').eq('project_id', p.id).order('created_at', { ascending: true })
                const { data: expenses } = await supabase.from('expenses').select('*').eq('project_id', p.id).order('created_at', { ascending: true })

                const totalCash = cash?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
                const totalExpenses = expenses?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
                const balance = totalCash - totalExpenses

                return {
                    ...p,
                    totalCash,
                    totalExpenses,
                    balance,
                    expenses: expenses || [],
                    cashEntries: cash || []
                }
            }))

            setReportData(report)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const [exporting, setExporting] = useState(false)

    const handleExport = async (project) => {
        setExporting(true)
        try {
            const { utils, writeFile } = await import('xlsx')
            const wb = utils.book_new()

            const summaryData = [
                ['Payment Received History'],
                ['Date', 'Amount'],
                ...project.cashEntries.map(c => [
                    new Date(c.created_at).toLocaleDateString(),
                    c.amount
                ]),
                ['', ''],
                ['Total Expenses Incurred', project.totalExpenses]
            ]

            const wsSummary = utils.aoa_to_sheet(summaryData)
            wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }]
            utils.book_append_sheet(wb, wsSummary, "Summary")

            const expenseData = [
                ['Date', 'Type', 'Head', 'User', 'Description', 'Amount'],
                ...project.expenses.map(e => [
                    new Date(e.created_at).toLocaleDateString(),
                    e.expense_type,
                    e.expense_head,
                    e.user_name,
                    e.description || '',
                    e.amount
                ])
            ]

            const wsExpenses = utils.aoa_to_sheet(expenseData)
            wsExpenses['!cols'] = [
                { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 15 }
            ]
            utils.book_append_sheet(wb, wsExpenses, "Expenses Incurred")

            writeFile(wb, `${project.name}_Report.xlsx`)
        } catch (error) {
            console.error('Export failed:', error)
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-main">Project Reports</h2>

            <div className="bg-midnight-800 rounded-xl shadow-lg border border-midnight-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-midnight-900 text-text-muted font-medium border-b border-midnight-700">
                            <tr>
                                <th className="p-4 whitespace-nowrap">Sr. No.</th>
                                <th className="p-4 whitespace-nowrap">Project Name</th>
                                <th className="p-4 whitespace-nowrap">Total Petty Cash</th>
                                <th className="p-4 whitespace-nowrap">Total Expenses</th>
                                <th className="p-4 whitespace-nowrap">Balance</th>
                                <th className="p-4 whitespace-nowrap text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-midnight-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-text-muted">
                                        <Loader2 className="animate-spin inline-block mr-2" />
                                        Loading report data...
                                    </td>
                                </tr>
                            ) : reportData.map((row, index) => (
                                <tr key={row.id} className="hover:bg-midnight-700/50 transition-colors">
                                    <td className="p-4 text-text-muted">{index + 1}</td>
                                    <td className="p-4 font-medium text-text-main">{row.name}</td>
                                    <td className="p-4 whitespace-nowrap text-text-main">₹{row.totalCash.toLocaleString()}</td>
                                    <td className="p-4 whitespace-nowrap text-text-main">₹{row.totalExpenses.toLocaleString()}</td>
                                    <td className={`p-4 font-bold whitespace-nowrap ${row.balance >= 0 ? 'text-secondary' : 'text-danger'}`}>
                                        ₹{row.balance.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleExport(row)}
                                            disabled={exporting}
                                            className={`p-2 rounded-lg transition-colors ${exporting ? 'opacity-50 cursor-not-allowed' : 'text-text-muted hover:text-primary hover:bg-midnight-900'}`}
                                            title={exporting ? 'Exporting...' : 'Export Data'}
                                        >
                                            <Download size={18} className={exporting ? 'animate-bounce' : ''} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && reportData.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-text-muted">
                                        No assigned projects found for reporting.
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
