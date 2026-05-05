import React, { useEffect, useState } from 'react'
import { api } from '../../utils/auth'

export default function GroupsManagement() {
  const [groups, setGroups] = useState([])
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingGroup, setEditingGroup] = useState(null)
  const [formData, setFormData] = useState({
    tourId: '',
    startDate: '',
    capacity: '',
    fixedCost: '',
    variableCostPerPerson: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [groupsData, toursData] = await Promise.all([api('/groups'), api('/tours')])
      setGroups(groupsData)
      setTours(toursData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingGroup(null)
    setFormData({
      tourId: '',
      startDate: '',
      capacity: '',
      fixedCost: '',
      variableCostPerPerson: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      tourId: parseInt(formData.tourId),
      startDate: formData.startDate,
      capacity: parseInt(formData.capacity),
      fixedCost: parseInt(formData.fixedCost || 0),
      variableCostPerPerson: parseInt(formData.variableCostPerPerson || 0),
    }

    try {
      if (editingGroup) {
        await api(`/groups/${editingGroup.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await api('/groups', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      resetForm()
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const startEdit = (group) => {
    setEditingGroup(group)
    const dateValue = group.startDate ? new Date(group.startDate).toISOString().slice(0, 16) : ''
    setFormData({
      tourId: String(group.tourId ?? ''),
      startDate: dateValue,
      capacity: String(group.capacity ?? ''),
      fixedCost: String(group.fixedCost ?? 0),
      variableCostPerPerson: String(group.variableCostPerPerson ?? 0),
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить группу?')) return
    try {
      await api(`/groups/${id}`, { method: 'DELETE' })
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div>
      <h2>Управление группами</h2>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>{editingGroup ? 'Редактировать группу' : 'Добавить группу'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Тур</label>
            <select
              className="input"
              value={formData.tourId}
              onChange={(e) => setFormData({ ...formData, tourId: e.target.value })}
              required
            >
              <option value="">Выберите тур</option>
              {tours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Дата заезда</label>
            <input
              type="datetime-local"
              className="input"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Вместимость</label>
            <input
              type="number"
              className="input"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Постоянные затраты</label>
            <input
              type="number"
              className="input"
              value={formData.fixedCost}
              onChange={(e) => setFormData({ ...formData, fixedCost: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Переменные затраты на человека</label>
            <input
              type="number"
              className="input"
              value={formData.variableCostPerPerson}
              onChange={(e) => setFormData({ ...formData, variableCostPerPerson: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary">
              {editingGroup ? 'Сохранить' : 'Добавить'}
            </button>
            {editingGroup && (
              <button type="button" className="btn" onClick={resetForm}>
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Тур</th>
            <th>Дата заезда</th>
            <th>Вместимость</th>
            <th>Занято</th>
            <th>Постоянные затраты</th>
            <th>Перем. затраты/чел</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.id}>
              <td>{group.id}</td>
              <td>{group.tourName}</td>
              <td>{group.startDate ? new Date(group.startDate).toLocaleString('ru-RU') : '—'}</td>
              <td>{group.capacity}</td>
              <td>{group.taken || 0}</td>
              <td>{group.fixedCost || 0} ₽</td>
              <td>{group.variableCostPerPerson || 0} ₽</td>
              <td>
                <button
                  onClick={() => startEdit(group)}
                  className="btn btn-primary"
                  style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="btn btn-danger"
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
