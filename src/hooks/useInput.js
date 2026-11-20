import { useCallback, useState } from 'react'

// Two-way binding sederhana untuk input form: [value, onChange, setValue].
export default function useInput(initialValue = '') {
  const [value, setValue] = useState(initialValue)
  const onChange = useCallback((event) => setValue(event.target.value), [])
  return [value, onChange, setValue]
}
