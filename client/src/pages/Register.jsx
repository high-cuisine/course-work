import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setAuth } from '../utils/auth'

export default function Register({ onLogin }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await api('/users/register', {
        method: 'POST',
        body: JSON.stringify({ name, password, role }),
      })
      // Сохраняем токен сразу после получения
      if (data.token) {
        localStorage.setItem('token', data.token)
        // Теперь делаем запрос с токеном
        const userData = await api('/users/me')
        setAuth(data.token, userData)
        onLogin(userData)
        navigate('/')
      } else {
        throw new Error('Токен не получен')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <div className="card">
        <h2>Регистрация</h2>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя пользователя</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Роль</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="user">Пользователь</option>
              <option value="moderator">Модератор</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Зарегистрироваться
          </button>
        </form>
      </div>
    </div>
  )
}
