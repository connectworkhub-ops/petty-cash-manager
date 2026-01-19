import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load components
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'

// Lazy load other components
const AddProject = lazy(() => import('./pages/AddProject'))
const AddPettyCash = lazy(() => import('./pages/AddPettyCash'))
const Report = lazy(() => import('./pages/Report'))
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'))
const Master = lazy(() => import('./pages/Master'))
const AddUser = lazy(() => import('./pages/AddUser'))
const AssignUser = lazy(() => import('./pages/AssignUser'))

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
                <Suspense fallback={<LoadingSpinner fullPage />}>
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
                </Suspense>
            </Router>
        </AuthProvider>
    )
}

export default App
