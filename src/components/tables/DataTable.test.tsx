import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable, type DataTableColumn } from './DataTable'

// Sample row interface demonstrating type-safety without feature coupling
interface UserRow {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
}

const mockColumns: DataTableColumn<UserRow>[] = [
  {
    id: 'id',
    header: 'User ID',
    accessor: 'id',
  },
  {
    id: 'name',
    header: 'Full Name',
    accessor: (row) => row.name,
  },
  {
    id: 'role',
    header: 'Role',
    accessor: 'role',
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <span data-testid={`status-${row.id}`}>
        {row.status.toUpperCase()}
      </span>
    ),
  },
]

const mockData: UserRow[] = [
  { id: 'USR-01', name: 'Alice Smith', role: 'Administrator', status: 'active' },
  { id: 'USR-02', name: 'Bob Jones', role: 'Support Agent', status: 'inactive' },
  { id: 'USR-03', name: 'Charlie Brown', role: 'Dealer Manager', status: 'active' },
]

describe('DataTable Component', () => {
  it('loading state renders skeletons', () => {
    render(
      <DataTable<UserRow>
        columns={mockColumns}
        data={[]}
        loading={true}
        loadingRowsCount={4}
      />
    )

    // Table header is rendered
    expect(screen.getByText('User ID')).toBeInTheDocument()
    expect(screen.getByText('Full Name')).toBeInTheDocument()

    // Skeletons are rendered for loading state
    const skeletonRows = screen.getAllByTestId('data-table-skeleton-row')
    expect(skeletonRows).toHaveLength(4)

    const skeletonItems = screen.getAllByTestId('table-skeleton-item')
    // 4 rows * 4 columns = 16 skeleton items
    expect(skeletonItems).toHaveLength(16)
  })

  it('empty state renders when data is []', () => {
    render(
      <DataTable<UserRow>
        columns={mockColumns}
        data={[]}
        loading={false}
      />
    )

    expect(screen.getByTestId('data-table-empty-state')).toBeInTheDocument()
    expect(screen.getByText('No results found.')).toBeInTheDocument()
    expect(
      screen.getByText('There are no records to display at this time.')
    ).toBeInTheDocument()
  })

  it('renders custom empty message when provided', () => {
    render(
      <DataTable<UserRow>
        columns={mockColumns}
        data={[]}
        emptyMessage="No dealers available for this circle."
      />
    )

    expect(screen.getByText('No dealers available for this circle.')).toBeInTheDocument()
  })

  it('error state renders and calls onRetry when clicked', () => {
    const onRetryMock = vi.fn()

    render(
      <DataTable<UserRow>
        columns={mockColumns}
        data={[]}
        error="Network error while fetching table data."
        onRetry={onRetryMock}
      />
    )

    // Error container & message
    expect(screen.getByTestId('data-table-error-state')).toBeInTheDocument()
    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    expect(
      screen.getByText('Network error while fetching table data.')
    ).toBeInTheDocument()

    // Retry button is present and triggers callback
    const retryBtn = screen.getByTestId('data-table-retry-btn')
    expect(retryBtn).toBeInTheDocument()

    fireEvent.click(retryBtn)
    expect(onRetryMock).toHaveBeenCalledTimes(1)
  })

  it('renders Error instance message in error state', () => {
    render(
      <DataTable<UserRow>
        columns={mockColumns}
        data={[]}
        error={new Error('Database query timed out')}
      />
    )

    expect(screen.getByText('Database query timed out')).toBeInTheDocument()
  })

  it('populated state renders the right number of rows', () => {
    render(
      <DataTable<UserRow>
        columns={mockColumns}
        data={mockData}
      />
    )

    // Check rows count
    const rows = screen.getAllByTestId('data-table-row')
    expect(rows).toHaveLength(3)

    // Check row contents
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument()

    // Check custom cell rendering
    expect(screen.getByTestId('status-USR-01')).toHaveTextContent('ACTIVE')
    expect(screen.getByTestId('status-USR-02')).toHaveTextContent('INACTIVE')
  })

  it('fires onRowClick with row data and index when a row is clicked', () => {
    const onRowClickMock = vi.fn()

    render(
      <DataTable<UserRow>
        columns={mockColumns}
        data={mockData}
        onRowClick={onRowClickMock}
      />
    )

    const rows = screen.getAllByTestId('data-table-row')
    fireEvent.click(rows[1])

    expect(onRowClickMock).toHaveBeenCalledTimes(1)
    expect(onRowClickMock).toHaveBeenCalledWith(mockData[1], 1)
  })

  it('handles pagination controls and page change callbacks', () => {
    const onPageChangeMock = vi.fn()

    render(
      <DataTable<UserRow>
        columns={mockColumns}
        data={mockData}
        page={2}
        pageSize={10}
        totalCount={35}
        onPageChange={onPageChangeMock}
      />
    )

    // Pagination info
    expect(screen.getByTestId('pagination-showing-start')).toHaveTextContent('11')
    expect(screen.getByTestId('pagination-showing-end')).toHaveTextContent('20')
    expect(screen.getByTestId('pagination-total-count')).toHaveTextContent('35')
    expect(screen.getByTestId('pagination-page-indicator')).toHaveTextContent('Page 2 of 4')

    const prevBtn = screen.getByTestId('data-table-prev-page')
    const nextBtn = screen.getByTestId('data-table-next-page')

    expect(prevBtn).toBeEnabled()
    expect(nextBtn).toBeEnabled()

    fireEvent.click(prevBtn)
    expect(onPageChangeMock).toHaveBeenCalledWith(1)

    fireEvent.click(nextBtn)
    expect(onPageChangeMock).toHaveBeenCalledWith(3)
  })

  it('disables pagination buttons at bounds', () => {
    const onPageChangeMock = vi.fn()

    // Page 1 of 1
    const { rerender } = render(
      <DataTable<UserRow>
        columns={mockColumns}
        data={mockData}
        page={1}
        pageSize={10}
        totalCount={3}
        onPageChange={onPageChangeMock}
      />
    )

    expect(screen.getByTestId('data-table-prev-page')).toBeDisabled()
    expect(screen.getByTestId('data-table-next-page')).toBeDisabled()

    // Page 3 of 3
    rerender(
      <DataTable<UserRow>
        columns={mockColumns}
        data={mockData}
        page={3}
        pageSize={10}
        totalCount={25}
        onPageChange={onPageChangeMock}
      />
    )

    expect(screen.getByTestId('data-table-prev-page')).toBeEnabled()
    expect(screen.getByTestId('data-table-next-page')).toBeDisabled()
  })

  it('supports pagination configured via nested pagination object', () => {
    const onPageChangeMock = vi.fn()

    render(
      <DataTable<UserRow>
        columns={mockColumns}
        data={mockData}
        pagination={{
          page: 1,
          pageSize: 5,
          totalCount: 15,
          onPageChange: onPageChangeMock,
        }}
      />
    )

    expect(screen.getByTestId('pagination-page-indicator')).toHaveTextContent('Page 1 of 3')
    fireEvent.click(screen.getByTestId('data-table-next-page'))
    expect(onPageChangeMock).toHaveBeenCalledWith(2)
  })
})
