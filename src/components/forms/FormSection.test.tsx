import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FormSection } from './FormSection'

describe('FormSection Component', () => {
  it('renders title, description, and children correctly', () => {
    render(
      <FormSection
        title="Personal Details"
        description="Enter primary contact information for the subscriber."
      >
        <input placeholder="Full Name" />
        <input placeholder="Mobile Number" />
      </FormSection>
    )

    expect(screen.getByText('Personal Details')).toBeInTheDocument()
    expect(
      screen.getByText('Enter primary contact information for the subscriber.')
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Mobile Number')).toBeInTheDocument()
  })

  it('renders title and children without description when description is not provided', () => {
    render(
      <FormSection title="Access Permissions">
        <div>Permissions checklist content</div>
      </FormSection>
    )

    expect(screen.getByText('Access Permissions')).toBeInTheDocument()
    expect(screen.getByText('Permissions checklist content')).toBeInTheDocument()
    expect(screen.queryByTestId('form-section-description')).not.toBeInTheDocument()
  })

  it('renders header action slot when provided', () => {
    render(
      <FormSection
        title="Geographic Boundaries"
        action={<button type="button">Edit Boundaries</button>}
      >
        <div>Zone and Circle dropdowns</div>
      </FormSection>
    )

    expect(screen.getByText('Geographic Boundaries')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Edit Boundaries' })
    ).toBeInTheDocument()
    expect(screen.getByTestId('form-section-action')).toBeInTheDocument()
  })

  it('associates section with title using aria-labelledby when id is provided', () => {
    render(
      <FormSection
        id="location-section"
        title="Location"
      >
        <div>Location form fields</div>
      </FormSection>
    )

    const section = screen.getByTestId('form-section')
    expect(section).toHaveAttribute('id', 'location-section')
    expect(section).toHaveAttribute('aria-labelledby', 'location-section-title')

    const titleEl = screen.getByTestId('form-section-title')
    expect(titleEl).toHaveAttribute('id', 'location-section-title')
  })

  it('applies custom className and contentClassName', () => {
    render(
      <FormSection
        title="Custom Styling Test"
        className="custom-section-class"
        contentClassName="custom-content-class"
      >
        <div>Content</div>
      </FormSection>
    )

    expect(screen.getByTestId('form-section')).toHaveClass('custom-section-class')
    expect(screen.getByTestId('form-section-content')).toHaveClass('custom-content-class')
  })
})
