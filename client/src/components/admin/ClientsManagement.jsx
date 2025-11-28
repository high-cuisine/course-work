import React, { useState, useEffect } from 'react'
import { api } from '../../utils/auth'

export default function ClientsManagement() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({ firstName: '', lastName: '', middleName: '' })

  useEffect(() => {
    loadClients()
  }, [search])

  const loadClients = async () => {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : ''
      const data = await api(`/clients${query}`)
      setClients(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingClient) {
        await api(`/clients/${editingClient.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
      } else {
        await api('/clients', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
      }
      setShowForm(false)
      setEditingClient(null)
      setFormData({ firstName: '', lastName: '', middleName: '' })
      loadClients()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setFormData({ firstName: client.firstName, lastName: client.lastName, middleName: client.middleName || '' })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить клиента?')) return
    try {
      await api(`/clients/${id}`, { method: 'DELETE' })
      loadClients()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Управление клиентами</h2>
        <button onClick={() => { setShowForm(true); setEditingClient(null); setFormData({ firstName: '', lastName: '', middleName: '' }) }} className="btn btn-primary">
          + Добавить клиента
        </button>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          className="input"
          placeholder="Поиск по ФИО..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>{editingClient ? 'Редактировать клиента' : 'Новый клиент'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Фамилия *</label>
              <input className="input" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Имя *</label>
              <input className="input" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Отчество</label>
              <input className="input" value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Сохранить</button>
              <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingClient(null) }}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Фамилия</th>
            <th>Имя</th>
            <th>Отчество</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client.id}>
              <td>{client.id}</td>
              <td>{client.lastName}</td>
              <td>{client.firstName}</td>
              <td>{client.middleName || '-'}</td>
              <td>
                <button onClick={() => handleEdit(client)} className="btn btn-primary" style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}>Редактировать</button>
                <button onClick={() => handleDelete(client.id)} className="btn btn-danger" style={{ fontSize: '12px', padding: '5px 10px' }}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
