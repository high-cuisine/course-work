import React, { useState, useEffect } from 'react'
import { api } from '../../utils/auth'

export default function RoutesManagement() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [formData, setFormData] = useState({ place: '', duration: '' })

  useEffect(() => {
    loadRoutes()
  }, [])

  const loadRoutes = async () => {
    try {
      const data = await api('/routes')
      setRoutes(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRoute) {
        await api(`/routes/${editingRoute.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...formData, duration: parseInt(formData.duration) }),
        })
      } else {
        await api('/routes', {
          method: 'POST',
          body: JSON.stringify({ ...formData, duration: parseInt(formData.duration) }),
        })
      }
      setShowForm(false)
      setEditingRoute(null)
      setFormData({ place: '', duration: '' })
      loadRoutes()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEdit = (route) => {
    setEditingRoute(route)
    setFormData({ place: route.place, duration: route.duration })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить маршрут?')) return
    try {
      await api(`/routes/${id}`, { method: 'DELETE' })
      loadRoutes()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Управление маршрутами</h2>
        <button onClick={() => { setShowForm(true); setEditingRoute(null); setFormData({ place: '', duration: '' }) }} className="btn btn-primary">
          + Добавить маршрут
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>{editingRoute ? 'Редактировать маршрут' : 'Новый маршрут'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Место *</label>
              <input className="input" value={formData.place} onChange={(e) => setFormData({ ...formData, place: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Длительность (дни) *</label>
              <input type="number" className="input" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Сохранить</button>
              <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingRoute(null) }}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Место</th>
            <th>Длительность</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {routes.map(route => (
            <tr key={route.id}>
              <td>{route.id}</td>
              <td>{route.place}</td>
              <td>{route.duration} дней</td>
              <td>
                <button onClick={() => handleEdit(route)} className="btn btn-primary" style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}>Редактировать</button>
                <button onClick={() => handleDelete(route.id)} className="btn btn-danger" style={{ fontSize: '12px', padding: '5px 10px' }}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
