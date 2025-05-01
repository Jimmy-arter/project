import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// User and Appointment types
type Role = 'admin' | 'doctor' | 'patient';
interface User {
  id: string;
  email: string;
  role: Role;
}
interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

// Dashboard stats
type Stats = {
  totalUsers: number;
  doctors: number;
  patients: number;
  admins: number;
  totalAppointments: number;
  pending: number;
  confirmed: number;
  cancelled: number;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<(Appointment & { patientEmail: string; doctorEmail: string })[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    doctors: 0,
    patients: 0,
    admins: 0,
    totalAppointments: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Subscribe to users & appointments
  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        let doctors = 0, patients = 0, adminsCount = 0;
        const userList: User[] = snap.docs.map(docSnap => {
          const data = docSnap.data() as User;
          if (data.role === 'doctor') doctors++;
          if (data.role === 'patient') patients++;
          if (data.role === 'admin') adminsCount++;
          return { id: docSnap.id, email: data.email, role: data.role };
        });
        setUsers(userList);
        setStats(prev => ({ ...prev, totalUsers: userList.length, doctors, patients, admins: adminsCount }));
      },
      (err) => {
        console.error(err);
        setError('Error loading users');
      }
    );

    const unsubApps = onSnapshot(
      collection(db, 'appointments'),
      async (snap) => {
        let pending = 0, confirmed = 0, cancelled = 0;
        const list: (Appointment & { patientEmail: string; doctorEmail: string })[] = [];

        for (const docSnap of snap.docs) {
          const data = docSnap.data() as Appointment;
          if (data.status === 'pending') pending++;
          if (data.status === 'confirmed') confirmed++;
          if (data.status === 'cancelled') cancelled++;

          const [pSnap, dSnap] = await Promise.all([
            getDoc(doc(db, 'users', data.patientId)),
            getDoc(doc(db, 'users', data.doctorId))
          ]);
          const patientEmail = pSnap.exists() ? (pSnap.data().email as string) : 'N/A';
          const doctorEmail = dSnap.exists() ? (dSnap.data().email as string) : 'N/A';

          list.push({ id: docSnap.id, ...data, patientEmail, doctorEmail });
        }

        setAppointments(list);
        setStats(prev => ({
          ...prev,
          totalAppointments: list.length,
          pending,
          confirmed,
          cancelled
        }));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Error loading appointments');
        setLoading(false);
      }
    );

    return () => {
      unsubUsers();
      unsubApps();
    };
  }, []);

  // Change appointment status
  const updateStatus = async (id: string, status: Appointment['status']) => {
    setError('');
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
    } catch (err) {
      console.error(err);
      setError('Failed to update status');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
        {Object.entries(stats).map(([label, value]) => (
          <div key={label} className="bg-white p-4 rounded shadow text-center">
            <p className="text-gray-500 text-sm">{label.replace(/([A-Z])/g, ' $1').trim()}</p>
            <h3 className="text-xl font-semibold">{value}</h3>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4">
          <AlertCircle className="inline-block mr-2" />{error}
        </div>
      )}

      {/* Users Table */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Users</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                  <td className="px-6 py-4 text-sm capitalize">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Appointments Table */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Appointments</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map(app => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{app.patientEmail}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{app.doctorEmail}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{format(parseISO(app.date), 'PP')}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{app.time}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      app.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      app.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
