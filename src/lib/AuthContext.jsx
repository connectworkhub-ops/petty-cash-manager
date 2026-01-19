import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for existing session in localStorage
        try {
            const savedUser = localStorage.getItem('petty_cash_user')
            if (savedUser) {
                setUser(JSON.parse(savedUser))
            }
        } catch (error) {
            console.error('Error parsing saved user:', error)
            localStorage.removeItem('petty_cash_user')
        }
        setLoading(false)
    }, [])

    const login = async (name, password) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('name', name)
            .eq('password', password)
            .single()

        if (error || !data) {
            throw new Error('Invalid name or password')
        }

        const userData = {
            id: data.id,
            name: data.name,
            role: data.role || 'User'
        }

        setUser(userData)
        localStorage.setItem('petty_cash_user', JSON.stringify(userData))
        return userData
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('petty_cash_user')
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
