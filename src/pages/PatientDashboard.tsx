import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  role: string;
  email?: string;
}

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch doctors
    const fetchDoctors = async () => {
      try {
        const doctorsRef = collection(db, 'users');
        const q = query(doctorsRef, where('role', '==', 'doctor'));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          console.warn('No doctors found!');
        }
        const doctorsList = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Doctor));
        setDoctors(doctorsList);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load doctors list');
      }
    };

    // Subscribe to appointments with error handling
    const fetchAppointments = () => {
      try {
        const appointmentsRef = collection(db, 'appointments');
        const q = query(appointmentsRef, where('patientId', '==', currentUser.uid));
        
        return onSnapshot(
          q,
          async (snapshot) => {
            const appointmentsPromises = snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              // Fetch doctor's name from the users collection
              const doctorDoc = await getDoc(doc(db, 'users', data.doctorId));
              const doctorName = doctorDoc.exists()
                ? doctorDoc.data().name || doctorDoc.data().email
                : 'Unknown Doctor';
              return {
                id: docSnap.id,
                ...data,
                doctorName
              } as Appointment;
            });

            const appointmentsList = await Promise.all(appointmentsPromises);
            setAppointments(appointmentsList);
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching appointments:', error);
            setError('Failed to load appointments');
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Error setting up appointments listener:', err);
        setError('Failed to load appointments');
        setLoading(false);
      }
    };

    const unsubscribe = fetchAppointments();
    fetchDoctors();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate date
    const selectedDate = new Date(date);
    if (isBefore(selectedDate, startOfDay(new Date()))) {
      setError('Please select a future date');
      return;
    }

    try {
      // Get doctor's name for the appointment
      const doctorDoc = await getDoc(doc(db, 'users', selectedDoctor));
      const doctorName = doctorDoc.exists()
        ? doctorDoc.data().name || doctorDoc.data().email
        : 'Unknown Doctor';

      const newAppointment = {
        patientId: currentUser?.uid,
        doctorId: selectedDoctor,
        doctorName,
        date,
        time,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appointments'), newAppointment);
      setSuccess('Appointment booked successfully!');
      setDate('');
      setTime('');
      setSelectedDoctor('');
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError('Failed to book appointment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-lg transition-transform hover:scale-[1.02] duration-300">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Calendar className="h-6 w-6 mr-2 text-blue-500" />
              My Appointments
            </h2>
          </div>
          <div className="p-6">
            {error && (
              <div className="bg-red-150 border-l-4 border-red-400 p-4 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-center">No appointments scheduled</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-medium">{appointment.doctorName}</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          appointment.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : appointment.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>
                        {format(new Date(`${appointment.date} ${appointment.time}`), 'PPp')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Book Appointment Form */}
        <div className="bg-white rounded-lg shadow-lg transition-transform hover:scale-[1.02] duration-300">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Book a New Appointment</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <p className="text-green-700">{success}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name || doctor.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
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
};

export default PatientDashboard;
