import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import DdayPage from './pages/DdayPage'
import NewsPage from './pages/NewsPage'
import GuidePage from './pages/GuidePage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="dot-grid" />
        <Navbar />
        <Routes>
          <Route path="/" element={<DdayPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
