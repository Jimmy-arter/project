import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserPlus } from 'lucide-react';

// List of available doctor specializations with descriptions
type Specialization = {
  value: string;
  label: string;
};

const specializations: Specialization[] = [
  { value: 'cardiology', label: 'Cardiology - Diagnosis and treatment of heart conditions' },
  { value: 'dermatology', label: 'Dermatology - Skin, hair, and nail disorders' },
  { value: 'neurology', label: 'Neurology - Disorders of the nervous system' },
  { value: 'pediatrics', label: 'Pediatrics - Medical care of infants and children' },
  { value: 'orthopedics', label: 'Orthopedics - Musculoskeletal system issues' },
  { value: 'psychiatry', label: 'Psychiatry - Mental health and behavioral disorders' },
  { value: 'radiology', label: 'Radiology - Medical imaging and diagnostics' }
];

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [specialization, setSpecialization] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const { user } = await signup(email, password);

      // Prepare user data
      const userData: any = {
        email,
        fullname,
        gender,
        phone,
        role,
        createdAt: new Date().toISOString(),
      };

      // Add role-specific fields
      if (role === 'doctor') {
        userData.specialization = specialization;
      } else if (role === 'patient') {
        userData.address = address;
      }

      // Save user document
      await setDoc(doc(db, 'users', user.uid), userData);

      // Redirect based on role
      switch (role) {
        case 'patient':
          navigate('/patient-dashboard');
          break;
        case 'doctor':
          navigate('/doctor-dashboard');
          break;
        default:
          navigate('/patient-dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create an account');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white px-8 py-6 rounded-lg shadow-md">
          <div className="flex justify-center mb-6">
            <UserPlus className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-center text-2xl font-bold mb-6">Sign Up</h2>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-4">
              <label htmlFor="fullname" className="block text-gray-700 text-sm font-bold mb-2">
                Full Name
              </label>
              <input
                id="fullname"
                type="text"
                className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Gender */}
            <div className="mb-4">
              <label htmlFor="gender" className="block text-gray-700 text-sm font-bold mb-2">
                Gender
              </label>
              <select
                id="gender"
                className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            {/* Role */}
            <div className="mb-6">
              <label htmlFor="role" className="block text-gray-700 text-sm font-bold mb-2">
                Role
              </label>
              <select
                id="role"
                className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                value={role}
                onChange={(e) => setRole(e.target.value as 'patient' | 'doctor')}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {/* Specialization for Doctor */}
            {role === 'doctor' && (
              <div className="mb-6">
                <label htmlFor="specialization" className="block text-gray-700 text-sm font-bold mb-2">
                  Specialization
                </label>
                <select
                  id="specialization"
                  className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                >
                  <option value="">Select a specialization...</option>
                  {specializations.map((spec) => (
                    <option key={spec.value} value={spec.value}>
                      {spec.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Address for Patient */}
            {role === 'patient' && (
              <div className="mb-6">
                <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">
                  Address
                </label>
                <input
                  id="address"
                  type="text"
                  className="shadow border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Sign Up
            </button>
          </form>
          <div className="text-center mt-4">
            <a href="/login" className="text-blue-500 hover:text-blue-700">
              Already have an account? Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
