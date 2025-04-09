import React, { useState, useEffect, FormEvent } from 'react';
import {
  collection,
  query,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Trash2,
  UserCheck,
  UserX,
  Users,
  Calendar,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  name?: string;
  specialization?: string;
  phone?: string;
  profilePhotoUrl?: string;
}

interface Appointment {
  id: string;
  doctorName: string;
  patientName: string;
  appointmentDate: string;
  status: string;
}

interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state for adding a doctor
  const [doctorName, setDoctorName] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorSpecialization, setDoctorSpecialization] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorPhotoUrl, setDoctorPhotoUrl] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    // Refresh token to ensure custom claims are up-to-date.
    currentUser.getIdToken(true)
      .then(() => {
        fetchUsers();
        fetchAppointmentStats();
        fetchAppointments();
      })
      .catch((err) => {
        console.error('Token refresh error:', err);
        setError('Failed to refresh token');
        setLoading(false);
      });
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      const usersData = usersSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as User));
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentStats = async () => {
    try {
      setLoading(true);
      const appointmentsRef = collection(db, 'appointments');
      const appointmentsSnap = await getDocs(appointmentsRef);
      
      const stats = appointmentsSnap.docs.reduce((acc, docSnap) => {
        const status = docSnap.data().status;
        return {
          total: acc.total + 1,
          pending: status === 'pending' ? acc.pending + 1 : acc.pending,
          confirmed: status === 'confirmed' ? acc.confirmed + 1 : acc.confirmed,
          cancelled: status === 'cancelled' ? acc.cancelled + 1 : acc.cancelled,
        };
      }, { total: 0, pending: 0, confirmed: 0, cancelled: 0 });
      setStats(stats);
    } catch (err) {
      console.error('Failed to fetch appointment stats:', err);
      setError('Failed to fetch appointment stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsRef = collection(db, 'appointments');
      const appointmentsSnap = await getDocs(appointmentsRef);
      const appointmentsData = appointmentsSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Appointment));
      setAppointments(appointmentsData);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: !currentStatus
      });
      fetchUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status');
    }
  };

  const handleAddDoctor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Create a new doctor in the "users" collection with role "doctor"
      await addDoc(collection(db, 'users'), {
        name: doctorName,
        email: doctorEmail,
        specialization: doctorSpecialization,
        phone: doctorPhone,
        profilePhotoUrl: doctorPhotoUrl,
        role: 'doctor',
        isActive: true,
        createdAt: serverTimestamp(),
      });
      // Clear form fields
      setDoctorName('');
      setDoctorEmail('');
      setDoctorSpecialization('');
      setDoctorPhone('');
      setDoctorPhotoUrl('');
      fetchUsers();
    } catch (err) {
      console.error('Error adding doctor:', err);
      setError('Failed to add doctor');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Users</p>
              <h3 className="text-2xl font-bold">{users.length}</h3>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Appointments</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Pending Appointments</p>
              <h3 className="text-2xl font-bold">{stats.pending}</h3>
            </div>
            <Activity className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Completed Appointments</p>
              <h3 className="text-2xl font-bold">{stats.confirmed}</h3>
            </div>
            <UserCheck className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Add Doctor Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Doctor</h2>
        <form onSubmit={handleAddDoctor} className="grid grid-cols-1 gap-4">
          <input
            type="text"
            placeholder="Doctor Name"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            type="email"
            placeholder="Doctor Email"
            value={doctorEmail}
            onChange={(e) => setDoctorEmail(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Specialization"
            value={doctorSpecialization}
            onChange={(e) => setDoctorSpecialization(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={doctorPhone}
            onChange={(e) => setDoctorPhone(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Profile Photo URL"
            value={doctorPhotoUrl}
            onChange={(e) => setDoctorPhotoUrl(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            Add Doctor
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'doctor'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                        className={`p-1 rounded-full ${
                          user.isActive
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {user.isActive ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 text-red-600 hover:text-red-900 rounded-full"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Booked Appointments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{appt.doctorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{appt.patientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(appt.appointmentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      appt.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : appt.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {appt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
