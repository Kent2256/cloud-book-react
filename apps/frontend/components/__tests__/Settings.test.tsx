import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import Settings from '../Settings';
import { renderWithProviders } from '../../test-utils';
import { validateApiKey } from '../../services/geminiService';

// Mock validateApiKey from services
vi.mock('../../services/geminiService', () => ({
  validateApiKey: vi.fn()
}));

const mockedValidateApiKey = vi.mocked(validateApiKey);

describe('Settings BYOK UI', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  test('saves key to localStorage and tests models for dev-code', async () => {
    // dev-code should return a model list
    mockedValidateApiKey.mockResolvedValueOnce({ valid: true, models: ['gemini-3-flash-preview'] });

    renderWithProviders(<Settings />);

    fireEvent.click(screen.getByLabelText('撅?'));
    const input = screen.getByPlaceholderText(/頛詨 API Key/i);
    fireEvent.change(input, { target: { value: '6yhn%TGB' } });

    const saveButton = screen.getByText('?脣?');
    fireEvent.click(saveButton);

    expect(localStorage.getItem('user_gemini_key')).toBe('6yhn%TGB');

    const testButton = screen.getByText(/皜祈岫銝行??芋??i);
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockedValidateApiKey).toHaveBeenCalledWith('6yhn%TGB');
    });

    await waitFor(() => screen.getByText('gemini-3-flash-preview'));
    expect(screen.getByText('gemini-3-flash-preview')).toBeInTheDocument();
  });

  test('shows invalid message for bad key', async () => {
    mockedValidateApiKey.mockResolvedValueOnce({ valid: false, models: [] });

    renderWithProviders(<Settings />);

    fireEvent.click(screen.getByLabelText('撅?'));
    const input = screen.getByPlaceholderText(/頛詨 API Key/i);
    fireEvent.change(input, { target: { value: 'invalid-key' } });

    const saveButton = screen.getByText('?脣?');
    fireEvent.click(saveButton);

    const testButton = screen.getByText(/皜祈岫銝行??芋??i);
    fireEvent.click(testButton);

    await waitFor(() => expect(mockedValidateApiKey).toHaveBeenCalledWith('invalid-key'));
    await waitFor(() => screen.getByText(/Key ?⊥?????冽芋??i));
  });
});
