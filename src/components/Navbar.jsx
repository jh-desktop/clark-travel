import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

export default function Navbar() {
  const { user } = useAuth()

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-logo">
        Clark<span>.travel</span>
      </NavLink>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          D-Day
        </NavLink>
        <NavLink to="/news" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          뉴스
        </NavLink>
        <NavLink to="/guide" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          여행가이드
        </NavLink>
        {user ? (
          <>
            <NavLink to="/admin" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              관리
            </NavLink>
            <button className="nav-logout" onClick={() => signOut(auth)}>로그아웃</button>
          </>
        ) : (
          <NavLink to="/admin" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            관리자
          </NavLink>
        )}
      </div>
    </nav>
  )
}
