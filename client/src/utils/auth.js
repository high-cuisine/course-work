export const getToken = () => {
  const token = localStorage.getItem('token')
  // Убеждаемся, что токен - это строка, а не объект
  return token && typeof token === 'string' ? token.trim() : null
}

export const getUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export const setAuth = (token, user) => {
  // Убеждаемся, что токен - это строка
  const tokenStr = typeof token === 'string' ? token : String(token)
  localStorage.setItem('token', tokenStr)
  localStorage.setItem('user', JSON.stringify(user))
}

export const api = (url, options = {}) => {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return fetch(`/api${url}`, {
    ...options,
    headers,
  }).then(async (res) => {
    let data
    const text = await res.text()
    try {
      data = text ? JSON.parse(text) : {}
    } catch (e) {
      data = { message: text || 'Ошибка запроса' }
    }
    
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Ошибка запроса')
    }
    return data
  })
}
