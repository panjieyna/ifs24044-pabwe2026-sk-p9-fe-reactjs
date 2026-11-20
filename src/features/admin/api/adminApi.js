import { fetchData } from '../../../helpers/apiHelper'

export async function getUsers() {
  return (await fetchData('/admin/users')).data
}

export async function getAllPosts() {
  return (await fetchData('/admin/posts')).data
}

export async function getUserPosts(userId) {
  return (await fetchData(`/admin/users/${userId}/posts`)).data
}
