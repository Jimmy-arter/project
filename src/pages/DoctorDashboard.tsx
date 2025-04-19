import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, startOfDay, endOfDay } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Calendar, Clock, User, CalendarX } from 'lucide-react';
import type { Appointment } from '../../types';

const DoctorDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const start = startOfDay(selectedDate);
        const end = endOfDay(selectedDate);

        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('date', '>=', start),
          where('date', '<=', end)
        );

        const querySnapshot = await getDocs(appointmentsQuery);

        const fetchedAppointments = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            date: data.date.toDate(),
            status: data.status,
            patientName: data.patientName
          } as Appointment;
        });

        // Sort appointments by time
        fetchedAppointments.sort((a, b) => a.date.getTime() - b.date.getTime());

        setAppointments(fetchedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [selectedDate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-6">Appointment Calendar</h2>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="border rounded-lg p-4"
          />
        </div>

        {/* Appointments List */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-6">Appointments on {format(selectedDate, 'PPP')}</h2>

          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-500">Loading appointments...</p>
            ) : appointments.length ? (
              appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <User className="text-gray-500" />
                      <span className="font-medium">{appointment.patientName}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="text-gray-500" />
                      <span>{format(appointment.date, 'HH:mm')}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      appointment.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 flex items-center gap-2 mt-4">
                <CalendarX className="w-5 h-5" />
                No appointments for this date.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
