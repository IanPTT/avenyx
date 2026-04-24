import './globals.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Avenyx Admin',
  description: 'Admin panel for Avenyx VPN'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="flex">
          <aside className="sidebar bg-gray-900 text-white">
            <div className="p-4 border-b border-gray-800">
              <h1 className="text-xl font-bold">Avenyx Admin</h1>
            </div>
            <nav className="p-4 space-y-2">
              <Link href="/users" className="block p-2 rounded hover:bg-gray-800">Users</Link>
              <Link href="/payments" className="block p-2 rounded hover:bg-gray-800">Payments</Link>
              <Link href="/nodes" className="block p-2 rounded hover:bg-gray-800">Nodes</Link>
              <Link href="/plans" className="block p-2 rounded hover:bg-gray-800">Plans</Link>
            </nav>
          </aside>
          <main className="flex-1 bg-gray-50 min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  );
}