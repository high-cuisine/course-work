import React, { useState, useEffect } from 'react'
import { api } from '../../utils/auth'

export default function UsersManagement({ user }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({ role: '', balance: '', password: '' })
  const [balanceAmount, setBalanceAmount] = useState({ userId: null, amount: '' })
  const [expandedUserId, setExpandedUserId] = useState(null)
  const [userOrders, setUserOrders] = useState({})
  const [ordersLoading, setOrdersLoading] = useState({})

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await api('/users')
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const payload = {}
      if (formData.role) payload.role = formData.role
      if (formData.balance !== '') payload.balance = parseInt(formData.balance)
      if (formData.password) payload.password = formData.password

      await api(`/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setEditingUser(null)
      setFormData({ role: '', balance: '', password: '' })
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUpdateBalance = async (userId) => {
    try {
      await api(`/users/${userId}/balance`, {
        method: 'PUT',
        body: JSON.stringify({ amount: parseInt(balanceAmount.amount) }),
      })
      setBalanceAmount({ userId: null, amount: '' })
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить пользователя?')) return
    try {
      await api(`/users/${id}`, { method: 'DELETE' })
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  const toggleUserOrders = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
      return
    }
    setExpandedUserId(userId)
    if (!userOrders[userId]) {
      setOrdersLoading((prev) => ({ ...prev, [userId]: true }))
      try {
        const data = await api(`/users/${userId}/orders`)
        setUserOrders((prev) => ({ ...prev, [userId]: data }))
      } catch (err) {
        alert(err.message)
        setUserOrders((prev) => ({ ...prev, [userId]: [] }))
      } finally {
        setOrdersLoading((prev) => ({ ...prev, [userId]: false }))
      }
    }
  }

  const statusLabel = (s) => {
    if (s === 'CONFIRMED') return 'Подтвержден'
    if (s === 'CANCELLED') return 'Отменен'
    if (s === 'PENDING') return 'Ожидает'
    return s
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div>
      <h2>Управление пользователями</h2>
      {editingUser && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Редактировать пользователя: {editingUser.name}</h3>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Роль</label>
              <select className="input" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="">Не изменять</option>
                <option value="user">Пользователь</option>
                <option value="moderator">Модератор</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div className="form-group">
              <label>Баланс (установить конкретное значение)</label>
              <input type="number" className="input" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Новый пароль</label>
              <input type="password" className="input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Сохранить</button>
              <button type="button" className="btn" onClick={() => { setEditingUser(null); setFormData({ role: '', balance: '', password: '' }) }}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Роль</th>
            <th>Баланс</th>
            <th>Дата регистрации</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <React.Fragment key={u.id}>
              <tr>
                <td>{u.id}</td>
                <td>
                  {u.name}
                  {u.isSuperAdmin && (
                    <span style={{ marginLeft: '6px', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#ffc107', color: '#222' }}>
                      super admin
                    </span>
                  )}
                </td>
                <td>{u.role}</td>
                <td>
                  {u.balance} ₽
                  {!u.isSuperAdmin && (
                    balanceAmount.userId === u.id ? (
                      <div style={{ marginTop: '5px', display: 'flex', gap: '5px' }}>
                        <input
                          type="number"
                          placeholder="Изменение баланса"
                          value={balanceAmount.amount}
                          onChange={(e) => setBalanceAmount({ userId: u.id, amount: e.target.value })}
                          style={{ width: '150px', padding: '5px', fontSize: '12px' }}
                        />
                        <button onClick={() => handleUpdateBalance(u.id)} className="btn btn-success" style={{ fontSize: '12px', padding: '5px 10px' }}>Применить</button>
                        <button onClick={() => setBalanceAmount({ userId: null, amount: '' })} className="btn" style={{ fontSize: '12px', padding: '5px 10px' }}>Отмена</button>
                      </div>
                    ) : (
                      <button onClick={() => setBalanceAmount({ userId: u.id, amount: '' })} className="btn btn-primary" style={{ marginLeft: '10px', fontSize: '12px', padding: '5px 10px' }}>Изменить баланс</button>
                    )
                  )}
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString('ru-RU')}</td>
                <td>
                  <button
                    onClick={() => toggleUserOrders(u.id)}
                    className="btn"
                    style={{
                      marginRight: '5px',
                      fontSize: '12px',
                      padding: '5px 10px',
                      backgroundColor: expandedUserId === u.id ? '#6c757d' : '#17a2b8',
                      color: 'white',
                    }}
                  >
                    {expandedUserId === u.id ? 'Скрыть туры' : 'Туры'}
                  </button>
                  {!u.isSuperAdmin && (
                    <>
                      <button
                        onClick={() => { setEditingUser(u); setFormData({ role: u.role, balance: u.balance, password: '' }) }}
                        className="btn btn-primary"
                        style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}
                      >
                        Редактировать
                      </button>
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="btn btn-danger"
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                        >
                          Удалить
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
              {expandedUserId === u.id && (
                <tr>
                  <td colSpan={6} style={{ background: '#f8f9fa', padding: '12px' }}>
                    {ordersLoading[u.id] ? (
                      <div>Загрузка туров...</div>
                    ) : (userOrders[u.id] && userOrders[u.id].length > 0) ? (
                      <table className="table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Тур</th>
                            <th>Место</th>
                            <th>Отель</th>
                            <th>Сумма</th>
                            <th>Статус</th>
                            <th>Дата заказа</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userOrders[u.id].map((o) => (
                            <tr key={o.id}>
                              <td>{o.id}</td>
                              <td>{o.tourName}</td>
                              <td>{o.tourPlace}</td>
                              <td>{o.tourHotel}</td>
                              <td>{o.amount} ₽</td>
                              <td>{statusLabel(o.status)}</td>
                              <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('ru-RU') : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div>У пользователя нет заказов</div>
                    )}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
