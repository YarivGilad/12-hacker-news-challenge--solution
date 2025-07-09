# Testing Setup

This project is configured with Vitest for unit testing.

## Available Scripts

- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with Vitest UI
- `npm run coverage` - Run tests with coverage report

## Test Structure

- Place test files alongside the source files they are testing
- Test files should end with `.spec.ts` or `.spec.tsx`
- Co-locate tests with their corresponding source files for better organization

## Available Testing Utilities

- **Vitest** - Main testing framework with Jest-compatible API
- **@testing-library/react** - For testing React components
- **@testing-library/jest-dom** - Additional DOM matchers
- **@testing-library/user-event** - For user interaction testing
- **jsdom** - DOM environment for testing

## Configuration

- Vitest configuration is in `vite.config.ts`
- Test setup file is `src/test/setup.ts`
- TypeScript types are configured in `tsconfig.app.json`

## Example Test Structure

For a component at `src/components/YourComponent.tsx`, create `src/components/YourComponent.spec.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import YourComponent from './YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
``` 