import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LevelUpModal } from '@/components/character-details/LevelUpModal';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('LevelUpModal', () => {
  const mockOnClose = jest.fn();
  const mockOnLevelUpComplete = jest.fn();
  const mockOnCancel = jest.fn();

  const mockCharacter = {
    id: 'test-char-1',
    name: 'Test Hero',
    currentLevel: 3,
    currentSTR: 14,
    currentCON: 12,
    currentDEX: 16,
    currentINT: 10,
    currentWIS: 13,
    currentCHA: 8,
    maxHP: 22,
    class: {
      hitDie: '1d8'
    }
  };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    character: mockCharacter,
    newLevel: 4,
    newXP: 2100,
    onLevelUpComplete: mockOnLevelUpComplete,
    onCancel: mockOnCancel
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    // Mock Math.random for consistent HP rolling tests
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Will result in middle values
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Modal Display', () => {
    it('renders modal when open', () => {
      render(<LevelUpModal {...defaultProps} />);

      expect(screen.getByText('🎉 Level Up! Test Hero → Level 4')).toBeInTheDocument();
      expect(screen.getByText('You have 2 attribute points to spend')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<LevelUpModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('🎉 Level Up! Test Hero → Level 4')).not.toBeInTheDocument();
    });

    it('displays sequence info for multi-level progression', () => {
      const sequenceProps = {
        ...defaultProps,
        newLevel: 6,
        sequenceInfo: {
          currentStep: 2,
          totalSteps: 3,
          targetLevel: 6
        }
      };

      render(<LevelUpModal {...sequenceProps} />);

      expect(screen.getByText('🎉 Level Up! Test Hero → Level 6')).toBeInTheDocument();
      expect(screen.getByText('Level 2 of 3 (to Level 6)')).toBeInTheDocument();
    });

    it('resets state when modal reopens', () => {
      const { rerender } = render(<LevelUpModal {...defaultProps} isOpen={false} />);

      // Reopen the modal
      rerender(<LevelUpModal {...defaultProps} isOpen={true} />);

      // Should be on attributes step with no changes
      expect(screen.getByText('You have 2 attribute points to spend')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next: roll hit points/i })).toBeDisabled();
    });
  });

  describe('Attributes Step - Normal Mode', () => {
    it('displays current attribute values correctly', () => {
      render(<LevelUpModal {...defaultProps} />);

      expect(screen.getByText('14 → 14 (+2)')).toBeInTheDocument(); // STR
      expect(screen.getByText('12 → 12 (+1)')).toBeInTheDocument(); // CON
      expect(screen.getByText('16 → 16 (+3)')).toBeInTheDocument(); // DEX
      expect(screen.getByText('10 → 10 (+0)')).toBeInTheDocument(); // INT
      expect(screen.getByText('13 → 13 (+1)')).toBeInTheDocument(); // WIS
      expect(screen.getByText('8 → 8 (-1)')).toBeInTheDocument();   // CHA
    });

    it('allows adding points to attributes within normal mode rules', () => {
      render(<LevelUpModal {...defaultProps} />);

      // Click + button for STR
      const strPlusButton = screen.getAllByText('+')[0]; // First + button should be STR
      fireEvent.click(strPlusButton);

      expect(screen.getByText('14 → 15 (+2)')).toBeInTheDocument();
      expect(screen.getByText('You have 1 attribute points to spend')).toBeInTheDocument();
    });

    it('enforces normal mode restrictions - max 1 point per attribute', () => {
      render(<LevelUpModal {...defaultProps} />);

      // Add 1 point to STR
      const strPlusButton = screen.getAllByText('+')[0];
      fireEvent.click(strPlusButton);

      // Try to add another point to STR - should be disabled
      expect(strPlusButton).toBeDisabled();
    });

    it('enforces normal mode restrictions - max 2 different attributes', () => {
      render(<LevelUpModal {...defaultProps} />);

      // Add points to STR and CON
      const strPlusButton = screen.getAllByText('+')[0];
      const conPlusButton = screen.getAllByText('+')[1];

      fireEvent.click(strPlusButton);
      fireEvent.click(conPlusButton);

      // All other + buttons should be disabled
      const allPlusButtons = screen.getAllByText('+');
      expect(allPlusButtons[2]).toBeDisabled(); // DEX
      expect(allPlusButtons[3]).toBeDisabled(); // INT
      expect(allPlusButtons[4]).toBeDisabled(); // WIS
      expect(allPlusButtons[5]).toBeDisabled(); // CHA
    });

    it('allows removing points that were added', () => {
      render(<LevelUpModal {...defaultProps} />);

      // Add a point to STR
      const strPlusButton = screen.getAllByText('+')[0];
      fireEvent.click(strPlusButton);

      // Remove the point
      const strMinusButton = screen.getAllByText('-')[0];
      fireEvent.click(strMinusButton);

      expect(screen.getByText('14 → 14 (+2)')).toBeInTheDocument();
      expect(screen.getByText('You have 2 attribute points to spend')).toBeInTheDocument();
    });

    it('prevents reducing attributes below their original values', () => {
      render(<LevelUpModal {...defaultProps} />);

      // Try to reduce STR below 14 - minus button should be disabled
      const strMinusButton = screen.getAllByText('-')[0];
      expect(strMinusButton).toBeDisabled();
    });

    it('respects attribute caps based on level', () => {
      // Character at level 4 should have cap of 20
      render(<LevelUpModal {...defaultProps} />);

      expect(screen.getByText(/Cap: 20 \(\+5\)/)).toBeInTheDocument();
    });

    it('enables Next button only when exactly 2 points are spent', () => {
      render(<LevelUpModal {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next: roll hit points/i });
      expect(nextButton).toBeDisabled();

      // Add 1 point
      const strPlusButton = screen.getAllByText('+')[0];
      fireEvent.click(strPlusButton);
      expect(nextButton).toBeDisabled();

      // Add second point to different attribute
      const conPlusButton = screen.getAllByText('+')[1];
      fireEvent.click(conPlusButton);
      expect(nextButton).toBeEnabled();
    });
  });

  describe('Attributes Step - Advanced Mode', () => {
    it('allows switching to advanced mode', () => {
      render(<LevelUpModal {...defaultProps} />);

      const advancedModeCheckbox = screen.getByRole('checkbox', { name: /advanced mode/i });
      fireEvent.click(advancedModeCheckbox);

      expect(screen.getByText('You have 20 points available (flexible allocation)')).toBeInTheDocument();
      expect(screen.getByText(/Higher cap \(30\)/)).toBeInTheDocument();
    });

    it('resets attribute changes when switching to advanced mode', () => {
      render(<LevelUpModal {...defaultProps} />);

      // Add points in normal mode
      const strPlusButton = screen.getAllByText('+')[0];
      fireEvent.click(strPlusButton);

      // Switch to advanced mode
      const advancedModeCheckbox = screen.getByRole('checkbox', { name: /advanced mode/i });
      fireEvent.click(advancedModeCheckbox);

      // Changes should be reset
      expect(screen.getByText('14 → 14 (+2)')).toBeInTheDocument();
    });

    it('allows more flexible point allocation in advanced mode', () => {
      render(<LevelUpModal {...defaultProps} />);

      // Switch to advanced mode
      const advancedModeCheckbox = screen.getByRole('checkbox', { name: /advanced mode/i });
      fireEvent.click(advancedModeCheckbox);

      // Should be able to add multiple points to same attribute
      const strPlusButton = screen.getAllByText('+')[0];
      fireEvent.click(strPlusButton);
      fireEvent.click(strPlusButton);
      fireEvent.click(strPlusButton);

      expect(screen.getByText('14 → 17 (+3)')).toBeInTheDocument();
      expect(screen.getByText('You have 17 points available (flexible allocation)')).toBeInTheDocument();
    });

    it('enforces higher attribute cap in advanced mode', () => {
      render(<LevelUpModal {...defaultProps} />);

      const advancedModeCheckbox = screen.getByRole('checkbox', { name: /advanced mode/i });
      fireEvent.click(advancedModeCheckbox);

      expect(screen.getByText(/Higher cap \(30\)/)).toBeInTheDocument();
    });

    it('allows proceeding with any positive allocation in advanced mode', () => {
      render(<LevelUpModal {...defaultProps} />);

      const advancedModeCheckbox = screen.getByRole('checkbox', { name: /advanced mode/i });
      fireEvent.click(advancedModeCheckbox);

      // Add just 1 point
      const strPlusButton = screen.getAllByText('+')[0];
      fireEvent.click(strPlusButton);

      const nextButton = screen.getByRole('button', { name: /next: roll hit points/i });
      expect(nextButton).toBeEnabled();
    });
  });

  describe('Hit Points Step', () => {
    beforeEach(() => {
      render(<LevelUpModal {...defaultProps} />);

      // Navigate to HP step by completing attributes
      const strPlusButton = screen.getAllByText('+')[0];
      const conPlusButton = screen.getAllByText('+')[1];
      fireEvent.click(strPlusButton);
      fireEvent.click(conPlusButton);

      const nextButton = screen.getByRole('button', { name: /next: roll hit points/i });
      fireEvent.click(nextButton);
    });

    it('displays hit die information correctly', () => {
      expect(screen.getByText(/Roll for hit points using your 1d8/)).toBeInTheDocument();
      expect(screen.getByText(/CON modifier: \+1/)).toBeInTheDocument();
      expect(screen.getByText(/reroll results ≤ modifier/)).toBeInTheDocument();
    });

    it('allows manual HP input', () => {
      const hpInput = screen.getByPlaceholderText('1-8');
      const setHPButton = screen.getByRole('button', { name: /set hp/i });

      fireEvent.change(hpInput, { target: { value: '6' } });
      fireEvent.click(setHPButton);

      expect(screen.getByText('+6 HP')).toBeInTheDocument();
      expect(screen.getByText('New Max HP: 28')).toBeInTheDocument();
    });

    it('validates manual HP input against hit die limits', () => {
      const hpInput = screen.getByPlaceholderText('1-8');

      fireEvent.change(hpInput, { target: { value: '10' } });
      expect(screen.getByText('Maximum 8 HP for 1d8')).toBeInTheDocument();

      fireEvent.change(hpInput, { target: { value: '6' } });
      expect(screen.getByText('Valid HP gain')).toBeInTheDocument();
    });

    it('warns about low rolls that should be rerolled', () => {
      const hpInput = screen.getByPlaceholderText('1-8');

      // CON modifier is +1, so rolls of 1 should be rerolled
      fireEvent.change(hpInput, { target: { value: '1' } });
      expect(screen.getByText('Low roll - would normally be rerolled')).toBeInTheDocument();
    });

    it('allows automatic HP rolling', () => {
      const rollButton = screen.getByRole('button', { name: /🎲 roll automatically/i });
      fireEvent.click(rollButton);

      // Should show a roll result
      expect(screen.getByText(/\+\d+ HP/)).toBeInTheDocument();
      expect(screen.getByText(/New Max HP:/)).toBeInTheDocument();
    });

    it('allows rerolling HP', () => {
      // First roll
      const rollButton = screen.getByRole('button', { name: /🎲 roll automatically/i });
      fireEvent.click(rollButton);

      // Reroll
      const rerollButton = screen.getByRole('button', { name: /🎲 reroll/i });
      fireEvent.click(rerollButton);

      expect(screen.getByText(/\+\d+ HP/)).toBeInTheDocument();
    });

    it('allows changing HP after rolling', () => {
      // Roll HP
      const rollButton = screen.getByRole('button', { name: /🎲 roll automatically/i });
      fireEvent.click(rollButton);

      // Change HP
      const changeButton = screen.getByRole('button', { name: /change hp/i });
      fireEvent.click(changeButton);

      // Should be back to input state
      expect(screen.getByPlaceholderText('1-8')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🎲 roll automatically/i })).toBeInTheDocument();
    });

    it('enables Next button only after HP is set', () => {
      const nextButton = screen.getByRole('button', { name: /next: confirm/i });
      expect(nextButton).toBeDisabled();

      // Set HP
      const hpInput = screen.getByPlaceholderText('1-8');
      const setHPButton = screen.getByRole('button', { name: /set hp/i });
      fireEvent.change(hpInput, { target: { value: '5' } });
      fireEvent.click(setHPButton);

      expect(nextButton).toBeEnabled();
    });

    it('allows going back to attributes step', () => {
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(screen.getByText('You have 0 attribute points to spend')).toBeInTheDocument();
    });
  });

  describe('Hit Points Step - Advanced Mode', () => {
    beforeEach(() => {
      render(<LevelUpModal {...defaultProps} />);

      // Switch to advanced mode
      const advancedModeCheckbox = screen.getByRole('checkbox', { name: /advanced mode/i });
      fireEvent.click(advancedModeCheckbox);

      // Add a point and proceed
      const strPlusButton = screen.getAllByText('+')[0];
      fireEvent.click(strPlusButton);

      const nextButton = screen.getByRole('button', { name: /next: roll hit points/i });
      fireEvent.click(nextButton);
    });

    it('allows higher HP values in advanced mode', () => {
      expect(screen.getByText('Set your hit point gain manually or roll normally')).toBeInTheDocument();

      const hpInput = screen.getByPlaceholderText('Enter HP gain');
      const setHPButton = screen.getByRole('button', { name: /set hp/i });

      fireEvent.change(hpInput, { target: { value: '25' } });
      fireEvent.click(setHPButton);

      expect(screen.getByText('+25 HP')).toBeInTheDocument();
    });

    it('enforces maximum 50 HP in advanced mode', () => {
      const hpInput = screen.getByPlaceholderText('Enter HP gain');

      fireEvent.change(hpInput, { target: { value: '60' } });
      expect(screen.getByText('Maximum 50 HP in advanced mode')).toBeInTheDocument();
    });
  });

  describe('Confirmation Step', () => {
    beforeEach(async () => {
      render(<LevelUpModal {...defaultProps} />);

      // Navigate through all steps
      // 1. Attributes
      const strPlusButton = screen.getAllByText('+')[0];
      const conPlusButton = screen.getAllByText('+')[1];
      fireEvent.click(strPlusButton);
      fireEvent.click(conPlusButton);

      const nextButton1 = screen.getByRole('button', { name: /next: roll hit points/i });
      fireEvent.click(nextButton1);

      // 2. Hit Points
      const hpInput = screen.getByPlaceholderText('1-8');
      const setHPButton = screen.getByRole('button', { name: /set hp/i });
      fireEvent.change(hpInput, { target: { value: '6' } });
      fireEvent.click(setHPButton);

      const nextButton2 = screen.getByRole('button', { name: /next: confirm/i });
      fireEvent.click(nextButton2);
    });

    it('displays summary of changes correctly', () => {
      expect(screen.getByText('Confirm your level up changes:')).toBeInTheDocument();

      // Attribute changes
      expect(screen.getByText('Attribute Changes')).toBeInTheDocument();
      expect(screen.getByText('STR:')).toBeInTheDocument();
      expect(screen.getByText('14 → 15')).toBeInTheDocument();
      expect(screen.getByText('CON:')).toBeInTheDocument();
      expect(screen.getByText('12 → 13')).toBeInTheDocument();

      // HP changes
      expect(screen.getByText('Hit Points')).toBeInTheDocument();
      expect(screen.getByText('HP Gained:')).toBeInTheDocument();
      expect(screen.getByText('+6')).toBeInTheDocument();
      expect(screen.getByText('New Max HP:')).toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();
    });

    it('allows going back to hit points step', () => {
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(screen.getByText('Roll for hit points using your 1d8')).toBeInTheDocument();
    });

    it('submits level up changes successfully', async () => {
      const levelUpButton = screen.getByRole('button', { name: /🎉 level up!/i });
      fireEvent.click(levelUpButton);

      expect(levelUpButton).toHaveTextContent('Applying Changes...');
      expect(levelUpButton).toBeDisabled();

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/character/test-char-1/level-up', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newLevel: 4,
            newXP: 2100,
            attributeChanges: {
              STR: 1,
              CON: 1,
              DEX: 0,
              INT: 0,
              WIS: 0,
              CHA: 0,
            },
            hpGain: 6,
            advancedMode: false,
          }),
        });
      });

      expect(mockOnLevelUpComplete).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const levelUpButton = screen.getByRole('button', { name: /🎉 level up!/i });
      fireEvent.click(levelUpButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error applying level up:', expect.any(Error));
      });

      // Button should be re-enabled after error
      expect(levelUpButton).toBeEnabled();
      expect(levelUpButton).toHaveTextContent('🎉 Level Up!');

      consoleSpy.mockRestore();
    });
  });

  describe('Multi-Level Progression Scenarios', () => {
    it('handles single level progression', () => {
      render(<LevelUpModal {...defaultProps} />);

      expect(screen.getByText('🎉 Level Up! Test Hero → Level 4')).toBeInTheDocument();
      expect(screen.queryByText(/Level \d+ of \d+/)).not.toBeInTheDocument();
    });

    it('handles multi-level progression sequence', () => {
      const multiLevelProps = {
        ...defaultProps,
        newLevel: 7,
        sequenceInfo: {
          currentStep: 3,
          totalSteps: 4,
          targetLevel: 7
        }
      };

      render(<LevelUpModal {...multiLevelProps} />);

      expect(screen.getByText('🎉 Level Up! Test Hero → Level 7')).toBeInTheDocument();
      expect(screen.getByText('Level 3 of 4 (to Level 7)')).toBeInTheDocument();
    });

    it('handles massive XP jumps requiring multiple level ups', () => {
      const massiveJumpProps = {
        ...defaultProps,
        character: {
          ...mockCharacter,
          currentLevel: 1
        },
        newLevel: 10,
        sequenceInfo: {
          currentStep: 9,
          totalSteps: 9,
          targetLevel: 10
        }
      };

      render(<LevelUpModal {...massiveJumpProps} />);

      expect(screen.getByText('🎉 Level Up! Test Hero → Level 10')).toBeInTheDocument();
      expect(screen.getByText('Level 9 of 9 (to Level 10)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles character with no class', () => {
      const noClassProps = {
        ...defaultProps,
        character: {
          ...mockCharacter,
          class: null
        }
      };

      render(<LevelUpModal {...noClassProps} />);

      // Navigate to HP step
      const strPlusButton = screen.getAllByText('+')[0];
      const conPlusButton = screen.getAllByText('+')[1];
      fireEvent.click(strPlusButton);
      fireEvent.click(conPlusButton);

      const nextButton = screen.getByRole('button', { name: /next: roll hit points/i });
      fireEvent.click(nextButton);

      // Should default to 1d6
      expect(screen.getByText(/Roll for hit points using your 1d6/)).toBeInTheDocument();
    });

    it('handles high CON modifier affecting HP rolls', () => {
      const highConProps = {
        ...defaultProps,
        character: {
          ...mockCharacter,
          currentCON: 20 // +5 modifier
        }
      };

      render(<LevelUpModal {...highConProps} />);

      // Navigate to HP step - add 2 points (STR and DEX since CON is maxed at 20)
      const strPlusButton = screen.getAllByText('+')[0];
      const dexPlusButton = screen.getAllByText('+')[2]; // DEX is third attribute
      fireEvent.click(strPlusButton);
      fireEvent.click(dexPlusButton);

      const nextButton = screen.getByRole('button', { name: /next: roll hit points/i });
      fireEvent.click(nextButton);

      expect(screen.getByText(/CON modifier: \+5/)).toBeInTheDocument();
    });

    it('handles attribute caps correctly for different levels', () => {
      // Test level 8 (should have cap of 22)
      const level8Props = {
        ...defaultProps,
        newLevel: 8
      };

      render(<LevelUpModal {...level8Props} />);

      expect(screen.getByText(/Cap: 22 \(\+6\)/)).toBeInTheDocument();
    });

    it('handles maximum level character', () => {
      const maxLevelProps = {
        ...defaultProps,
        newLevel: 14
      };

      render(<LevelUpModal {...maxLevelProps} />);

      expect(screen.getByText(/Cap: 24 \(\+7\)/)).toBeInTheDocument();
    });
  });

  describe('Navigation and State Management', () => {
    it('maintains state when navigating between steps', () => {
      render(<LevelUpModal {...defaultProps} />);

      // Make changes in attributes step
      const strPlusButton = screen.getAllByText('+')[0];
      const conPlusButton = screen.getAllByText('+')[1];
      fireEvent.click(strPlusButton);
      fireEvent.click(conPlusButton);

      // Go to HP step
      const nextButton = screen.getByRole('button', { name: /next: roll hit points/i });
      fireEvent.click(nextButton);

      // Go back to attributes
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      // Changes should be preserved
      expect(screen.getByText('14 → 15 (+2)')).toBeInTheDocument(); // STR
      expect(screen.getByText('12 → 13 (+1)')).toBeInTheDocument(); // CON
    });

    it('prevents modal from being closed during submission', async () => {
      render(<LevelUpModal {...defaultProps} />);

      // Complete all steps
      const strPlusButton = screen.getAllByText('+')[0];
      const conPlusButton = screen.getAllByText('+')[1];
      fireEvent.click(strPlusButton);
      fireEvent.click(conPlusButton);

      const nextButton1 = screen.getByRole('button', { name: /next: roll hit points/i });
      fireEvent.click(nextButton1);

      const hpInput = screen.getByPlaceholderText('1-8');
      const setHPButton = screen.getByRole('button', { name: /set hp/i });
      fireEvent.change(hpInput, { target: { value: '6' } });
      fireEvent.click(setHPButton);

      const nextButton2 = screen.getByRole('button', { name: /next: confirm/i });
      fireEvent.click(nextButton2);

      // Mock a slow API response
      (fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 1000))
      );

      const levelUpButton = screen.getByRole('button', { name: /🎉 level up!/i });
      fireEvent.click(levelUpButton);

      // Back buttons should be disabled during submission
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeDisabled();
    });
  });
});