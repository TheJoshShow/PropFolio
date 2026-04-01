import React from 'react';
import { TextInput, type TextInputProps } from './TextInput';

/**
 * AppInput is a thin alias to the themed TextInput so we can swap
 * implementation details later without touching every screen.
 */
export function AppInput(props: TextInputProps) {
  return <TextInput {...props} />;
}

