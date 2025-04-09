export interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  years_experience: number;
  profile_photo_url: string;
  phone: string;
  email: string;
  bio: string;
  certifications: string[];
  languages: string[];
  office_address: string;
  insurance_accepted: string[];
  available_slots: {
    [key: string]: string[];
  };
  created_at: string;
  updated_at: string;
}