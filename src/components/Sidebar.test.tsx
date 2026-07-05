import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from './Sidebar';
import { User } from '../types';

const mockUser: User = {
  username: 'testuser',
  name: 'Test User',
  role: 'operator',
};

const adminUser: User = {
  username: 'admin',
  name: 'Admin User',
  role: 'admin',
};

const defaultProps = {
  currentUser: mockUser,
  appName: 'Test App',
  activeTab: 'dashboard',
  setActiveTab: vi.fn(),
  onLogout: vi.fn(),
  onlineCount: 5,
  onlineUsers: [],
  serverInfo: { ips: ['127.0.0.1'], port: 3000 },
  darkMode: false,
  setDarkMode: vi.fn(),
};

describe('Sidebar Component', () => {
  it('renders application name and online count', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByText('5 ONLINE')).toBeInTheDocument();
  });

  it('renders standard menu items', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Agenda Surat')).toBeInTheDocument();
    expect(screen.getByText('PDF Tools')).toBeInTheDocument();
    expect(screen.getByText('Pengaturan')).toBeInTheDocument();
  });

  it('filters admin-only items for operator role', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.queryByText('Pengguna')).not.toBeInTheDocument();
  });

  it('shows admin-only items for admin role', () => {
    render(<Sidebar {...defaultProps} currentUser={adminUser} />);
    expect(screen.getByText('Pengguna')).toBeInTheDocument();
  });

  it('calls setActiveTab when a menu item is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Agenda Surat'));
    expect(defaultProps.setActiveTab).toHaveBeenCalledWith('mails');
  });

  it('calls setDarkMode when the theme toggle is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    const toggleButton = screen.getByTitle('Mode Gelap');
    fireEvent.click(toggleButton);
    expect(defaultProps.setDarkMode).toHaveBeenCalledWith(true);
  });

  it('calls onLogout when the logout button is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    const logoutButton = screen.getByTitle('Keluar Sesi');
    fireEvent.click(logoutButton);
    expect(defaultProps.onLogout).toHaveBeenCalled();
  });

  it('highlights the active tab', () => {
    const { container } = render(<Sidebar {...defaultProps} activeTab="mails" />);
    const activeBtn = screen.getByText('Agenda Surat').closest('button');
    expect(activeBtn).toHaveClass('bg-[var(--md-sys-color-secondary-container)]');
  });
});
