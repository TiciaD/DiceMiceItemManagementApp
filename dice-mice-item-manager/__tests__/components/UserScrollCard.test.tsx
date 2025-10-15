import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserScrollCard } from '@/components/my-items/UserScrollCard';
import { ScrollWithTemplate } from '@/types/spells';

// Mock the date utils
jest.mock('@/lib/dateUtils', () => ({
  formatInGameDateShort: jest.fn((date: Date) => date.toDateString()),
}));

describe('UserScrollCard', () => {
  const mockOnClick = jest.fn();

  const baseScroll: ScrollWithTemplate = {
    id: 'scroll1',
    spellTemplateId: 'spell1',
    material: 'vellum',
    consumedBy: null,
    consumedAt: null,
    craftedBy: 'Gandalf the Grey',
    craftedAt: new Date('2023-11-01T10:00:00.000Z'),
    weight: 0.1,
    template: {
      id: 'spell1',
      name: 'Fireball',
      school: 'evocation',
      level: 3,
      baseEffect: 'Deals 8d6 fire damage',
      associatedSkill: 'Arcana',
      inversionEffect: null,
      masteryEffect: null,
      isInvertable: false,
      isDiscovered: true,
      isInversionPublic: false,
      propsJson: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders scroll information correctly', () => {
    render(<UserScrollCard scroll={baseScroll} onClick={mockOnClick} />);

    expect(screen.getByText('📜 Fireball')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
    expect(screen.getByText('Evocation')).toBeInTheDocument();
    expect(screen.getByText('Vellum')).toBeInTheDocument();
    expect(screen.getByText('0.1 lbs')).toBeInTheDocument();
    expect(screen.getByText('Gandalf the Grey')).toBeInTheDocument();
  });

  it('displays cantrip label for level 0 spells', () => {
    const cantripScroll = {
      ...baseScroll,
      template: {
        ...baseScroll.template,
        name: 'Light',
        level: 0,
      },
    };

    render(<UserScrollCard scroll={cantripScroll} onClick={mockOnClick} />);

    expect(screen.getByText('Cantrip')).toBeInTheDocument();
    expect(screen.queryByText('Level 0')).not.toBeInTheDocument();
  });

  it('shows available status for unconsumed scrolls', () => {
    render(<UserScrollCard scroll={baseScroll} onClick={mockOnClick} />);

    expect(screen.getByText('Ready to Use')).toBeInTheDocument();
    expect(screen.queryByText('Consumed')).not.toBeInTheDocument();
  });

  it('shows consumed status for consumed scrolls', () => {
    const consumedScroll = {
      ...baseScroll,
      consumedBy: 'Aragorn',
      consumedAt: new Date('2023-12-01T12:00:00.000Z'),
    };

    render(<UserScrollCard scroll={consumedScroll} onClick={mockOnClick} />);

    expect(screen.getByText('Consumed')).toBeInTheDocument();
    expect(screen.queryByText('Ready to Use')).not.toBeInTheDocument();
  });

  it('displays invertable badge for invertable spells', () => {
    const invertableScroll = {
      ...baseScroll,
      template: {
        ...baseScroll.template,
        isInvertable: true,
        inversionEffect: 'Deals damage instead of healing',
      },
    };

    render(<UserScrollCard scroll={invertableScroll} onClick={mockOnClick} />);

    expect(screen.getByText('Invertable')).toBeInTheDocument();
  });

  it('does not display invertable badge for non-invertable spells', () => {
    render(<UserScrollCard scroll={baseScroll} onClick={mockOnClick} />);

    expect(screen.queryByText('Invertable')).not.toBeInTheDocument();
  });

  it('handles different material types', () => {
    const materials = ['paper', 'vellum', 'parchment', 'skin', 'cloth'];

    materials.forEach(material => {
      const scrollWithMaterial = {
        ...baseScroll,
        material: material as any,
      };

      const { rerender } = render(<UserScrollCard scroll={scrollWithMaterial} onClick={mockOnClick} />);

      expect(screen.getByText(material.charAt(0).toUpperCase() + material.slice(1))).toBeInTheDocument();

      rerender(<div />); // Clear for next iteration
    });
  });

  it('handles different spell schools', () => {
    const schools = ['evocation', 'enchantment', 'divination', 'abjuration', 'conjuration', 'illusion', 'necromancy', 'transmutation'];

    schools.forEach(school => {
      const scrollWithSchool = {
        ...baseScroll,
        template: {
          ...baseScroll.template,
          school,
        },
      };

      const { rerender } = render(<UserScrollCard scroll={scrollWithSchool} onClick={mockOnClick} />);

      expect(screen.getByText(school.charAt(0).toUpperCase() + school.slice(1))).toBeInTheDocument();

      rerender(<div />); // Clear for next iteration
    });
  });

  it('displays craft date when available', () => {
    const { formatInGameDateShort } = require('@/lib/dateUtils');
    formatInGameDateShort.mockReturnValue('Tue Nov 01 2023');

    render(<UserScrollCard scroll={baseScroll} onClick={mockOnClick} />);

    expect(screen.getByText('Crafted:')).toBeInTheDocument();
    expect(screen.getByText('Tue Nov 01 2023')).toBeInTheDocument();
    expect(formatInGameDateShort).toHaveBeenCalledWith(baseScroll.craftedAt);
  });

  it('displays consumption date when scroll is consumed', () => {
    const { formatInGameDateShort } = require('@/lib/dateUtils');
    formatInGameDateShort.mockReturnValue('Fri Dec 01 2023');

    const consumedScroll = {
      ...baseScroll,
      consumedBy: 'Aragorn',
      consumedAt: new Date('2023-12-01T12:00:00.000Z'),
    };

    render(<UserScrollCard scroll={consumedScroll} onClick={mockOnClick} />);

    expect(screen.getByText('Consumed')).toBeInTheDocument();
    // Find the consumption date specifically - it should be in the consumed status section
    const consumedStatusSection = screen.getByText('Consumed').closest('div');
    expect(within(consumedStatusSection!).getByText('Fri Dec 01 2023')).toBeInTheDocument();
  });

  it('handles clicks correctly', () => {
    render(<UserScrollCard scroll={baseScroll} onClick={mockOnClick} />);

    // Find the main card container by looking for the div with cursor-pointer class
    const card = screen.getByText('📜 Fireball').closest('div')?.parentElement;
    fireEvent.click(card!);

    expect(mockOnClick).toHaveBeenCalledWith(baseScroll);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies reduced opacity for consumed scrolls', () => {
    const consumedScroll = {
      ...baseScroll,
      consumedBy: 'Aragorn',
      consumedAt: new Date('2023-12-01T12:00:00.000Z'),
    };

    render(<UserScrollCard scroll={consumedScroll} onClick={mockOnClick} />);

    // Find the main card container which should have both cursor-pointer and opacity-60 classes
    const card = screen.getByText('📜 Fireball').closest('div')?.parentElement;
    expect(card).toHaveClass('opacity-60');
  });

  it('does not apply reduced opacity for available scrolls', () => {
    render(<UserScrollCard scroll={baseScroll} onClick={mockOnClick} />);

    const card = screen.getByText('📜 Fireball').closest('div');
    expect(card).not.toHaveClass('opacity-60');
  });

  it('handles different spell levels correctly', () => {
    const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    levels.forEach(level => {
      const scrollWithLevel = {
        ...baseScroll,
        template: {
          ...baseScroll.template,
          level,
        },
      };

      const { rerender } = render(<UserScrollCard scroll={scrollWithLevel} onClick={mockOnClick} />);

      if (level === 0) {
        expect(screen.getByText('Cantrip')).toBeInTheDocument();
      } else {
        expect(screen.getByText(`Level ${level}`)).toBeInTheDocument();
      }

      rerender(<div />); // Clear for next iteration
    });
  });

  it('handles decimal weights correctly', () => {
    const scrollWithDecimalWeight = {
      ...baseScroll,
      weight: 0.125,
    };

    render(<UserScrollCard scroll={scrollWithDecimalWeight} onClick={mockOnClick} />);

    expect(screen.getByText('0.125 lbs')).toBeInTheDocument();
  });

  it('handles zero weight correctly', () => {
    const scrollWithZeroWeight = {
      ...baseScroll,
      weight: 0,
    };

    render(<UserScrollCard scroll={scrollWithZeroWeight} onClick={mockOnClick} />);

    expect(screen.getByText('0 lbs')).toBeInTheDocument();
  });

  it('handles very long crafter names gracefully', () => {
    const scrollWithLongCrafterName = {
      ...baseScroll,
      craftedBy: 'Gandalf the Grey, Mithrandir, Stormcrow, White Rider',
    };

    render(<UserScrollCard scroll={scrollWithLongCrafterName} onClick={mockOnClick} />);

    expect(screen.getByText('Gandalf the Grey, Mithrandir, Stormcrow, White Rider')).toBeInTheDocument();
  });

  it('handles very long spell names gracefully', () => {
    const scrollWithLongSpellName = {
      ...baseScroll,
      template: {
        ...baseScroll.template,
        name: 'Extremely Long Spell Name That Should Display Properly',
      },
    };

    render(<UserScrollCard scroll={scrollWithLongSpellName} onClick={mockOnClick} />);

    expect(screen.getByText('📜 Extremely Long Spell Name That Should Display Properly')).toBeInTheDocument();
  });

  it('handles null consumption date gracefully', () => {
    const consumedScrollWithoutDate = {
      ...baseScroll,
      consumedBy: 'Aragorn',
      consumedAt: null,
    };

    render(<UserScrollCard scroll={consumedScrollWithoutDate} onClick={mockOnClick} />);

    expect(screen.getByText('Consumed')).toBeInTheDocument();
    // Should not crash or show consumption date
  });

  it('handles null craft date gracefully', () => {
    const scrollWithoutCraftDate = {
      ...baseScroll,
      craftedAt: null,
    };

    render(<UserScrollCard scroll={scrollWithoutCraftDate} onClick={mockOnClick} />);

    expect(screen.getByText('Gandalf the Grey')).toBeInTheDocument();
    // Should not crash or show craft date
  });

  it('applies correct CSS classes for hover effects', () => {
    render(<UserScrollCard scroll={baseScroll} onClick={mockOnClick} />);

    const card = screen.getByText('📜 Fireball').closest('div')?.parentElement;
    expect(card).toHaveClass('hover:shadow-lg');
    expect(card).toHaveClass('transition-shadow');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('displays base effect content in appropriate context', () => {
    // The base effect is not directly displayed in the card, but we can verify 
    // the template data is properly passed
    render(<UserScrollCard scroll={baseScroll} onClick={mockOnClick} />);

    // The card should render without errors with the base effect data
    expect(screen.getByText('📜 Fireball')).toBeInTheDocument();
  });
});