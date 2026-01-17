import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, Edit2, PlusSquare } from 'lucide-react'

export default function AddProject() {
    const [name, setName] = useState('')
    const [logo, setLogo] = useState(null)
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState([])
    const [editingProject, setEditingProject] = useState(null)

    useEffect(() => {
        fetchProjects()
    }, [])

    async function fetchProjects() {
        const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
        if (data) setProjects(data)
    }

    const handleLogoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogo(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name) return

        setLoading(true)
        try {
            const { error } = await supabase.from('projects').insert([{ name, logo }])
            if (error) throw error

            alert("Project is created.")
            setName('')
            setLogo(null)
            // Reset file input
            e.target.reset()
            fetchProjects()
        } catch (error) {
            console.error(error)
            alert("Error creating project")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        if (!editingProject) return

        setLoading(true)
        try {
            const updates = { name: editingProject.name }
            if (editingProject.newLogo) updates.logo = editingProject.newLogo

            const { error } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', editingProject.id)

            if (error) throw error

            alert("Project updated.")
            setEditingProject(null)
            fetchProjects()
        } catch (error) {
            console.error(error)
            alert("Error updating project")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="bg-midnight-800 p-6 rounded-xl shadow-lg border border-midnight-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <PlusSquare size={24} />
                    </div>
                    <h2 className="text-xl font-semibold text-text-main">Add Project Name</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main placeholder-text-muted/50"
                            placeholder="Enter project name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Logo (JPG, PNG)</label>
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={handleLogoChange}
                            className="w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80 cursor-pointer"
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
                                <th className="p-4 whitespace-nowrap">Logo</th>
                                <th className="p-4 whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-midnight-700">
                            {projects.map((project, index) => (
                                <tr key={project.id} className="hover:bg-midnight-700/50 transition-colors">
                                    <td className="p-4 text-text-muted">{index + 1}</td>
                                    <td className="p-4 whitespace-nowrap text-text-muted">{new Date(project.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-text-main">{project.name}</td>
                                    <td className="p-4">
                                        {project.logo ? (
                                            <img src={project.logo} alt="logo" className="w-10 h-10 rounded-lg object-contain p-1 border border-midnight-700" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-midnight-900 border border-midnight-700 flex items-center justify-center text-text-muted text-xs">N/A</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => setEditingProject(project)}
                                            className="p-2 text-text-muted hover:text-primary hover:bg-midnight-900 rounded-lg transition-colors"
                                            title="Edit Project"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {projects.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-muted">
                                        No projects created yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Popup */}
            {editingProject && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-midnight-800 rounded-xl p-6 w-full max-w-md border border-midnight-700 shadow-2xl">
                        <h3 className="text-lg font-semibold mb-4 text-text-main">Edit Project</h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-text-muted">Project Name</label>
                                <input
                                    type="text"
                                    value={editingProject.name}
                                    onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                                    className="w-full p-2.5 bg-midnight-900 border border-midnight-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-text-muted">New Logo (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0]
                                        if (file) {
                                            const reader = new FileReader()
                                            reader.onloadend = () => {
                                                setEditingProject({ ...editingProject, newLogo: reader.result })
                                            }
                                            reader.readAsDataURL(file)
                                        }
                                    }}
                                    className="w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80 cursor-pointer"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingProject(null)}
                                    className="flex-1 py-2 border border-midnight-700 rounded-lg hover:bg-midnight-700 text-text-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
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
