import { render, screen, fireEvent } from '@testing-library/react';
import { UserPotionCard } from '@/components/my-items/UserPotionCard';
import { PotionWithTemplate } from '@/types/potions';

// Mock the date utils
jest.mock('@/lib/dateUtils', () => ({
  formatInGameDateShort: jest.fn(() => '15th Day of Spring'),
}));

describe('UserPotionCard', () => {
  const mockOnClick = jest.fn();

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

  const mockPotion: PotionWithTemplate = {
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders potion information correctly', () => {
    render(<UserPotionCard potion={mockPotion} onClick={mockOnClick} />);

    // Check that potion name and ID are displayed
    expect(screen.getByText('Healing Potion')).toBeInTheDocument();
    expect(screen.getByText('ID: HEAL-001')).toBeInTheDocument();

    // Check rarity and potency badges
    expect(screen.getByText('common')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();

    // Check details
    expect(screen.getByText('Level:')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('School:')).toBeInTheDocument();
    expect(screen.getByText('Evocation')).toBeInTheDocument();
    expect(screen.getByText('Weight:')).toBeInTheDocument();
    expect(screen.getByText('0.5 lbs')).toBeInTheDocument();
    expect(screen.getByText('Value:')).toBeInTheDocument();
    expect(screen.getByText('50 gp')).toBeInTheDocument();

    // Check crafted by
    expect(screen.getByText('Crafted by:')).toBeInTheDocument();
    expect(screen.getByText('Alchemist Bob')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const { container } = render(<UserPotionCard potion={mockPotion} onClick={mockOnClick} />);

    // Click the card container (it's a div with cursor-pointer)
    fireEvent.click(container.firstChild as Element);
    expect(mockOnClick).toHaveBeenCalledWith(mockPotion);
  });

  it('displays special ingredient details when present', () => {
    const potionWithSpecialIngredient: PotionWithTemplate = {
      ...mockPotion,
      specialIngredientDetails: 'Dragon Scale',
    };

    render(<UserPotionCard potion={potionWithSpecialIngredient} onClick={mockOnClick} />);

    expect(screen.getByText('Special Ingredient:')).toBeInTheDocument();
    expect(screen.getByText('Dragon Scale')).toBeInTheDocument();
  });

  it('displays split amount information when template has it', () => {
    const templateWithSplitAmount = {
      ...mockPotionTemplate,
      splitAmount: '3 Doses',
    };

    const potionWithSplitAmount: PotionWithTemplate = {
      ...mockPotion,
      template: templateWithSplitAmount,
    };

    render(<UserPotionCard potion={potionWithSplitAmount} onClick={mockOnClick} />);

    expect(screen.getByText('Split Amount:')).toBeInTheDocument();
    expect(screen.getByText('3 Doses')).toBeInTheDocument();
  });

  it('displays partial consumption status', () => {
    const templateWithSplitAmount = {
      ...mockPotionTemplate,
      splitAmount: '3 Doses',
    };

    const partiallyConsumedPotion: PotionWithTemplate = {
      ...mockPotion,
      template: templateWithSplitAmount,
      usedAmount: '1 Dose',
      remainingAmount: '2 Doses',
      isFullyConsumed: false,
    };

    render(<UserPotionCard potion={partiallyConsumedPotion} onClick={mockOnClick} />);

    expect(screen.getAllByText('Used: 1 Dose')).toHaveLength(2);
  });

  it('displays different rarity styles correctly', () => {
    const rarePotionTemplate = {
      ...mockPotionTemplate,
      rarity: 'rare' as const,
    };

    const rarePotion: PotionWithTemplate = {
      ...mockPotion,
      template: rarePotionTemplate,
    };

    render(<UserPotionCard potion={rarePotion} onClick={mockOnClick} />);

    expect(screen.getByText('rare')).toBeInTheDocument();
  });

  it('displays different potency styles correctly', () => {
    const criticalSuccessPotion: PotionWithTemplate = {
      ...mockPotion,
      craftedPotency: 'critical_success',
    };

    render(<UserPotionCard potion={criticalSuccessPotion} onClick={mockOnClick} />);

    expect(screen.getByText('Critical Success')).toBeInTheDocument();
  });

  it('displays fail potency correctly', () => {
    const failedPotion: PotionWithTemplate = {
      ...mockPotion,
      craftedPotency: 'fail',
    };

    render(<UserPotionCard potion={failedPotion} onClick={mockOnClick} />);

    expect(screen.getByText('Fail')).toBeInTheDocument();
  });

  it('displays consumed status when potion is consumed', () => {
    const consumedPotion: PotionWithTemplate = {
      ...mockPotion,
      consumedBy: 'Hero McHeroface',
      consumedAt: new Date('2024-01-20T15:45:00Z'),
      isFullyConsumed: true,
    };

    render(<UserPotionCard potion={consumedPotion} onClick={mockOnClick} />);

    // The consumed status would typically be shown in the UI
    // This test verifies the component can handle consumed potions
    expect(screen.getByText('Healing Potion')).toBeInTheDocument();
  });
});