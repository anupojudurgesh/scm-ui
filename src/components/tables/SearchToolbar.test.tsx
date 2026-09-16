import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SearchToolbar } from './SearchToolbar'

describe('SearchToolbar Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders search input with default placeholder and empty value', () => {
    render(<SearchToolbar onSearch={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: /search\.\.\./i })
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('renders with custom placeholder and defaultValue', () => {
    render(
      <SearchToolbar
        onSearch={vi.fn()}
        placeholder="Filter subscribers..."
        defaultValue="98765"
      />
    )
    const input = screen.getByPlaceholderText('Filter subscribers...')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('98765')
  })

  it('debounces onSearch callback with default 300ms delay', () => {
    const onSearch = vi.fn()
    render(<SearchToolbar onSearch={onSearch} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'telecom' } })

    // Input updates immediately
    expect(input).toHaveValue('telecom')
    // Callback not called immediately
    expect(onSearch).not.toHaveBeenCalled()

    // 299ms elapsed - still not called
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(onSearch).not.toHaveBeenCalled()

    // 300ms reached - called with final term
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('telecom')
  })

  it('resets timer on rapid successive keystrokes and fires only once with the final term', () => {
    const onSearch = vi.fn()
    render(<SearchToolbar onSearch={onSearch} />)

    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: 'a' } })
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(onSearch).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'ab' } })
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(onSearch).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'abc' } })
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(onSearch).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('abc')
  })

  it('respects a custom debounceMs prop', () => {
    const onSearch = vi.fn()
    render(<SearchToolbar onSearch={onSearch} debounceMs={500} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'custom-delay' } })

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(onSearch).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('custom-delay')
  })

  it('clears search immediately when clear icon button is clicked', () => {
    const onSearch = vi.fn()
    render(<SearchToolbar onSearch={onSearch} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'query' } })

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    expect(clearButton).toBeInTheDocument()

    fireEvent.click(clearButton)

    expect(input).toHaveValue('')
    expect(onSearch).toHaveBeenCalledWith('')
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
  })

  it('resets query and invokes onReset when Reset button is clicked', () => {
    const onSearch = vi.fn()
    const onReset = vi.fn()
    render(<SearchToolbar onSearch={onSearch} onReset={onReset} />)

    const input = screen.getByRole('textbox')
    const resetButton = screen.getByRole('button', { name: /reset/i })

    // Initially disabled when input is empty
    expect(resetButton).toBeDisabled()

    fireEvent.change(input, { target: { value: 'active-search' } })
    expect(resetButton).not.toBeDisabled()

    fireEvent.click(resetButton)

    expect(input).toHaveValue('')
    expect(onSearch).toHaveBeenCalledWith('')
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('triggers immediate onSearch when pressing Enter key', () => {
    const onSearch = vi.fn()
    render(<SearchToolbar onSearch={onSearch} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'instant-submit' } })

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('instant-submit')

    // Advancing timers should not cause duplicate call
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('clears query when pressing Escape key', () => {
    const onSearch = vi.fn()
    render(<SearchToolbar onSearch={onSearch} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'discard-me' } })

    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })

    expect(input).toHaveValue('')
    expect(onSearch).toHaveBeenCalledWith('')
  })

  it('renders generic children slot for filter dropdowns', () => {
    render(
      <SearchToolbar onSearch={vi.fn()}>
        <select data-testid="status-filter">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
        </select>
        <button type="button" data-testid="export-btn">
          Export
        </button>
      </SearchToolbar>
    )

    expect(screen.getByTestId('status-filter')).toBeInTheDocument()
    expect(screen.getByTestId('export-btn')).toBeInTheDocument()
    expect(screen.getByTestId('search-toolbar-filters')).toBeInTheDocument()
  })

  it('disables input and buttons when disabled prop is true', () => {
    render(
      <SearchToolbar
        onSearch={vi.fn()}
        defaultValue="frozen"
        disabled={true}
      />
    )

    const input = screen.getByRole('textbox')
    const clearBtn = screen.getByRole('button', { name: /clear search/i })
    const resetBtn = screen.getByRole('button', { name: /reset/i })

    expect(input).toBeDisabled()
    expect(clearBtn).toBeDisabled()
    expect(resetBtn).toBeDisabled()
  })

  it('supports controlled value prop updates', () => {
    const { rerender } = render(
      <SearchToolbar onSearch={vi.fn()} value="controlled-1" />
    )
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('controlled-1')

    rerender(<SearchToolbar onSearch={vi.fn()} value="controlled-2" />)
    expect(input).toHaveValue('controlled-2')
  })
})
