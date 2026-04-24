import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Avenyx - Stealth VPN Access',
  description: 'Secure VPN service for restricted networks'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold gradient-bg text-white px-3 py-1 rounded">
              Avenyx
            </Link>
            <div className="space-x-6">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
              <Link href="/register" className="text-gray-600 hover:text-gray-900">Register</Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}