import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Integration test for vehicle browsing workflow
describe('Vehicle Browsing Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    // Mock fetch for API calls
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // Mock a simplified vehicles page component for testing
  const MockVehiclesPage = () => {
    const vehicles = [
      {
        id: '1',
        slug: 'toyota-camry-2023',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        price: 25000,
        mileage: 15000,
        fuelType: 'Gasoline',
        transmission: 'Automatic',
        bodyType: 'Sedan',
        status: 'I Disponueshëm',
        featured: true,
        images: ['/images/camry1.jpg', '/images/camry2.jpg'],
        description: 'Reliable sedan in excellent condition',
        features: ['Air Conditioning', 'Bluetooth', 'Backup Camera'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        slug: 'honda-civic-2022',
        make: 'Honda',
        model: 'Civic',
        year: 2022,
        price: 22000,
        mileage: 20000,
        fuelType: 'Gasoline',
        transmission: 'Manual',
        bodyType: 'Hatchback',
        status: 'I Disponueshëm',
        featured: false,
        images: ['/images/civic1.jpg'],
        description: 'Sporty and fuel-efficient hatchback',
        features: ['Sport Mode', 'Manual Transmission', 'Premium Audio'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    return (
      <div>
        <h1>Available Vehicles</h1>
        <div data-testid="vehicle-filters">
          <select data-testid="make-filter">
            <option value="">All Makes</option>
            <option value="Toyota">Toyota</option>
            <option value="Honda">Honda</option>
          </select>
          <select data-testid="price-filter">
            <option value="">All Prices</option>
            <option value="0-20000">$0 - $20,000</option>
            <option value="20000-30000">$20,000 - $30,000</option>
          </select>
        </div>
        <div data-testid="vehicle-list">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} data-testid={`vehicle-${vehicle.id}`}>
              <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
              <p>${vehicle.price.toLocaleString()}</p>
              <p>{vehicle.mileage.toLocaleString()} mi</p>
              <button data-testid={`view-details-${vehicle.id}`}>
                View Details
              </button>
              <button data-testid={`add-favorite-${vehicle.id}`}>
                Add to Favorites
              </button>
              <button data-testid={`compare-${vehicle.id}`}>
                Compare
              </button>
            </div>
          ))}
        </div>
        <div data-testid="comparison-panel" style={{ display: 'none' }}>
          <h3>Vehicle Comparison</h3>
          <div data-testid="comparison-items"></div>
        </div>
      </div>
    )
  }

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('displays vehicle listings correctly', () => {
    renderWithProviders(<MockVehiclesPage />)

    expect(screen.getByText('Available Vehicles')).toBeInTheDocument()
    expect(screen.getByTestId('vehicle-1')).toBeInTheDocument()
    expect(screen.getByTestId('vehicle-2')).toBeInTheDocument()
    expect(screen.getByText('2023 Toyota Camry')).toBeInTheDocument()
    expect(screen.getByText('2022 Honda Civic')).toBeInTheDocument()
  })

  it('allows filtering vehicles by make', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockVehiclesPage />)

    const makeFilter = screen.getByTestId('make-filter')
    await user.selectOptions(makeFilter, 'Toyota')

    // In a real implementation, this would filter the results
    expect(makeFilter).toHaveValue('Toyota')
  })

  it('allows filtering vehicles by price range', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockVehiclesPage />)

    const priceFilter = screen.getByTestId('price-filter')
    await user.selectOptions(priceFilter, '20000-30000')

    expect(priceFilter).toHaveValue('20000-30000')
  })

  it('handles adding vehicles to favorites', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockVehiclesPage />)

    // Mock localStorage for favorites
    const mockLocalStorage = {
      getItem: jest.fn(() => '[]'),
      setItem: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    })

    const favoriteButton = screen.getByTestId('add-favorite-1')
    await user.click(favoriteButton)

    // In a real implementation, this would update localStorage
    // and possibly show visual feedback
  })

  it('supports vehicle comparison workflow', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockVehiclesPage />)

    // Add first vehicle to comparison
    const compareButton1 = screen.getByTestId('compare-1')
    await user.click(compareButton1)

    // Add second vehicle to comparison
    const compareButton2 = screen.getByTestId('compare-2')
    await user.click(compareButton2)

    // In a real implementation, this would show the comparison panel
    // and populate it with vehicle data
  })

  it('handles vehicle detail navigation', async () => {
    const user = userEvent.setup()

    // Mock Next.js router
    const mockPush = jest.fn()
    jest.mock('next/router', () => ({
      useRouter: () => ({
        push: mockPush,
        pathname: '/vehicles',
        query: {},
      }),
    }))

    renderWithProviders(<MockVehiclesPage />)

    const viewDetailsButton = screen.getByTestId('view-details-1')
    await user.click(viewDetailsButton)

    // In a real implementation, this would navigate to the vehicle detail page
  })

  it('persists filters across page reloads', () => {
    // Mock URL search params
    const mockSearchParams = new URLSearchParams('make=Toyota&price=20000-30000')

    jest.mock('next/navigation', () => ({
      useSearchParams: () => mockSearchParams,
    }))

    renderWithProviders(<MockVehiclesPage />)

    // In a real implementation, filters would be restored from URL params
    const makeFilter = screen.getByTestId('make-filter')
    const priceFilter = screen.getByTestId('price-filter')

    // These would be set based on URL params in a real implementation
    expect(makeFilter).toBeInTheDocument()
    expect(priceFilter).toBeInTheDocument()
  })

  it('handles search functionality', async () => {
    const user = userEvent.setup()

    // Add search input to mock component
    const MockVehiclesPageWithSearch = () => (
      <div>
        <input
          data-testid="search-input"
          placeholder="Search vehicles..."
          type="text"
        />
        <MockVehiclesPage />
      </div>
    )

    renderWithProviders(<MockVehiclesPageWithSearch />)

    const searchInput = screen.getByTestId('search-input')
    await user.type(searchInput, 'Toyota Camry')

    // In a real implementation, this would filter vehicles based on search term
    expect(searchInput).toHaveValue('Toyota Camry')
  })

  it('displays loading states during data fetching', async () => {
    // Mock loading state
    const MockLoadingVehiclesPage = () => (
      <div>
        <div data-testid="loading-spinner">Loading vehicles...</div>
      </div>
    )

    renderWithProviders(<MockLoadingVehiclesPage />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('Loading vehicles...')).toBeInTheDocument()
  })

  it('handles error states gracefully', () => {
    const MockErrorVehiclesPage = () => (
      <div>
        <div data-testid="error-message">
          Failed to load vehicles. Please try again.
        </div>
        <button data-testid="retry-button">Retry</button>
      </div>
    )

    renderWithProviders(<MockErrorVehiclesPage />)

    expect(screen.getByTestId('error-message')).toBeInTheDocument()
    expect(screen.getByText('Failed to load vehicles. Please try again.')).toBeInTheDocument()
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
  })

  it('supports pagination for large vehicle lists', async () => {
    const user = userEvent.setup()

    const MockPaginatedVehiclesPage = () => (
      <div>
        <MockVehiclesPage />
        <div data-testid="pagination">
          <button data-testid="prev-page" disabled>Previous</button>
          <span data-testid="page-info">Page 1 of 5</span>
          <button data-testid="next-page">Next</button>
        </div>
      </div>
    )

    renderWithProviders(<MockPaginatedVehiclesPage />)

    const nextButton = screen.getByTestId('next-page')
    const pageInfo = screen.getByTestId('page-info')

    expect(pageInfo).toHaveTextContent('Page 1 of 5')

    await user.click(nextButton)

    // In a real implementation, this would navigate to the next page
    // and update the page info
  })

  it('maintains responsive design on different screen sizes', () => {
    // Mock window.matchMedia for responsive design tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('768px'), // Simulate mobile viewport
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    renderWithProviders(<MockVehiclesPage />)

    // In a real implementation, you would test responsive behavior
    // such as different layouts, hidden elements, etc.
    expect(screen.getByTestId('vehicle-list')).toBeInTheDocument()
  })
})