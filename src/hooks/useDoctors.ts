import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  isActive: boolean;
  profilePhotoUrl: string;
  phone: string;
  availableSlots: Record<string, string[]>;
}

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wrap the Firestore listener setup in a try-catch in case something goes wrong
    try {
      // Reference to the "users" collection
      const doctorsRef = collection(db, 'users');

      // Query for active doctors
      const doctorsQuery = query(
        doctorsRef,
        where('role', '==', 'doctor'),
        where('isActive', '==', true)
      );

      // Set up a real-time listener
      const unsubscribe = onSnapshot(
        doctorsQuery,
        (snapshot) => {
          const doctorsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Doctor[];
          
          setDoctors(doctorsList);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching doctors:', err);
          setError('Failed to fetch doctors');
          setLoading(false);
        }
      );

      // Clean up the listener when the component unmounts
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up doctors listener:', err);
      setError('Failed to set up doctors listener');
      setLoading(false);
    }
  }, []);

  return { doctors, loading, error };
}
