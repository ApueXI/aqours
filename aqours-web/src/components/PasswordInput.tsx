import { useState, type InputHTMLAttributes } from 'react';

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return <span className="field-password"><input {...props} type={visible ? 'text' : 'password'} autoComplete="new-password" />
    <button type="button" aria-pressed={visible} aria-label={`${visible ? 'Hide' : 'Show'} ${props['aria-label'] || 'password'}`} onClick={() => setVisible(value => !value)}>{visible ? 'Hide' : 'Show'}</button>
  </span>;
}
