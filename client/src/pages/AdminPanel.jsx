import React, { useState } from 'react'
import ToursManagement from '../components/admin/ToursManagement'
import RoutesManagement from '../components/admin/RoutesManagement'
import GroupsManagement from '../components/admin/GroupsManagement'
import OrdersManagement from '../components/admin/OrdersManagement'
import UsersManagement from '../components/admin/UsersManagement'

export default function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState('tours')

  const tabs = [
    { id: 'tours', name: 'Туры', component: ToursManagement },
    { id: 'routes', name: 'Маршруты', component: RoutesManagement },
    { id: 'groups', name: 'Группы', component: GroupsManagement },
    { id: 'orders', name: 'Заказы', component: OrdersManagement },
  ]

  if (user.role === 'admin') {
    tabs.push({ id: 'users', name: 'Пользователи', component: UsersManagement })
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div>
      <h1>Панель управления</h1>
      <div style={{ borderBottom: '2px solid #ddd', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn"
              style={{
                backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#007bff',
                border: '1px solid #007bff',
                borderRadius: '4px 4px 0 0',
                marginBottom: '-2px'
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
      {ActiveComponent && <ActiveComponent user={user} />}
    </div>
  )
}
