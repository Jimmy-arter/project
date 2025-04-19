import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar,
  Activity,
  UserCheck,
  XCircle
} from 'lucide-react';

interface Appointment {
  id: string;
  patientName: string;
  appointmentDate: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export default function DoctorDashboard() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    fetchAppointments();
  }, [currentUser]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'appointments'),
        where('doctorId', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
      setAppointments(docs);
      // compute stats
      const tally = docs.reduce(
        (acc, a) => {
          acc.total++;
          acc[a.status]++;
          return acc;
        },
        { total: 0, pending: 0, confirmed: 0, cancelled: 0 }
      );
      setStats(tally);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError('Unable to fetch your appointments.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: Appointment['status']) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      fetchAppointments();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Could not update status.');
    }
  };

  if (loading) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">My Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Appointments</p>
              <h3 className="text-2xl font-semibold">{stats.total}</h3>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Pending</p>
              <h3 className="text-2xl font-semibold">{stats.pending}</h3>
            </div>
            <Activity className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Confirmed</p>
              <h3 className="text-2xl font-semibold">{stats.confirmed}</h3>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Cancelled</p>
              <h3 className="text-2xl font-semibold">{stats.cancelled}</h3>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold">My Appointments</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map(appt => (
              <tr key={appt.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{appt.patientName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(appt.appointmentDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    appt.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : appt.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>{appt.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => updateStatus(appt.id, 'confirmed')}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >Confirm</button>
                  <button
                    onClick={() => updateStatus(appt.id, 'cancelled')}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
