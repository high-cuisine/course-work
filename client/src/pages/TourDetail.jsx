import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/auth'

export default function TourDetail({ user, onUserUpdate }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tour, setTour] = useState(null)
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadTour()
    loadGroups()
  }, [id])

  const loadTour = async () => {
    try {
      const data = await api(`/tours/${id}`)
      setTour(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      const data = await api(`/groups?tourId=${id}`)
      setGroups(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleBook = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setError('')
    setSuccess('')
    try {
      await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          tourId: parseInt(id),
          groupId: selectedGroup ? parseInt(selectedGroup) : undefined,
        }),
      })
      setSuccess('Тур успешно забронирован!')
      loadGroups()
      if (onUserUpdate) onUserUpdate()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div>Загрузка...</div>
  if (!tour) return <div>Тур не найден</div>

  return (
    <div>
      <h1>{tour.name}</h1>
      <div className="card">
        <p><strong>Место:</strong> {tour.place} {tour.country && `(${tour.country})`}</p>
        <p><strong>Отель:</strong> {tour.hotel} {tour.hotelStars && `⭐ ${tour.hotelStars}`}</p>
        <p><strong>Цена:</strong> {tour.amount} ₽</p>
        {tour.transport && <p><strong>Транспорт:</strong> {tour.transport}</p>}
        {tour.meals && <p><strong>Питание:</strong> {tour.meals}</p>}
        {tour.description && <p>{tour.description}</p>}
        {tour.insuranceIncluded && <p>✅ Страховка включена</p>}
        {tour.guideIncluded && <p>✅ Гид включен</p>}
      </div>

      {user && (
        <div className="card">
          <h3>Бронирование</h3>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

          {groups.length > 0 && (
            <div className="form-group">
              <label>Выберите группу (дата заезда)</label>
              <select
                className="input"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="">Без привязки к группе</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {new Date(group.startDate).toLocaleDateString('ru-RU')}
                    {' '} (Свободно: {group.capacity - (group.taken || 0)}/{group.capacity})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button onClick={handleBook} className="btn btn-primary">
            Забронировать за {tour.amount} ₽
          </button>
        </div>
      )}

      {!user && (
        <div className="card">
          <p>Для бронирования необходимо <a href="/login">войти</a></p>
        </div>
      )}
    </div>
  )
}
