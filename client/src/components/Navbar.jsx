import React from 'react'
import { Link } from 'react-router-dom'

export default function Navbar({ user, onLogout }) {
  return (
    <nav style={{
      background: '#343a40',
      color: 'white',
      padding: '15px 0',
      marginBottom: '20px'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '20px', fontWeight: 'bold' }}>
          🏖️ Туры
        </Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {user ? (
            <>
              <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Туры</Link>
              <Link to="/orders" style={{ color: 'white', textDecoration: 'none' }}>Мои заказы</Link>
              {(user.role === 'admin' || user.role === 'moderator') && (
                <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>Панель управления</Link>
              )}
              <span>Баланс: {(user.balance !== undefined && user.balance !== null) ? user.balance : 0} ₽</span>
              <span>{user.name} ({user.role})</span>
              <button onClick={onLogout} className="btn btn-primary">Выйти</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Вход</Link>
              <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Регистрация</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
