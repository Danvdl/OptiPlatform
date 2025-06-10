import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <h2 className="logo">OptiPlatform</h2>
      <ul>
        <li>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </li>
      </ul>
    </nav>
  );
}
