import React, { useState } from 'react';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter signup logic would go here
    setEmail('');
  };

  return (
    <footer className="bg-glass text-white/90 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Health System</h3>
            <p className="text-white/70 mb-4">
              Providing quality healthcare services with modern technology and compassionate care.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" className="hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" className="hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" className="hover:text-blue-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-white/70 hover:text-white transition-colors">Home</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <p className="flex items-center text-white/70">
                <MapPin className="h-5 w-5 mr-2" />
                123 Healthcare Ave, Medical District
              </p>
              <p className="flex items-center text-white/70">
                <Phone className="h-5 w-5 mr-2" />
                +254 (555) 123-4567
              </p>
              <p className="flex items-center text-white/70">
                <Mail className="h-5 w-5 mr-2" />
                contact@healthsystem.com
              </p>
            </div>
          </div>

         
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-white/70 text-sm">
              © {new Date().getFullYear()} Health System. All rights reserved.
            </p>
            <div className="flex space-x-4 text-sm text-white/70">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}