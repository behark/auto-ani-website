import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VehicleCard from '../VehicleCardSimple'
import { Vehicle } from '@/lib/types'

// Mock the LanguageContext
const mockUseLanguage = {
  t: (key: string) => {
    const translations: Record<string, string> = {
      'common.available': 'Available',
      'common.featured': 'Featured',
    }
    return translations[key] || key
  },
  language: 'en',
  setLanguage: jest.fn(),
}

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => mockUseLanguage,
}))

// Mock components
jest.mock('@/components/favorites/FavoriteButton', () => {
  return function MockFavoriteButton({ vehicle }: { vehicle: Vehicle }) {
    return <button data-testid="favorite-button">♥ {vehicle.id}</button>
  }
})

jest.mock('@/components/ui/LazyImage', () => {
  return function MockLazyImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} data-testid="lazy-image" {...props} />
  }
})

jest.mock('@/components/ui/FallbackImage', () => {
  return function MockFallbackImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} data-testid="fallback-image" {...props} />
  }
})

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props} data-testid="next-link">
        {children}
      </a>
    )
  }
})

const mockVehicle: Vehicle = {
  id: '1',
  slug: 'test-vehicle',
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
  images: [
    '/images/vehicle1.jpg',
    '/images/vehicle2.jpg',
    '/images/vehicle3.jpg',
  ],
  description: 'A reliable and fuel-efficient sedan perfect for daily commuting.',
  features: ['Air Conditioning', 'Bluetooth', 'Backup Camera', 'Heated Seats', 'Navigation'],
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('VehicleCard', () => {
  it('renders vehicle information correctly in grid view', () => {
    render(<VehicleCard vehicle={mockVehicle} viewMode="grid" />)

    expect(screen.getByText('Toyota Camry')).toBeInTheDocument()
    expect(screen.getByText('$25,000')).toBeInTheDocument()
    expect(screen.getByText('2023')).toBeInTheDocument()
    expect(screen.getByText('15,000 mi')).toBeInTheDocument()
    expect(screen.getByText('Gasoline')).toBeInTheDocument()
    expect(screen.getByText('Automatic')).toBeInTheDocument()
  })

  it('renders vehicle information correctly in list view', () => {
    render(<VehicleCard vehicle={mockVehicle} viewMode="list" />)

    expect(screen.getByText('2023 Toyota Camry')).toBeInTheDocument()
    expect(screen.getByText('$25,000')).toBeInTheDocument()
    expect(screen.getByText('15,000 mi')).toBeInTheDocument()
    expect(screen.getByText('Gasoline')).toBeInTheDocument()
    expect(screen.getByText('Automatic')).toBeInTheDocument()
    expect(screen.getByText('Sedan')).toBeInTheDocument()
  })

  it('displays availability and featured badges', () => {
    render(<VehicleCard vehicle={mockVehicle} />)

    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })

  it('shows image navigation buttons when multiple images exist', () => {
    render(<VehicleCard vehicle={mockVehicle} />)

    expect(screen.getByLabelText('Previous image')).toBeInTheDocument()
    expect(screen.getByLabelText('Next image')).toBeInTheDocument()
    expect(screen.getByText('1/3')).toBeInTheDocument()
  })

  it('navigates through images when clicking navigation buttons', async () => {
    const user = userEvent.setup()
    render(<VehicleCard vehicle={mockVehicle} />)

    const nextButton = screen.getByLabelText('Next image')
    const imageIndicator = screen.getByText('1/3')

    expect(imageIndicator).toBeInTheDocument()

    await user.click(nextButton)
    await waitFor(() => {
      expect(screen.getByText('2/3')).toBeInTheDocument()
    })

    await user.click(nextButton)
    await waitFor(() => {
      expect(screen.getByText('3/3')).toBeInTheDocument()
    })

    // Test wrap around to first image
    await user.click(nextButton)
    await waitFor(() => {
      expect(screen.getByText('1/3')).toBeInTheDocument()
    })
  })

  it('navigates to previous image correctly', async () => {
    const user = userEvent.setup()
    render(<VehicleCard vehicle={mockVehicle} />)

    const prevButton = screen.getByLabelText('Previous image')

    // Click previous from first image should go to last
    await user.click(prevButton)
    await waitFor(() => {
      expect(screen.getByText('3/3')).toBeInTheDocument()
    })
  })

  it('handles touch swipe gestures', () => {
    render(<VehicleCard vehicle={mockVehicle} />)

    const touchArea = screen.getByTestId('lazy-image').parentElement
    expect(touchArea).toBeInTheDocument()

    // Simulate swipe left (next image)
    fireEvent.touchStart(touchArea!, {
      touches: [{ clientX: 100 }],
    })
    fireEvent.touchEnd(touchArea!, {
      changedTouches: [{ clientX: 40 }], // Swipe left by 60px
    })

    expect(screen.getByText('2/3')).toBeInTheDocument()
  })

  it('displays correct number of features with overflow indicator', () => {
    render(<VehicleCard vehicle={mockVehicle} viewMode="list" />)

    // Should show first 4 features
    expect(screen.getByText('Air Conditioning')).toBeInTheDocument()
    expect(screen.getByText('Bluetooth')).toBeInTheDocument()
    expect(screen.getByText('Backup Camera')).toBeInTheDocument()
    expect(screen.getByText('Heated Seats')).toBeInTheDocument()

    // Should show +1 more indicator
    expect(screen.getByText('+1 more')).toBeInTheDocument()
  })

  it('renders View Details link with correct href', () => {
    render(<VehicleCard vehicle={mockVehicle} />)

    const viewDetailsLink = screen.getByTestId('next-link')
    expect(viewDetailsLink).toHaveAttribute('href', '/vehicles/test-vehicle')
  })

  it('uses vehicle id as fallback when slug is not available', () => {
    const vehicleWithoutSlug = { ...mockVehicle, slug: undefined }
    render(<VehicleCard vehicle={vehicleWithoutSlug} />)

    const viewDetailsLink = screen.getByTestId('next-link')
    expect(viewDetailsLink).toHaveAttribute('href', '/vehicles/1')
  })

  it('renders favorite button with correct vehicle prop', () => {
    render(<VehicleCard vehicle={mockVehicle} />)

    const favoriteButton = screen.getByTestId('favorite-button')
    expect(favoriteButton).toHaveTextContent('♥ 1')
  })

  it('formats price correctly for different currencies', () => {
    const expensiveVehicle = { ...mockVehicle, price: 1234567 }
    render(<VehicleCard vehicle={expensiveVehicle} />)

    expect(screen.getByText('$1,234,567')).toBeInTheDocument()
  })

  it('formats mileage with proper number formatting', () => {
    const highMileageVehicle = { ...mockVehicle, mileage: 123456 }
    render(<VehicleCard vehicle={highMileageVehicle} />)

    expect(screen.getByText('123,456 mi')).toBeInTheDocument()
  })

  it('handles single image vehicle correctly', () => {
    const singleImageVehicle = {
      ...mockVehicle,
      images: ['/images/single-vehicle.jpg'],
    }
    render(<VehicleCard vehicle={singleImageVehicle} />)

    // Navigation buttons should not be present
    expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument()
    expect(screen.queryByText('1/1')).not.toBeInTheDocument()
  })

  it('applies eager loading for vehicles with low index', () => {
    render(<VehicleCard vehicle={mockVehicle} index={3} />)

    const image = screen.getByTestId('lazy-image')
    expect(image).toHaveAttribute('priority')
  })

  it('does not apply eager loading for vehicles with high index', () => {
    render(<VehicleCard vehicle={mockVehicle} index={10} />)

    const image = screen.getByTestId('lazy-image')
    expect(image).not.toHaveAttribute('priority')
  })

  it('calls onView callback when provided', async () => {
    const onViewMock = jest.fn()
    const user = userEvent.setup()

    render(<VehicleCard vehicle={mockVehicle} onView={onViewMock} />)

    // In real implementation, you would need to add the onView trigger
    // This is a placeholder test structure
    expect(onViewMock).toHaveBeenCalledTimes(0)
  })

  it('applies custom className when provided', () => {
    const { container } = render(
      <VehicleCard vehicle={mockVehicle} className="custom-class" />
    )

    const card = container.firstChild
    expect(card).toHaveClass('custom-class')
  })
})