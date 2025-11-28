import React, { useState, useEffect } from 'react'
import { api } from '../../utils/auth'

export default function ToursManagement() {
  const [tours, setTours] = useState([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTour, setEditingTour] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    hotel: '',
    place: '',
    date: '',
    routeId: '',
    country: '',
    description: '',
    hotelStars: '',
    transport: '',
    meals: '',
    insuranceIncluded: false,
    guideIncluded: false,
    maxGroupSize: '',
  })

  useEffect(() => {
    loadTours()
    loadRoutes()
  }, [])

  const loadTours = async () => {
    try {
      const data = await api('/tours')
      setTours(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadRoutes = async () => {
    try {
      const data = await api('/routes')
      setRoutes(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...formData, amount: parseInt(formData.amount), routeId: parseInt(formData.routeId) }
      if (formData.hotelStars) payload.hotelStars = parseInt(formData.hotelStars)
      if (formData.maxGroupSize) payload.maxGroupSize = parseInt(formData.maxGroupSize)
      if (editingTour) {
        await api(`/tours/${editingTour.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await api('/tours', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      setShowForm(false)
      setEditingTour(null)
      resetForm()
      loadTours()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEdit = (tour) => {
    setEditingTour(tour)
    setFormData({
      name: tour.name || '',
      amount: tour.amount || '',
      hotel: tour.hotel || '',
      place: tour.place || '',
      date: tour.date ? new Date(tour.date).toISOString().slice(0, 16) : '',
      routeId: tour.routeId || '',
      country: tour.country || '',
      description: tour.description || '',
      hotelStars: tour.hotelStars || '',
      transport: tour.transport || '',
      meals: tour.meals || '',
      insuranceIncluded: tour.insuranceIncluded || false,
      guideIncluded: tour.guideIncluded || false,
      maxGroupSize: tour.maxGroupSize || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить тур?')) return
    try {
      await api(`/tours/${id}`, { method: 'DELETE' })
      loadTours()
    } catch (err) {
      alert(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      hotel: '',
      place: '',
      date: '',
      routeId: '',
      country: '',
      description: '',
      hotelStars: '',
      transport: '',
      meals: '',
      insuranceIncluded: false,
      guideIncluded: false,
      maxGroupSize: '',
    })
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Управление турами</h2>
        <button onClick={() => { setShowForm(true); resetForm(); setEditingTour(null) }} className="btn btn-primary">
          + Добавить тур
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>{editingTour ? 'Редактировать тур' : 'Новый тур'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div className="form-group">
                <label>Название *</label>
                <input className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Цена *</label>
                <input type="number" className="input" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Отель *</label>
                <input className="input" value={formData.hotel} onChange={(e) => setFormData({ ...formData, hotel: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Место *</label>
                <input className="input" value={formData.place} onChange={(e) => setFormData({ ...formData, place: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Дата *</label>
                <input type="datetime-local" className="input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Маршрут *</label>
                <select className="input" value={formData.routeId} onChange={(e) => setFormData({ ...formData, routeId: e.target.value })} required>
                  <option value="">Выберите маршрут</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.place}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Страна</label>
                <input className="input" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Звезды отеля</label>
                <input type="number" className="input" value={formData.hotelStars} onChange={(e) => setFormData({ ...formData, hotelStars: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Транспорт</label>
                <input className="input" value={formData.transport} onChange={(e) => setFormData({ ...formData, transport: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Питание</label>
                <input className="input" value={formData.meals} onChange={(e) => setFormData({ ...formData, meals: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea className="input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" />
              </div>
              <div className="form-group">
                <label>Макс. размер группы</label>
                <input type="number" className="input" value={formData.maxGroupSize} onChange={(e) => setFormData({ ...formData, maxGroupSize: e.target.value })} />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={formData.insuranceIncluded} onChange={(e) => setFormData({ ...formData, insuranceIncluded: e.target.checked })} />
                  Страховка включена
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={formData.guideIncluded} onChange={(e) => setFormData({ ...formData, guideIncluded: e.target.checked })} />
                  Гид включен
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button type="submit" className="btn btn-primary">Сохранить</button>
              <button type="button" className="btn" onClick={() => { setShowForm(false); resetForm(); setEditingTour(null) }}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Место</th>
            <th>Отель</th>
            <th>Цена</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {tours.map(tour => (
            <tr key={tour.id}>
              <td>{tour.id}</td>
              <td>{tour.name}</td>
              <td>{tour.place}</td>
              <td>{tour.hotel}</td>
              <td>{tour.amount} ₽</td>
              <td>
                <button onClick={() => handleEdit(tour)} className="btn btn-primary" style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}>Редактировать</button>
                <button onClick={() => handleDelete(tour.id)} className="btn btn-danger" style={{ fontSize: '12px', padding: '5px 10px' }}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
