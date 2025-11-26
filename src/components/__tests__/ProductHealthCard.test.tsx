import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ProductHealthCard from '../ProductHealthCard';

// Mock analyticsService
vi.mock('../../services/analyticsService', () => ({
  fetchProductHealthScore: vi.fn().mockResolvedValue({
    productName: 'Test Product',
    overallScore: 85,
    healthStatus: 'good',
    scoreBreakdown: {
      stockLevelScore: 90,
      turnoverScore: 80,
      profitabilityScore: 85,
    },
    trends: {
      last30Days: 5.2,
      last90Days: 3.1,
      yearOverYear: 12.5,
    },
    insights: ['Product performing well', 'Stock levels healthy'],
    actionItems: [
      { action: 'Monitor closely', priority: 'medium', impact: 'High' },
    ],
  }),
}));

describe('ProductHealthCard', () => {
  const defaultProps = {
    productId: 1,
  };

  describe('rendering', () => {
    test('renders product name', async () => {
      render(<ProductHealthCard {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });

    test('renders overall score', async () => {
      const { container } = render(<ProductHealthCard {...defaultProps} />);
      await waitFor(() => {
        const scoreElement = container.querySelector('.score-value');
        expect(scoreElement).toHaveTextContent('85');
      }, { timeout: 3000 });
    });

    test('renders health status', async () => {
      render(<ProductHealthCard {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/GOOD/)).toBeInTheDocument();
      });
    });

    test('shows loading state initially', () => {
      render(<ProductHealthCard {...defaultProps} />);
      expect(screen.getByText(/Loading health score/)).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    test('renders in compact mode', async () => {
      const { container } = render(<ProductHealthCard {...defaultProps} compact={true} />);
      await waitFor(() => {
        expect(container.querySelector('.health-card.compact')).toBeInTheDocument();
      });
    });

    test('renders full card by default', async () => {
      const { container } = render(<ProductHealthCard {...defaultProps} />);
      await waitFor(() => {
        expect(container.querySelector('.health-card:not(.compact)')).toBeInTheDocument();
      });
    });
  });

  describe('score breakdown', () => {
    test('renders score breakdown section', async () => {
      render(<ProductHealthCard {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/Score Breakdown/)).toBeInTheDocument();
      });
    });

    test('displays score values', async () => {
      render(<ProductHealthCard {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('90')).toBeInTheDocument(); // stockLevelScore
        expect(screen.getByText('80')).toBeInTheDocument(); // turnoverScore
      });
    });
  });

  describe('trends section', () => {
    test('renders trends section', async () => {
      render(<ProductHealthCard {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/Trends/)).toBeInTheDocument();
      });
    });

    test('displays trend percentages', async () => {
      render(<ProductHealthCard {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/\+5.2%/)).toBeInTheDocument();
        expect(screen.getByText(/\+12.5%/)).toBeInTheDocument();
      });
    });
  });

  describe('insights and actions', () => {
    test('renders insights when available', async () => {
      render(<ProductHealthCard {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/Product performing well/)).toBeInTheDocument();
      });
    });

    test('renders action items', async () => {
      render(<ProductHealthCard {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/Monitor closely/)).toBeInTheDocument();
      });
    });
  });
});
