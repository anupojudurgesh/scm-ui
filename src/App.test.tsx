import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App.tsx'

describe('App Component', () => {
  it('renders SCM Portal header and core modules', () => {
    render(<App />)
    expect(screen.getByText('SCM Portal')).toBeInTheDocument()
    expect(screen.getByText('Enterprise Administration')).toBeInTheDocument()
    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('Dealer Hierarchy')).toBeInTheDocument()
    expect(screen.getByText('Plans & Number Series')).toBeInTheDocument()
    expect(screen.getByText('Commission Rules')).toBeInTheDocument()
  })

  it('displays API Connected status badge', () => {
    render(<App />)
    expect(screen.getByText('API Connected')).toBeInTheDocument()
  })
})
