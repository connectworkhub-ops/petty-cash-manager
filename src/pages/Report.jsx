import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Download } from 'lucide-react'


export default function Report() {
    const [reportData, setReportData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReport()
    }, [])

    async function fetchReport() {
        try {
            const { data: projects } = await supabase.from('projects').select('*')
            if (!projects) return

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

            // --- Sheet 1: Summary ---
            // 1. Payment Received History
            const summaryData = [
                ['Payment Received History'],
                ['Date', 'Amount'],
                ...project.cashEntries.map(c => [
                    new Date(c.created_at).toLocaleDateString(),
                    c.amount
                ]),
                ['', ''], // Spacer
                ['Total Expenses Incurred', project.totalExpenses]
            ]

            const wsSummary = utils.aoa_to_sheet(summaryData)

            // Adjust column widths for Summary
            wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }]

            utils.book_append_sheet(wb, wsSummary, "Summary")

            // --- Sheet 2: Expenses Incurred ---
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

            // Adjust column widths for Expenses
            wsExpenses['!cols'] = [
                { wch: 15 }, // Date
                { wch: 20 }, // Type
                { wch: 20 }, // Head
                { wch: 15 }, // User
                { wch: 40 }, // Description
                { wch: 15 }  // Amount
            ]

            utils.book_append_sheet(wb, wsExpenses, "Expenses Incurred")

            // Generate Excel File
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
                                <th className="p-4 whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-midnight-700">
                            {reportData.map((row, index) => (
                                <tr key={row.id} className="hover:bg-midnight-700/50 transition-colors">
                                    <td className="p-4 text-text-muted">{index + 1}</td>
                                    <td className="p-4 font-medium text-text-main">{row.name}</td>
                                    <td className="p-4 whitespace-nowrap text-text-main">₹{row.totalCash.toLocaleString()}</td>
                                    <td className="p-4 whitespace-nowrap text-text-main">₹{row.totalExpenses.toLocaleString()}</td>
                                    <td className={`p-4 font-bold whitespace-nowrap ${row.balance >= 0 ? 'text-secondary' : 'text-danger'}`}>
                                        ₹{row.balance.toLocaleString()}
                                    </td>
                                    <td className="p-4">
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
                            {reportData.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-text-muted">
                                        No data available for report.
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
