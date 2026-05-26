// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Mock react-router
vi.mock('react-router', () => ({
  Navigate: ({ to, replace }) => <div data-testid="navigate" data-to={to} data-replace={String(replace)} />,
  Outlet: () => <div data-testid="outlet" />,
}));

import ProtectedRoute from '../ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redirects to /configurator when isAllowed=false', () => {
    const { getByTestId } = render(<ProtectedRoute isAllowed={false} />);
    const nav = getByTestId('navigate');
    expect(nav.dataset.to).toBe('/configurator');
    expect(nav.dataset.replace).toBe('true');
  });

  it('redirects to custom path when isAllowed=false', () => {
    const { getByTestId } = render(<ProtectedRoute isAllowed={false} redirectPath="/home" />);
    expect(getByTestId('navigate').dataset.to).toBe('/home');
  });

  it('renders Outlet when isAllowed=true and no children', () => {
    const { getByTestId } = render(<ProtectedRoute isAllowed={true} />);
    expect(getByTestId('outlet')).toBeTruthy();
  });

  it('renders children when isAllowed=true', () => {
    const { getByText } = render(
      <ProtectedRoute isAllowed={true}>
        <span>child</span>
      </ProtectedRoute>
    );
    expect(getByText('child')).toBeTruthy();
  });
});
