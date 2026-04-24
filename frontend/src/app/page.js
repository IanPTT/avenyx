import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <section className="gradient-bg py-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-white">
          <h1 className="text-5xl font-bold mb-6">Stealth VPN Access</h1>
          <p className="text-xl mb-8 opacity-90">
            Secure, private, and reliable VPN service designed for restricted networks.
            One-tap connection with automatic configuration.
          </p>
          <div className="space-x-4">
            <Link href="/register" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition">
              Get Started
            </Link>
            <Link href="/login" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition">
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Avenyx?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Secure</h3>
              <p className="text-gray-600">Military-grade encryption to protect your privacy</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Fast</h3>
              <p className="text-gray-600">High-speed servers in India and Germany</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Easy</h3>
              <p className="text-gray-600">One-tap connect with automatic setup</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-gray-600 mb-8">Create an account and start using secure VPN in minutes</p>
          <Link href="/register" className="gradient-bg text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition">
            Create Account
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2024 Avenyx. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}