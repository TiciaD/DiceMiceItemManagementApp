import { render, screen, fireEvent } from '@testing-library/react';
import { MyPotionsSection } from '@/components/my-items/MyPotionsSection';
import { PotionWithTemplate } from '@/types/potions';

// Mock the UserPotionCard component
jest.mock('@/components/my-items/UserPotionCard', () => ({
  UserPotionCard: jest.fn(({ potion, onClick }) => (
    <div data-testid={`potion-card-${potion.id}`} onClick={() => onClick(potion)}>
      {potion.template.name} - {potion.customId}
    </div>
  )),
}));

// Mock the UserPotionDetailsModal component
jest.mock('@/components/my-items/UserPotionDetailsModal', () => ({
  UserPotionDetailsModal: jest.fn(({ isOpen, potion, onClose, onConsume }) =>
    isOpen ? (
      <div data-testid="potion-details-modal">
        <button onClick={() => onConsume && onConsume(potion)}>Consume Potion</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

describe('MyPotionsSection', () => {
  const mockOnPotionConsumed = jest.fn();

  const mockPotionTemplate = {
    id: 'template-1',
    name: 'Healing Potion',
    level: 1,
    school: 'Evocation',
    rarity: 'common' as const,
    potencyFailEffect: 'No effect',
    potencySuccessEffect: 'Heal 1d4+1 HP',
    potencyCriticalSuccessEffect: 'Heal 2d4+2 HP',
    description: 'A basic healing potion',
    cost: 50,
    splitAmount: null,
    specialIngredient: null,
    isDiscovered: true,
    propsJson: null,
  };

  const mockPotions: PotionWithTemplate[] = [
    {
      id: 'potion-1',
      customId: 'HEAL-001',
      potionTemplateId: 'template-1',
      craftedPotency: 'success',
      craftedBy: 'Alchemist Bob',
      craftedAt: new Date('2024-01-15T10:30:00Z'),
      weight: 0.5,
      specialIngredientDetails: null,
      consumedBy: null,
      consumedAt: null,
      usedAmount: null,
      remainingAmount: null,
      isFullyConsumed: false,
      template: mockPotionTemplate,
    },
    {
      id: 'potion-2',
      customId: 'HEAL-002',
      potionTemplateId: 'template-1',
      craftedPotency: 'critical_success',
      craftedBy: 'Master Alchemist',
      craftedAt: new Date('2024-01-16T14:20:00Z'),
      weight: 0.3,
      specialIngredientDetails: null,
      consumedBy: 'Hero',
      consumedAt: new Date('2024-01-20T10:00:00Z'),
      usedAmount: null,
      remainingAmount: null,
      isFullyConsumed: true,
      template: mockPotionTemplate,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays stats correctly', () => {
    render(<MyPotionsSection potions={mockPotions} onPotionConsumed={mockOnPotionConsumed} />);

    // Check total potions
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Total Potions')).toBeInTheDocument();

    // Check that "Available" text exists
    const availableElements = screen.getAllByText('Available');
    expect(availableElements).toHaveLength(2); // One in stats, one in filter dropdown

    // Check that "Consumed" text exists
    const consumedElements = screen.getAllByText('Consumed');
    expect(consumedElements).toHaveLength(2); // One in stats, one in filter dropdown    // Check total value (2 potions * 50 gp each = 100 gp)
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Total Value (gp)')).toBeInTheDocument();
  });

  it('displays potions cards', () => {
    render(<MyPotionsSection potions={mockPotions} onPotionConsumed={mockOnPotionConsumed} />);

    // Check that both potion cards are rendered
    expect(screen.getByTestId('potion-card-potion-1')).toBeInTheDocument();
    expect(screen.getByTestId('potion-card-potion-2')).toBeInTheDocument();
  });

  it('filters potions by search term', () => {
    render(<MyPotionsSection potions={mockPotions} onPotionConsumed={mockOnPotionConsumed} />);

    // Find and interact with search input - use the actual placeholder text
    const searchInput = screen.getByPlaceholderText('Search by name, ID, or crafter...');
    fireEvent.change(searchInput, { target: { value: 'HEAL-001' } });

    // Should only show the first potion
    expect(screen.getByTestId('potion-card-potion-1')).toBeInTheDocument();
    expect(screen.queryByTestId('potion-card-potion-2')).not.toBeInTheDocument();
  });

  it('filters potions by status', () => {
    render(<MyPotionsSection potions={mockPotions} onPotionConsumed={mockOnPotionConsumed} />);

    // Find and interact with status filter - use the select element directly
    const statusFilter = screen.getByLabelText('Status');
    fireEvent.change(statusFilter, { target: { value: 'available' } });

    // Should only show available potions (first one)
    expect(screen.getByTestId('potion-card-potion-1')).toBeInTheDocument();
    expect(screen.queryByTestId('potion-card-potion-2')).not.toBeInTheDocument();
  });

  it('opens details modal when potion is clicked', () => {
    render(<MyPotionsSection potions={mockPotions} onPotionConsumed={mockOnPotionConsumed} />);

    // Click on a potion card
    fireEvent.click(screen.getByTestId('potion-card-potion-1'));

    // Modal should be open
    expect(screen.getByTestId('potion-details-modal')).toBeInTheDocument();
  });

  it('calls onPotionConsumed when potion is consumed through modal', () => {
    render(<MyPotionsSection potions={mockPotions} onPotionConsumed={mockOnPotionConsumed} />);

    // Open modal
    fireEvent.click(screen.getByTestId('potion-card-potion-1'));

    // Consume potion through modal
    fireEvent.click(screen.getByText('Consume Potion'));

    // Should call the callback
    expect(mockOnPotionConsumed).toHaveBeenCalledWith(mockPotions[0]);
  });

  it('closes modal when close button is clicked', () => {
    render(<MyPotionsSection potions={mockPotions} onPotionConsumed={mockOnPotionConsumed} />);

    // Open modal
    fireEvent.click(screen.getByTestId('potion-card-potion-1'));
    expect(screen.getByTestId('potion-details-modal')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('potion-details-modal')).not.toBeInTheDocument();
  });

  it('displays empty state when no potions', () => {
    render(<MyPotionsSection potions={[]} onPotionConsumed={mockOnPotionConsumed} />);

    expect(screen.getByText('No Potions Yet')).toBeInTheDocument();
    expect(screen.getByText('Visit the compendium to add potions to your collection.')).toBeInTheDocument();
  });

  it('filters potions by crafter name', () => {
    render(<MyPotionsSection potions={mockPotions} onPotionConsumed={mockOnPotionConsumed} />);

    // Search by crafter name
    const searchInput = screen.getByPlaceholderText('Search by name, ID, or crafter...');
    fireEvent.change(searchInput, { target: { value: 'Master' } });

    // Should only show the potion crafted by Master Alchemist
    expect(screen.queryByTestId('potion-card-potion-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('potion-card-potion-2')).toBeInTheDocument();
  });

  it('shows consumed filter correctly', () => {
    render(<MyPotionsSection potions={mockPotions} onPotionConsumed={mockOnPotionConsumed} />);

    // Filter to consumed only
    const statusFilter = screen.getByLabelText('Status');
    fireEvent.change(statusFilter, { target: { value: 'consumed' } });

    // Should only show consumed potions (second one)
    expect(screen.queryByTestId('potion-card-potion-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('potion-card-potion-2')).toBeInTheDocument();
  });
});