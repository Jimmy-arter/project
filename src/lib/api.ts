import { createClient } from '@supabase/supabase-js';
import { Doctor } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getDoctors = async (): Promise<Doctor[]> => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .order('full_name');

  if (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }

  return data || [];
};

export const getDoctorById = async (id: string): Promise<Doctor> => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching doctor:', error);
    throw error;
  }

  return data;
};