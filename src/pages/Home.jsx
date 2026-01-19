import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export default function Home() {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProjects()
    }, [])

    async function fetchProjects() {
        try {
            const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('*, petty_cash_entries(amount), expenses(amount)')

            if (projectsError) throw projectsError

            const projectsWithTotals = projectsData.map(project => {
                const totalCash = project.petty_cash_entries?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
                const totalExpenses = project.expenses?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
                return { ...project, totalCash, totalExpenses }
            })

            setProjects(projectsWithTotals)
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>

    return (
        <div className="flex flex-col gap-4">
            {projects.map((project) => {
                const hasCash = project.totalCash > 0

                return (
                    <Link
                        key={project.id}
                        to={hasCash ? `/project/${project.id}` : '#'}
                        onClick={(e) => {
                            if (!hasCash) {
                                e.preventDefault()
                                alert("Add Petty Cash to the Project.")
                            }
                        }}
                        className={`bg-midnight-800 p-4 rounded-xl shadow-lg border border-midnight-700 relative block transition-all duration-200 ${hasCash ? 'hover:scale-[1.02] active:scale-[0.98] hover:shadow-primary/10 hover:border-primary/50' : 'opacity-70 cursor-not-allowed'}`}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            {project.logo ? (
                                <img src={project.logo} alt={project.name} className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-contain p-1 border border-midnight-700" />
                            ) : (
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-midnight-900 border border-midnight-700 flex items-center justify-center text-text-muted">
                                    <span className="text-xs">No Logo</span>
                                </div>
                            )}
                            <h3 className="font-semibold text-lg text-text-main line-clamp-2">{project.name}</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Received</span>
                                <span className="text-secondary font-medium text-sm">₹{project.totalCash.toLocaleString()}</span>
                            </div>

                            <div className="w-full h-px bg-midnight-700"></div>

                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Expenses</span>
                                <span className="text-danger font-medium text-sm">₹{project.totalExpenses.toLocaleString()}</span>
                            </div>
                        </div>
                    </Link>
                )
            })}

            {projects.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-midnight-800 rounded-full flex items-center justify-center mb-4 border border-midnight-700">
                        <Loader2 className="text-text-muted" size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-text-main">No projects found</h3>
                    <p className="text-text-muted mt-1">Get started by adding a new project.</p>
                </div>
            )}
        </div>
    )
}
