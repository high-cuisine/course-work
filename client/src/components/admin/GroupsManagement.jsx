import React, { useState, useEffect } from 'react'
import { api } from '../../utils/auth'

export default function GroupsManagement() {
  const [groups, setGroups] = useState([])
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [formData, setFormData] = useState({
    tourId: '',
    startDate: '',
    capacity: '',
    fixedCost: '',
    variableCostPerPerson: '',
  })

  useEffect(() => {
    loadGroups()
    loadTours()
  }, [])

  const loadGroups = async () => {
    try {
      const data = await api('/groups')
      setGroups(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadTours = async () => {
    try {
      const data = await api('/tours')
      setTours(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        tourId: parseInt(formData.tourId),
        capacity: parseInt(formData.capacity),
        fixedCost: parseInt(formData.fixedCost) || 0,
        variableCostPerPerson: parseInt(formData.variableCostPerPerson) || 0,
      }
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
      setShowForm(false)
      setEditingGroup(null)
      setFormData({ tourId: '', startDate: '', capacity: '', fixedCost: '', variableCostPerPerson: '' })
      loadGroups()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEdit = (group) => {
    setEditingGroup(group)
    setFormData({
      tourId: group.tourId,
      startDate: new Date(group.startDate).toISOString().slice(0, 16),
      capacity: group.capacity,
      fixedCost: group.fixedCost || '',
      variableCostPerPerson: group.variableCostPerPerson || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить группу?')) return
    try {
      await api(`/groups/${id}`, { method: 'DELETE' })
      loadGroups()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Управление группами</h2>
        <button onClick={() => { setShowForm(true); setEditingGroup(null); setFormData({ tourId: '', startDate: '', capacity: '', fixedCost: '', variableCostPerPerson: '' }) }} className="btn btn-primary">
          + Добавить группу
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>{editingGroup ? 'Редактировать группу' : 'Новая группа'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Тур *</label>
              <select className="input" value={formData.tourId} onChange={(e) => setFormData({ ...formData, tourId: e.target.value })} required>
                <option value="">Выберите тур</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Дата начала *</label>
              <input type="datetime-local" className="input" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Вместимость *</label>
              <input type="number" className="input" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Фиксированные расходы</label>
              <input type="number" className="input" value={formData.fixedCost} onChange={(e) => setFormData({ ...formData, fixedCost: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Переменные расходы на человека</label>
              <input type="number" className="input" value={formData.variableCostPerPerson} onChange={(e) => setFormData({ ...formData, variableCostPerPerson: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Сохранить</button>
              <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingGroup(null) }}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Тур</th>
            <th>Дата начала</th>
            <th>Вместимость</th>
            <th>Занято</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(group => (
            <tr key={group.id}>
              <td>{group.id}</td>
              <td>{group.tourName}</td>
              <td>{new Date(group.startDate).toLocaleDateString('ru-RU')}</td>
              <td>{group.capacity}</td>
              <td>{group.taken || 0}/{group.capacity}</td>
              <td>
                <button onClick={() => handleEdit(group)} className="btn btn-primary" style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}>Редактировать</button>
                <button onClick={() => handleDelete(group.id)} className="btn btn-danger" style={{ fontSize: '12px', padding: '5px 10px' }}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
