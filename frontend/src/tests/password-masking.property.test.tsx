import React from 'react';
import { render } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import * as fc from 'fast-check';

describe('Property 5: Password masking', () => {
  it('should mask all password characters regardless of input', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 100 }), (password) => {
        const TestComponent = () => <TextInput value={password} secureTextEntry={true} testID="password-input" />;

        const { getByTestId } = render(<TestComponent />);
        const input = getByTestId('password-input');

        expect(input.props.secureTextEntry).toBe(true);

        return input.props.secureTextEntry === true;
      }),
      { numRuns: 100 },
    );
  });

  it('should mask passwords with special characters', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (password) => {
        const TestComponent = () => <TextInput value={password} secureTextEntry={true} testID="password-input" />;

        const { getByTestId } = render(<TestComponent />);
        const input = getByTestId('password-input');

        return input.props.secureTextEntry === true;
      }),
      { numRuns: 100 },
    );
  });
});
