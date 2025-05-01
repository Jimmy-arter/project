import React, { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

interface UserInfo {
  email: string;
}

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<
    (Appointment & { patientInfo?: UserInfo })[]
  >([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const currentDoctor = auth.currentUser;
  const doctorId = currentDoctor?.uid;

  useEffect(() => {
    if (!doctorId) return;

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("doctorId", "==", doctorId)
    );

    const unsub = onSnapshot(
      appointmentsQuery,
      async (snap) => {
        const list: (Appointment & { patientInfo?: UserInfo })[] = [];
        let pending = 0,
          confirmed = 0,
          cancelled = 0;

        for (const docSnap of snap.docs) {
          const data = docSnap.data() as Appointment;

          if (data.status === "pending") pending++;
          else if (data.status === "confirmed") confirmed++;
          else if (data.status === "cancelled") cancelled++;

          const patientSnap = await getDoc(doc(db, "users", data.patientId));
          const patientInfo = patientSnap.exists()
            ? { email: patientSnap.data().email }
            : undefined;

          list.push({ id: docSnap.id, ...data, patientInfo });
        }

        setStats({ total: list.length, pending, confirmed, cancelled });
        setAppointments(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading appointments:", err);
        setError("Failed to load appointments");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [doctorId]);

  const handleStatusChange = async (
    id: string,
    newStatus: Appointment["status"]
  ) => {
    setError("");
    try {
      const appRef = doc(db, "appointments", id);
      await updateDoc(appRef, { status: newStatus });
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status");
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Doctor Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow text-center">
          <p className="text-gray-500 text-sm">Total Appointments</p>
          <h3 className="text-xl font-semibold">{stats.total}</h3>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <p className="text-gray-500 text-sm">Pending</p>
          <h3 className="text-xl font-semibold">{stats.pending}</h3>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <p className="text-gray-500 text-sm">Confirmed</p>
          <h3 className="text-xl font-semibold">{stats.confirmed}</h3>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <p className="text-gray-500 text-sm">Cancelled</p>
          <h3 className="text-xl font-semibold">{stats.cancelled}</h3>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 mb-4">
          <AlertCircle className="inline-block mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
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
            {appointments.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {app.patientInfo?.email || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {format(parseISO(app.date), "PP")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {app.time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      app.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : app.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 space-x-2">
                  <button
                    disabled={app.status === "confirmed"}
                    onClick={() => handleStatusChange(app.id, "confirmed")}
                    className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    disabled={app.status === "cancelled"}
                    onClick={() => handleStatusChange(app.id, "cancelled")}
                    className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
