import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import DdayPage from './pages/DdayPage'
import NewsPage from './pages/NewsPage'
import MapPage from './pages/MapPage'
import AdminPage from './pages/AdminPage'
import LocationPage from './pages/LocationPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="dot-grid" />
        <Navbar />
        <Routes>
          <Route path="/" element={<DdayPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/location" element={<LocationPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
