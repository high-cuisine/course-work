import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Tours from './pages/Tours'
import TourDetail from './pages/TourDetail'
import Orders from './pages/Orders'
import AdminPanel from './pages/AdminPanel'
import { getToken, getUser, api } from './utils/auth'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      const userData = getUser()
      setUser(userData)
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const refreshUser = async () => {
    const token = getToken()
    if (token) {
      try {
        const userData = await api('/users/me')
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } catch (err) {
        console.error(err)
      }
    }
  }

  if (loading) {
    return <div className="container">Загрузка...</div>
  }

  return (
    <div>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container">
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/" element={<Tours user={user} onUserUpdate={refreshUser} />} />
          <Route path="/tours/:id" element={<TourDetail user={user} onUserUpdate={refreshUser} />} />
          <Route path="/orders" element={user ? <Orders user={user} onUserUpdate={refreshUser} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && (user.role === 'admin' || user.role === 'moderator') ? <AdminPanel user={user} /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
