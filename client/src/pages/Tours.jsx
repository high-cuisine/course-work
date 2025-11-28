import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/auth'

export default function Tours({ user }) {
  const [allTours, setAllTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    country: '',
    minAmount: '',
    maxAmount: '',
    hotelStars: '',
    transport: '',
    meals: '',
  })

  // Загружаем все туры один раз при монтировании
  useEffect(() => {
    loadTours()
  }, [])

  const loadTours = async () => {
    setLoading(true)
    try {
      // Загружаем все туры без фильтров
      const data = await api('/tours')
      setAllTours(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Фильтрация и поиск на клиенте
  const filteredTours = useMemo(() => {
    return allTours.filter(tour => {
      // Поиск по названию, месту, стране, отелю
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          tour.name?.toLowerCase().includes(query) ||
          tour.place?.toLowerCase().includes(query) ||
          tour.country?.toLowerCase().includes(query) ||
          tour.hotel?.toLowerCase().includes(query) ||
          tour.description?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Фильтр по стране
      if (filters.country && tour.country?.toLowerCase() !== filters.country.toLowerCase()) {
        return false
      }

      // Фильтр по минимальной цене
      if (filters.minAmount && tour.amount < Number(filters.minAmount)) {
        return false
      }

      // Фильтр по максимальной цене
      if (filters.maxAmount && tour.amount > Number(filters.maxAmount)) {
        return false
      }

      // Фильтр по звездам отеля
      if (filters.hotelStars && tour.hotelStars !== Number(filters.hotelStars)) {
        return false
      }

      // Фильтр по транспорту
      if (filters.transport && tour.transport?.toLowerCase() !== filters.transport.toLowerCase()) {
        return false
      }

      // Фильтр по питанию
      if (filters.meals && tour.meals?.toLowerCase() !== filters.meals.toLowerCase()) {
        return false
      }

      return true
    })
  }, [allTours, searchQuery, filters])

  if (loading) return <div>Загрузка...</div>

  return (
    <div>
      <h1>Доступные туры</h1>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Поиск и фильтры</h3>
        
        {/* Поиск по тексту */}
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            className="input"
            placeholder="Поиск по названию, месту, стране, отелю..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {/* Фильтры */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <input
            type="text"
            className="input"
            placeholder="Страна"
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          />
          <input
            type="number"
            className="input"
            placeholder="Мин. цена"
            value={filters.minAmount}
            onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
          />
          <input
            type="number"
            className="input"
            placeholder="Макс. цена"
            value={filters.maxAmount}
            onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
          />
          <input
            type="number"
            className="input"
            placeholder="Звезды отеля"
            value={filters.hotelStars}
            onChange={(e) => setFilters({ ...filters, hotelStars: e.target.value })}
          />
          <input
            type="text"
            className="input"
            placeholder="Транспорт"
            value={filters.transport}
            onChange={(e) => setFilters({ ...filters, transport: e.target.value })}
          />
          <input
            type="text"
            className="input"
            placeholder="Питание"
            value={filters.meals}
            onChange={(e) => setFilters({ ...filters, meals: e.target.value })}
          />
        </div>

        {/* Кнопка сброса фильтров */}
        <div style={{ marginTop: '10px' }}>
          <button
            className="btn"
            onClick={() => {
              setSearchQuery('')
              setFilters({
                country: '',
                minAmount: '',
                maxAmount: '',
                hotelStars: '',
                transport: '',
                meals: '',
              })
            }}
          >
            Сбросить фильтры
          </button>
          <span style={{ marginLeft: '10px', color: '#666' }}>
            Найдено: {filteredTours.length} из {allTours.length}
          </span>
        </div>
      </div>

      <div>
        {filteredTours.map((tour) => (
          <div key={tour.id} className="card">
            <h2>{tour.name}</h2>
            <p><strong>Место:</strong> {tour.place} {tour.country && `(${tour.country})`}</p>
            <p><strong>Отель:</strong> {tour.hotel} {tour.hotelStars && `⭐ ${tour.hotelStars}`}</p>
            <p><strong>Цена:</strong> {tour.amount} ₽</p>
            {tour.transport && <p><strong>Транспорт:</strong> {tour.transport}</p>}
            {tour.meals && <p><strong>Питание:</strong> {tour.meals}</p>}
            {tour.description && <p>{tour.description}</p>}
            <Link to={`/tours/${tour.id}`} className="btn btn-primary">
              Подробнее
            </Link>
          </div>
        ))}
        {filteredTours.length === 0 && !loading && (
          <div className="card">
            <p>Туры не найдены. Попробуйте изменить параметры поиска или фильтры.</p>
          </div>
        )}
      </div>
    </div>
  )
}
