import type { ReactNode } from 'react';
import './Card.css';

interface Props {
  title: string;
  children: ReactNode;
}

export default function Card({ title, children }: Props) {
  return (
    <div className="card" data-testid="card">
      <h2 className="card-title">{title}</h2>
      <div className="card-body">{children}</div>
    </div>
  );
}
