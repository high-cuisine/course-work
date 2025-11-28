import React, { useState, useEffect } from 'react'
import { api } from '../utils/auth'

export default function Orders({ user, onUserUpdate }) {
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

  const handleCancel = async (orderId) => {
    if (!confirm('Вы уверены, что хотите отменить заказ?')) return

    try {
      await api(`/orders/${orderId}/cancel`, {
        method: 'POST',
      })
      loadOrders()
      if (onUserUpdate) onUserUpdate()
      alert('Заказ отменен, средства возвращены на баланс')
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div>
      <h1>Мои заказы</h1>
      {orders.length === 0 ? (
        <p>У вас нет заказов</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
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
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.tourName}</td>
                <td>{order.tourPlace}</td>
                <td>{order.tourHotel}</td>
                <td>{order.amount} ₽</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: order.status === 'CONFIRMED' ? '#28a745' : 
                                   order.status === 'CANCELLED' ? '#dc3545' : '#ffc107',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {order.status === 'CONFIRMED' ? 'Подтвержден' : 
                     order.status === 'CANCELLED' ? 'Отменен' : 'Ожидает'}
                  </span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                <td>
                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="btn btn-danger"
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      Отменить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
