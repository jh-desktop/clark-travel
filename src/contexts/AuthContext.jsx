import { createContext, useContext, useState } from 'react'

const ADMIN_PW = import.meta.env.VITE_ADMIN_PASSWORD || 'clark2026'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('clark-admin') === '1')

  function login(pw) {
    if (pw === ADMIN_PW) {
      sessionStorage.setItem('clark-admin', '1')
      setIsAdmin(true)
      return true
    }
    return false
  }

  function logout() {
    sessionStorage.removeItem('clark-admin')
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
