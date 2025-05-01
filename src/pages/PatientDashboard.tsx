import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { format, isBefore, startOfDay, parse } from 'date-fns';

// Specializations list
const specializations = [
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'radiology', label: 'Radiology' }
];

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

interface Doctor {
  id: string;
  fullname?: string;
  email?: string;
  specialization: string;
}

export default function PatientDashboard() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch doctors
    const fetchDoctors = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...(docSnap.data() as any) }));
        setDoctors(list);
        setFilteredDoctors(list);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load doctors');
      }
    };

    // Listen for appointments
    const unsub = onSnapshot(
      query(collection(db, 'appointments'), where('patientId', '==', currentUser.uid)),
      async snap => {
        const list = await Promise.all(
          snap.docs.map(async docSnap => {
            const data = docSnap.data();
            const userDoc = await getDoc(doc(db, 'users', data.doctorId));
            const doctorName = userDoc.exists() ? (userDoc.data().fullname || userDoc.data().email) : 'Unknown';
            return { id: docSnap.id, ...data, doctorName } as Appointment;
          })
        );
        setAppointments(list);
        setLoading(false);
      },
      err => {
        console.error('Appointments listener error:', err);
        setError('Failed to load appointments');
        setLoading(false);
      }
    );

    fetchDoctors();
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedSpecialization) {
      setFilteredDoctors(doctors);
    } else {
      setFilteredDoctors(doctors.filter(d => d.specialization === selectedSpecialization));
      setSelectedDoctor('');
    }
  }, [selectedSpecialization, doctors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic frontend validations
    if (!selectedDoctor) {
      setError('Please select a doctor');
      return;
    }
    if (!date) {
      setError('Please choose a date');
      return;
    }
    if (!time) {
      setError('Please choose a time');
      return;
    }

    // Validate date is future
    const selDate = parse(date, 'yyyy-MM-dd', new Date());
    if (isBefore(selDate, startOfDay(new Date()))) {
      setError('Please select a future date');
      return;
    }

    // Validate time range
    if (time < '07:00' || time > '16:00') {
      setError('Booking time must be between 07:00 and 16:00');
      return;
    }

    // Log payload for debugging
    const payload = {
      patientId: currentUser.uid,
      doctorId: selectedDoctor,
      date,
      time,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    console.log('Attempting to book appointment with payload:', payload);

    try {
      // Conflict check
      const conflictQ = query(
        collection(db, 'appointments'),
        where('doctorId', '==', selectedDoctor),
        where('date', '==', date),
        where('time', '==', time),
        where('status', '!=', 'cancelled')
      );
      const conflictSnap = await getDocs(conflictQ);
      if (!conflictSnap.empty) {
        setError('That doctor is already booked at this time');
        return;
      }

      // Create appointment
      const docRef = await addDoc(collection(db, 'appointments'), payload);
      console.log('Appointment booked, document ID:', docRef.id);
      setSuccess('Appointment booked successfully!');
      setDate('');
      setTime('');
      setSelectedDoctor('');
      setSelectedSpecialization('');
    } catch (err: any) {
      console.error('Booking error:', err.code, err.message);
      setError(`Booking failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Booked Appointments List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-blue-500" /> My Appointments
          </h2>
          {appointments.length === 0 ? (
            <p className="text-gray-500">No appointments scheduled</p>
          ) : (
            <div className="space-y-4">
              {appointments.map(app => (
                <div key={app.id} className="border rounded-lg p-4 hover:shadow-md">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium">{app.doctorName}</span>
                    </div>
                    <span className="text-sm">Booked at: {format(new Date(app.createdAt), 'PPpp')}</span>
                  </div>
                  <div className="mt-2 flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{format(new Date(`${app.date}T${app.time}`), 'PPp')}</span>
                  </div>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      app.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      app.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
                    `}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Book a New Appointment</h2>
            <p className="text-sm text-gray-600 mt-1">Available hours: 07:00 - 16:00</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {(error || success) && (
              <div className={`${error ? 'bg-red-50 border-red-400 text-red-700' : 'bg-green-50 border-green-400 text-green-700'} border-l-4 p-4 flex items-center`}>
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error || success}</p>
              </div>
            )}

            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
              <select
                value={selectedSpecialization}
                onChange={e => setSelectedSpecialization(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Specializations</option>
                {specializations.map(spec => <option key={spec.value} value={spec.value}>{spec.label}</option>)}
              </select>
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
              <select
                value={selectedDoctor}
                onChange={e => setSelectedDoctor(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a doctor</option>
                {filteredDoctors.map(d => <option key={d.id} value={d.id}>{d.fullname || d.email}</option>)}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                min="07:00"
                max="16:00"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Book Appointment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

