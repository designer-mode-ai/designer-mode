import type { ReactNode, MouseEventHandler } from 'react';
import './PrimaryButton.css';

interface Props {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

export default function PrimaryButton({ children, onClick, disabled }: Props) {
  return (
    <button
      className="primary-button"
      onClick={onClick}
      disabled={disabled}
      data-testid="primary-button"
    >
      {children}
    </button>
  );
}
