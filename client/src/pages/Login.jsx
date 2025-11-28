import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setAuth } from '../utils/auth'

export default function Login({ onLogin }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await api('/users/login', {
        method: 'POST',
        body: JSON.stringify({ name, password }),
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
        <h2>Вход</h2>
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
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Войти
          </button>
        </form>
      </div>
    </div>
  )
}
