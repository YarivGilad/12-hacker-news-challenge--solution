import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
// import userEvent from '@testing-library/user-event'
import App from './App'

describe('Testing the App renders correctly', () => {
  test('should render correctly', () => {
    render(<App />)
    expect(screen.getByText('Hacker News Challenge')).toBeInTheDocument()
  })
})