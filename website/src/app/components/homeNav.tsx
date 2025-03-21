import { Menu } from 'lucide-react';

export default function Main() {
  return (
    <header className="header">
      <h1>
        <a href="/home" className="header-title">
          Able
        </a>
      </h1>
      <div className="header-buttons">
        <button className="button-secondary">
          <span>My Lessons</span>
        </button>
        <button className="button-ghost">
          <Menu color='#a8a8a8' />
        </button>
      </div>
    </header>
  );
}