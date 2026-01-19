import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import AddProject from './pages/AddProject'
import AddPettyCash from './pages/AddPettyCash'
import Report from './pages/Report'
import ProjectDetails from './pages/ProjectDetails'
import Master from './pages/Master'
import AddUser from './pages/AddUser'
import AssignUser from './pages/AssignUser'
import Login from './pages/Login'

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth()

    if (loading) return null
    if (!user) return <Navigate to="/login" replace />
    if (adminOnly && user.role !== 'Admin') return <Navigate to="/" replace />

    return children
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<Home />} />
                        <Route path="report" element={<Report />} />
                        <Route path="project/:id" element={<ProjectDetails />} />

                        {/* Admin Only Routes */}
                        <Route path="master" element={<ProtectedRoute adminOnly><Master /></ProtectedRoute>} />
                        <Route path="add-project" element={<ProtectedRoute adminOnly><AddProject /></ProtectedRoute>} />
                        <Route path="add-petty-cash" element={<ProtectedRoute adminOnly><AddPettyCash /></ProtectedRoute>} />
                        <Route path="add-user" element={<ProtectedRoute adminOnly><AddUser /></ProtectedRoute>} />
                        <Route path="assign-user" element={<ProtectedRoute adminOnly><AssignUser /></ProtectedRoute>} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App
