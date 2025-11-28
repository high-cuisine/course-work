import React, { useState, useEffect } from 'react'
import { api } from '../../utils/auth'

export default function OrdersManagement() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const data = await api('/orders')
      setOrders(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, status) => {
    try {
      await api(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      loadOrders()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (orderId) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) {
      return
    }
    try {
      await api(`/orders/${orderId}`, {
        method: 'DELETE',
      })
      loadOrders()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div>
      <h2>Все заказы</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Пользователь</th>
            <th>Тур</th>
            <th>Место</th>
            <th>Отель</th>
            <th>Сумма</th>
            <th>Статус</th>
            <th>Дата создания</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.userName}</td>
              <td>{order.tourName}</td>
              <td>{order.tourPlace}</td>
              <td>{order.tourHotel}</td>
              <td>{order.amount} ₽</td>
              <td>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  style={{ padding: '5px', borderRadius: '4px' }}
                >
                  <option value="PENDING">Ожидает</option>
                  <option value="CONFIRMED">Подтвержден</option>
                  <option value="CANCELLED">Отменен</option>
                </select>
              </td>
              <td>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {order.groupStartDate && (
                    <span style={{ fontSize: '12px' }}>
                      Группа: {new Date(order.groupStartDate).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                  <button
                    className="btn"
                    style={{ 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      padding: '5px 10px',
                      fontSize: '12px'
                    }}
                    onClick={() => handleDelete(order.id)}
                  >
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
