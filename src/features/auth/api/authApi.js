import { fetchData } from '../../../helpers/apiHelper'

export async function login({ username, password }) {
  return (await fetchData('/auth/login', { method: 'POST', body: { username, password }, auth: false })).data
}

export async function register({ name, username, email, password }) {
  return (await fetchData('/auth/register', { method: 'POST', body: { name, username, email, password }, auth: false })).data
}

export async function logout() {
  try {
    await fetchData('/auth/logout', { method: 'POST' })
  } catch {
    // Token JWT bersifat stateless; sesi lokal tetap dihapus walau server tidak terjangkau.
  }
}

export async function getProfile() {
  return (await fetchData('/auth/profile')).data
}

export async function updateProfile(payload) {
  return (await fetchData('/auth/profile', { method: 'PUT', body: payload })).data
}
