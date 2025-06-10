import { ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import './MainLayout.css';

interface Props {
  children: ReactNode;
}

export default function MainLayout({ children }: Props) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  );
}
