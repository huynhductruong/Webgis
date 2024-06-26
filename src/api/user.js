import { api } from 'boot/axios';

export const login = async (params) => {
  const response = await api.post('http://localhost:5000/users/login', params)
  return response.data
}

export const register = async (params) => {
  const response = await api.post('register', params)
  return response.data
}

export const loginGoogle = async (params) => {
  const response = await api.post('login-google', params)
  return response.data
}

export const updateUser = async (params) => {
  const response = await api.put(`users/${params.id}`, params);
  return response.data
}


export const find = async (params) => {
  const response = await api.get(`users/${params.id}`, params);
  return response
}

export const findByEmail = async (params) => {
  let response = {
    
    email: "123@gmail.com"
    , 
    name: "admin"
    , 
    role: "ADMIN"
    , 
    activate: "123"

  }
  return response
}

export const getAll = async () => {
  const response = await api.get('http://localhost:5000/users');
  return response.data
}

export const deleteUser = async (params) => {
  const response = await api.delete('users', params);
  return response
}


export const activateUser = async (params) => {
  const response = await api.put(`users/${params.id}`, params);
  return response.data
}
