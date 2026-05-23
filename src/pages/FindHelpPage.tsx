import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Phone, Star, Filter, Sliders,
  ExternalLink, GraduationCap, Languages, IndianRupee,
  Clock, X, Copy, Check, ChevronRight, Calendar, Globe,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export interface Professional {
  id: string;
  name: string;
  specialty: 'Psychiatrist' | 'Psychologist' | 'Clinical Psychologist' | 'Counselor';
  qualification: string;
  specialization: string;
  experience: string;          // raw string e.g. "27 years" | "" if unknown
  hospital: string;
  city: string;
  fees: string;                // raw string e.g. "₹1400" | "" if unknown
  modes: string[];
  availability: string;
  rating: number | null;       // null = not publicly available
  languages: string[];
  phone: string;               // "" if not available
  address: string;
  profileLink: string;         // real URL or ""
  hospitalLink: string;
  bookingLink: string;
  about: string;
  avatarInitials: string;
  avatarColor: string;
}

// ─────────────────────────────────────────────────────────────
// Verified dataset — sourced from uploaded CSV files
// Fields left blank/null only where data was genuinely unavailable
// in the source. No data has been fabricated.
// ─────────────────────────────────────────────────────────────
const ALL_PROFESSIONALS: Professional[] = [

  // ── HYDERABAD (city1.csv) ────────────────────────────────
  {
    id: 'hyd-01',
    name: 'Dr. M.S. Reddy',
    specialty: 'Psychiatrist',
    qualification: 'Not publicly listed',
    specialization: 'Bipolar disorder, depression, OCD, mood disorders',
    experience: '45+ years',
    hospital: 'Asha Hospital / Asha Bipolar Clinic',
    city: 'Hyderabad',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '+91 96666 55558',
    address: 'Plot No. 298, Road No. 14, Resham Bagh, Banjara Hills, Hyderabad, Telangana 500034',
    profileLink: 'https://ashahospital.org',
    hospitalLink: 'https://ashahospital.org',
    bookingLink: 'https://ashahospital.org',
    about: 'Super senior psychiatrist and Director of Asha Bipolar Clinic, with over 45 years of focused experience in bipolar disorder and mood disorders.',
    avatarInitials: 'MR',
    avatarColor: '#4f7cac',
  },
  {
    id: 'hyd-02',
    name: 'Dr. Pragya Rashmi',
    specialty: 'Psychologist',
    qualification: 'MSc, PhD',
    specialization: 'Psychology',
    experience: '27 years',
    hospital: 'Yashoda Hospitals, Secunderabad',
    city: 'Hyderabad',
    fees: '',
    modes: ['In-person'],
    availability: 'Thursday, 09:00 AM – 04:00 PM',
    rating: null,
    languages: ['English', 'Hindi', 'Telugu', 'Bengali', 'Urdu'],
    phone: '',
    address: 'Yashoda Hospitals, Secunderabad, Hyderabad',
    profileLink: 'https://www.yashodahospitals.com',
    hospitalLink: 'https://www.yashodahospitals.com',
    bookingLink: 'https://www.yashodahospitals.com/appointment/',
    about: 'Consultant Psychologist at Yashoda Hospitals with 27 years of extensive experience in psychology and multilingual clinical practice.',
    avatarInitials: 'PR',
    avatarColor: '#2d8a6e',
  },
  {
    id: 'hyd-03',
    name: 'Dr. Shiwani Kohli',
    specialty: 'Clinical Psychologist',
    qualification: 'M.Phil (Clinical Psychology), Masters (Clinical Psychology), PG Diploma (Counselling Psychology)',
    specialization: 'Clinical Psychology, evidence-based therapy and assessment',
    experience: '',
    hospital: 'KIMS-SUNSHINE Hospital, Begumpet',
    city: 'Hyderabad',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '040-4455 0000',
    address: 'KIMS-SUNSHINE Hospital, Begumpet, Hyderabad',
    profileLink: 'https://kimssunshine.co.in/clinical-psychology',
    hospitalLink: 'https://kimssunshine.co.in',
    bookingLink: 'https://kimssunshine.co.in/clinical-psychology',
    about: 'Clinical Psychologist at KIMS-SUNSHINE Hospital offering evidence-based psychological therapy and comprehensive assessment services.',
    avatarInitials: 'SK',
    avatarColor: '#9b5de5',
  },
  {
    id: 'hyd-04',
    name: 'Chetana Hospital Counselling Team',
    specialty: 'Counselor',
    qualification: 'Multi-disciplinary licensed team',
    specialization: 'Psychological, emotional, and behavioural counselling',
    experience: '',
    hospital: 'Chetana Hospital',
    city: 'Hyderabad',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Chetana Hospital, Secunderabad, Hyderabad',
    profileLink: 'https://www.chetanahospital.com',
    hospitalLink: 'https://www.chetanahospital.com',
    bookingLink: 'https://www.chetanahospital.com',
    about: 'Multidisciplinary psychiatry and psychology hospital with counselling services covering children through elderly patients across Hyderabad.',
    avatarInitials: 'CH',
    avatarColor: '#e84855',
  },

  // ── BANGALORE (city2.csv) ────────────────────────────────
  {
    id: 'blr-01',
    name: 'Dr. Keya Das',
    specialty: 'Psychiatrist',
    qualification: 'MBBS, MD Psychiatry',
    specialization: 'Psychiatry',
    experience: '11 years',
    hospital: 'Apollo Clinic, Electronic City',
    city: 'Bangalore',
    fees: '₹1,400',
    modes: ['Video Consultation', 'In-person'],
    availability: 'Check Apollo 24|7 for available slots',
    rating: null,
    languages: ['English', 'Hindi', 'Kannada', 'Bengali'],
    phone: '',
    address: 'Apollo Clinic, Electronic City, Bengaluru',
    profileLink: 'https://www.apollo247.com/doctors/psychiatrists-in-bangalore',
    hospitalLink: 'https://www.apollo247.com/doctors/psychiatrists-in-bangalore',
    bookingLink: 'https://www.apollo247.com/doctors/psychiatrists-in-bangalore',
    about: 'Verified Apollo psychiatrist with 11 years of clinical experience, offering both digital and in-person consultations from Apollo Clinic, Electronic City.',
    avatarInitials: 'KD',
    avatarColor: '#f18701',
  },
  {
    id: 'blr-02',
    name: 'Ms. Shweta Chhabra',
    specialty: 'Psychologist',
    qualification: 'M.Phil in Clinical Psychology, BA in Psychology, MA in Psychology',
    specialization: 'Clinical Psychology',
    experience: '10 years',
    hospital: 'Apollo Clinic, Bellandur',
    city: 'Bangalore',
    fees: '₹1,500',
    modes: ['Video Consultation', 'In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Apollo Clinic Bellandur, Bengaluru',
    profileLink: 'https://www.apollo247.com/doctors/clinical-psychologists-in-bangalore',
    hospitalLink: 'https://www.apollo247.com/doctors/clinical-psychologists-in-bangalore',
    bookingLink: 'https://www.apollo247.com/doctors/clinical-psychologists-in-bangalore',
    about: 'Verified Apollo-listed psychologist with clinical psychology qualifications and 10 years of experience in online and in-person sessions.',
    avatarInitials: 'SC',
    avatarColor: '#3a86ff',
  },
  {
    id: 'blr-03',
    name: 'Dr. Padam Kanwar Bhati',
    specialty: 'Clinical Psychologist',
    qualification: 'MA Psychology, PG Diploma in Rehabilitation Psychology, PhD Psychology',
    specialization: 'Clinical Psychology, Rehabilitation Psychology',
    experience: '15 years',
    hospital: 'Wings Within, Bengaluru',
    city: 'Bangalore',
    fees: '₹2,000',
    modes: ['Video Consultation', 'In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Wings Within, Bengaluru',
    profileLink: 'https://www.apollo247.com/doctors/clinical-psychologists-in-bangalore',
    hospitalLink: 'https://www.apollo247.com/doctors/clinical-psychologists-in-bangalore',
    bookingLink: 'https://www.apollo247.com/doctors/clinical-psychologists-in-bangalore',
    about: 'Experienced clinical psychologist with a background in rehabilitation psychology, offering 15 years of specialised assessment and therapy.',
    avatarInitials: 'PB',
    avatarColor: '#06a77d',
  },
  {
    id: 'blr-04',
    name: 'Amaha Bengaluru Centre',
    specialty: 'Counselor',
    qualification: 'Licensed therapists, counsellors, and psychiatrists on team',
    specialization: 'Counselling and therapy services',
    experience: '',
    hospital: 'Amaha Mental Health Centre, Bengaluru',
    city: 'Bangalore',
    fees: '',
    modes: ['Video Consultation', 'In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '+91 20 7117 1501',
    address: 'Amaha Centre, Bengaluru',
    profileLink: 'https://www.amahahealth.com/locations/bangalore',
    hospitalLink: 'https://www.amahahealth.com/locations/bangalore',
    bookingLink: 'https://www.amahahealth.com/locations/bangalore',
    about: 'Multi-disciplinary mental health centre offering therapy, counselling, and psychiatry support through a team of licensed professionals.',
    avatarInitials: 'AB',
    avatarColor: '#c77dff',
  },

  // ── CHENNAI (city3.csv) ───────────────────────────────────
  {
    id: 'che-01',
    name: 'Dr. Bharathi Visveswaran',
    specialty: 'Psychiatrist',
    qualification: 'MBBS, DPH, MD (Psychiatry)',
    specialization: "Psychiatry, Women's Mental Health",
    experience: '37 years',
    hospital: 'Apollo Hospitals, Greams Road',
    city: 'Chennai',
    fees: '',
    modes: ['In-person'],
    availability: 'Mon–Fri 10:00 AM – 1:30 PM; Sat 10:00 AM – 1:30 PM',
    rating: null,
    languages: ['English', 'Bengali', 'Hindi'],
    phone: '',
    address: 'Apollo Hospitals, Greams Road, Chennai',
    profileLink: 'https://www.apollo247.com/doctors/psychiatrists-in-chennai',
    hospitalLink: 'https://www.apollohospitals.com/hospitals/apollo-hospitals-greams-road-chennai',
    bookingLink: 'https://www.apollo247.com/doctors/psychiatrists-in-chennai',
    about: "Senior psychiatrist with 37 years of experience at Apollo Hospitals Chennai, with expertise in women's mental health and evidence-based clinical practice.",
    avatarInitials: 'BV',
    avatarColor: '#ef233c',
  },
  {
    id: 'che-02',
    name: 'Susheela A',
    specialty: 'Psychologist',
    qualification: 'PG in Psychology',
    specialization: 'Psychology',
    experience: '',
    hospital: 'Apollo Hospitals, Chennai',
    city: 'Chennai',
    fees: '₹1,000',
    modes: ['Video Consultation', 'In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Apollo Hospitals, Chennai',
    profileLink: 'https://www.apollo247.com/doctors/psychologists-in-chennai',
    hospitalLink: 'https://www.apollohospitals.com/hospitals/apollo-hospitals-greams-road-chennai',
    bookingLink: 'https://www.apollo247.com/doctors/psychologists-in-chennai',
    about: 'Apollo Hospitals-listed psychologist in Chennai offering both digital and in-person consultations at a verified consultation fee.',
    avatarInitials: 'SA',
    avatarColor: '#ffa62b',
  },
  {
    id: 'che-03',
    name: 'Ms. Sripriya V',
    specialty: 'Clinical Psychologist',
    qualification: 'Diploma in Mental Health Counseling, MSc Psychology',
    specialization: 'Clinical Psychology, Counselling',
    experience: '12 years',
    hospital: 'Sri Singhvi Health Center, Purasaiwakkam',
    city: 'Chennai',
    fees: '₹1,200 clinic / ₹1,000 online',
    modes: ['Video Consultation', 'In-person'],
    availability: 'Mon & Wed, 09:00 AM – 12:00 PM',
    rating: 4.7,
    languages: [],
    phone: '',
    address: 'Sri Singhvi Health Center, Purasaiwakkam, Chennai',
    profileLink: 'https://www.lybrate.com/chennai/clinical-psychologist',
    hospitalLink: 'https://www.lybrate.com/chennai/clinical-psychologist',
    bookingLink: 'https://www.lybrate.com/chennai/clinical-psychologist',
    about: 'Clinical psychologist with 12 years of experience offering in-clinic and online counselling and therapy services from Purasaiwakkam, Chennai.',
    avatarInitials: 'SV',
    avatarColor: '#ff006e',
  },
  {
    id: 'che-04',
    name: 'VIT Chennai Counselling Service',
    specialty: 'Counselor',
    qualification: 'Licensed multi-counsellor team',
    specialization: 'Counselling, psychological support',
    experience: '',
    hospital: 'VIT Chennai Campus Counselling Service',
    city: 'Chennai',
    fees: 'Free & Confidential',
    modes: ['In-person'],
    availability: 'Working days during campus hours',
    rating: null,
    languages: [],
    phone: '9791142617 / 9444333030 / 9791092232',
    address: 'VIT Chennai Campus, Tamil Nadu',
    profileLink: 'https://chennai.vit.ac.in/campus-life/student-wellness/counselling-service/',
    hospitalLink: 'https://chennai.vit.ac.in/campus-life/student-wellness/counselling-service/',
    bookingLink: 'https://chennai.vit.ac.in/campus-life/student-wellness/counselling-service/',
    about: 'Free confidential counselling service at VIT Chennai Campus for students, faculty, and staff. Walk-in and scheduled sessions available on working days.',
    avatarInitials: 'VC',
    avatarColor: '#1b998b',
  },

  // ── MUMBAI (city4.csv) ────────────────────────────────────
  {
    id: 'mum-01',
    name: 'Dr. Sagar Mundada',
    specialty: 'Psychiatrist',
    qualification: 'MBBS, MD Psychiatry',
    specialization: 'Psychiatry, Sexology, De-addiction',
    experience: '',
    hospital: 'Private Practice, Mumbai',
    city: 'Mumbai',
    fees: '',
    modes: ['Video Consultation', 'In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Mumbai (exact clinic address on website)',
    profileLink: 'https://www.drsagarmundada.com',
    hospitalLink: 'https://www.drsagarmundada.com',
    bookingLink: 'https://www.drsagarmundada.com',
    about: 'Consultant psychiatrist and de-addiction specialist. Previously served at JJ Group of Hospitals and KEM Hospital, Mumbai. Offers pan-India online consultations.',
    avatarInitials: 'SM',
    avatarColor: '#7209b7',
  },
  {
    id: 'mum-02',
    name: 'Ms. Chhaya Jain',
    specialty: 'Psychologist',
    qualification: 'Not fully listed publicly',
    specialization: 'Psychology',
    experience: '',
    hospital: 'Private Practice, Mumbai',
    city: 'Mumbai',
    fees: '₹1,000 clinic / ₹500 online',
    modes: ['Video Consultation', 'In-person'],
    availability: '11:00 AM – 04:00 PM (check Lybrate for current slots)',
    rating: 4.5,
    languages: [],
    phone: '',
    address: 'Mumbai',
    profileLink: 'https://www.lybrate.com/mumbai/psychologist',
    hospitalLink: 'https://www.lybrate.com/mumbai/psychologist',
    bookingLink: 'https://www.lybrate.com/mumbai/psychologist',
    about: 'Lybrate-listed psychologist in Mumbai with verified public fee structure and daily appointment availability for in-clinic and online sessions.',
    avatarInitials: 'CJ',
    avatarColor: '#e63946',
  },
  {
    id: 'mum-03',
    name: 'Ms. Sheetal Bidkar',
    specialty: 'Clinical Psychologist',
    qualification: 'International Certified Addiction Professional; Clinical Psychology',
    specialization: 'Clinical Psychology, Addiction Support',
    experience: '16 years',
    hospital: 'Advik One Stop Clinic, Cumballa Hill',
    city: 'Mumbai',
    fees: '₹3,500 clinic / ₹3,000 online',
    modes: ['Video Consultation', 'In-person'],
    availability: '09:30 AM – 05:00 PM (check Lybrate for current slots)',
    rating: 4.4,
    languages: [],
    phone: '',
    address: 'Cumballa Hill, Mumbai',
    profileLink: 'https://www.lybrate.com/mumbai/clinical-psychologist',
    hospitalLink: 'https://www.lybrate.com/mumbai/clinical-psychologist',
    bookingLink: 'https://www.lybrate.com/mumbai/clinical-psychologist',
    about: 'Experienced clinical psychologist with 16 years of practice and addiction-focused certification, operating from Advik One Stop Clinic, Cumballa Hill.',
    avatarInitials: 'SB',
    avatarColor: '#f4a261',
  },
  {
    id: 'mum-04',
    name: 'Pushpa Sinha',
    specialty: 'Counselor',
    qualification: 'Post Graduate Diploma in Clinical Psychology, Masters in Clinical Psychology',
    specialization: 'Counselling, Psychotherapy',
    experience: '25 years',
    hospital: 'Online Practice, Mumbai',
    city: 'Mumbai',
    fees: 'Free online',
    modes: ['Video Consultation'],
    availability: '11:00 AM – 04:00 PM (check Lybrate for current slots)',
    rating: 4.5,
    languages: [],
    phone: '',
    address: 'Mumbai (online sessions)',
    profileLink: 'https://www.lybrate.com/mumbai/psychologist',
    hospitalLink: 'https://www.lybrate.com/mumbai/psychologist',
    bookingLink: 'https://www.lybrate.com/mumbai/psychologist',
    about: 'Psychological counsellor with 25 years of experience offering free online consultations. Verified on Lybrate with a 91% recommendation score.',
    avatarInitials: 'PS',
    avatarColor: '#2d6a4f',
  },

  // ── DELHI (city5.csv) ────────────────────────────────────
  {
    id: 'del-01',
    name: 'Dr. Achal Bhagat',
    specialty: 'Psychiatrist',
    qualification: 'MBBS, MD, MRCPsych',
    specialization: 'Psychiatry, Psychotherapy',
    experience: '30+ years',
    hospital: 'Indraprastha Apollo Hospitals',
    city: 'Delhi',
    fees: '',
    modes: ['In-person'],
    availability: 'Mon–Fri 09:00 AM – 01:00 PM; Fri–Sat 02:00 PM – 06:00 PM',
    rating: null,
    languages: [],
    phone: '',
    address: 'Indraprastha Apollo Hospitals, Sarita Vihar, Delhi–Mathura Road, New Delhi',
    profileLink: 'https://www.apollohospitals.com/doctors/dr-achal-bhagat',
    hospitalLink: 'https://www.apollohospitals.com/hospitals/indraprastha-apollo-hospitals-delhi',
    bookingLink: 'https://www.apollo247.com/doctors/psychiatrists-in-delhi',
    about: 'Senior psychiatrist and psychotherapist at Indraprastha Apollo Hospitals with over 30 years of clinical experience treating complex mental health conditions.',
    avatarInitials: 'AB',
    avatarColor: '#457b9d',
  },
  {
    id: 'del-02',
    name: 'Ms. Ekta Soni',
    specialty: 'Psychologist',
    qualification: 'MA in Applied Psychology, PG Diploma in Clinical Psychology',
    specialization: 'Psychology, CBT, Family Therapy, Marital Therapy',
    experience: '18+ years',
    hospital: 'Indraprastha Apollo Hospitals',
    city: 'Delhi',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Indraprastha Apollo Hospitals, Sarita Vihar, Delhi–Mathura Road, New Delhi 110076',
    profileLink: 'https://www.apollohospitals.com/doctors/ms-ekta-soni',
    hospitalLink: 'https://www.apollohospitals.com/hospitals/indraprastha-apollo-hospitals-delhi',
    bookingLink: 'https://www.apollo247.com/doctors/psychologists-in-delhi',
    about: 'Clinical psychologist at Apollo Delhi with 18+ years of practice, specialising in CBT, family therapy, and marital therapy.',
    avatarInitials: 'ES',
    avatarColor: '#da77f2',
  },
  {
    id: 'del-03',
    name: 'Dr. Rakhi Anand',
    specialty: 'Clinical Psychologist',
    qualification: 'Clinical Psychology (Apollo 24|7 listed)',
    specialization: 'Clinical Psychology',
    experience: '28 years',
    hospital: 'Apollo 24|7, South Delhi',
    city: 'Delhi',
    fees: '',
    modes: ['Video Consultation', 'In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'South Delhi',
    profileLink: 'https://www.apollo247.com/doctors/clinical-psychologists-in-delhi',
    hospitalLink: 'https://www.apollo247.com/doctors/clinical-psychologists-in-delhi',
    bookingLink: 'https://www.apollo247.com/doctors/clinical-psychologists-in-delhi',
    about: 'Apollo 24|7-listed clinical psychologist with 28 years of extensive experience, available in South Delhi.',
    avatarInitials: 'RA',
    avatarColor: '#c1121f',
  },
  {
    id: 'del-04',
    name: 'Delhi Mind Clinic Team',
    specialty: 'Counselor',
    qualification: 'Licensed mental health professionals on team',
    specialization: 'Counselling, Mental Wellbeing Support',
    experience: '',
    hospital: 'Delhi Mind Clinic',
    city: 'Delhi',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Delhi (see website for clinic address)',
    profileLink: 'https://www.delhimindclinic.com',
    hospitalLink: 'https://www.delhimindclinic.com',
    bookingLink: 'https://www.delhimindclinic.com',
    about: 'Mental health clinic in Delhi offering psychiatry, therapy, and counselling services through a team of licensed professionals.',
    avatarInitials: 'DM',
    avatarColor: '#6a994e',
  },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
type SortKey = 'experience' | 'rating' | 'fees';

function parseFees(fees: string): number {
  const m = fees.match(/\d[\d,]*/);
  return m ? parseInt(m[0].replace(/,/g, ''), 10) : 0;
}
function parseExperience(exp: string): number {
  const m = exp.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}
function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 768;
}
function modeIcon(mode: string) {
  if (mode.includes('Video')) return '🎥';
  if (mode.includes('Phone')) return '📞';
  if (mode.includes('Chat')) return '💬';
  return '🏥';
}

// ─────────────────────────────────────────────────────────────
// Specialty style maps (preserved exactly from original)
// ─────────────────────────────────────────────────────────────
const SPECIALTY_BADGE_BG: Record<string, string> = {
  Psychiatrist: '#fee2e2',
  Psychologist: '#dbeafe',
  'Clinical Psychologist': '#f0fdf4',
  Counselor: '#dcfce7',
};
const SPECIALTY_BADGE_TEXT: Record<string, string> = {
  Psychiatrist: '#b91c1c',
  Psychologist: '#1d4ed8',
  'Clinical Psychologist': '#15803d',
  Counselor: '#166534',
};
const SPECIALTY_ACCENT: Record<string, string> = {
  Psychiatrist: '#e84855',
  Psychologist: '#3a86ff',
  'Clinical Psychologist': '#06a77d',
  Counselor: '#22c55e',
};

// ─────────────────────────────────────────────────────────────
// Phone Modal (desktop) — unchanged from original
// ─────────────────────────────────────────────────────────────
interface PhoneModalProps { p: Professional; onClose: () => void; }

const PhoneModal: React.FC<PhoneModalProps> = ({ p, onClose }) => {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === ref.current) onClose(); }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 25 }}
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: p.avatarColor }}>
                {p.avatarInitials}
              </div>
              <div>
                <p className="font-bold text-gray-900">{p.name}</p>
                <p className="text-sm text-gray-500">{p.specialty}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
              <Phone size={16} className="text-primary-600" /> Contact number
            </p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between mb-4 border border-gray-200">
              <span className="text-lg font-semibold text-gray-900 tracking-wide">{p.phone}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(p.phone); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="ml-3 flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{ backgroundColor: copied ? '#dcfce7' : '#eff6ff', color: copied ? '#16a34a' : '#2563eb' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-gray-500 flex items-start gap-2">
              <span className="mt-0.5">📱</span>
              <span>Call from your mobile device or use a calling app. Desktop calling requires a configured phone app.</span>
            </p>
          </div>

          <div className="px-6 pb-6">
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────
// Professional Profile Page — same layout as original
// ─────────────────────────────────────────────────────────────
interface ProfilePageProps { p: Professional; onBack: () => void; }

const ProfilePage: React.FC<ProfilePageProps> = ({ p, onBack }) => {
  const [phoneModal, setPhoneModal] = useState(false);
  const accent = SPECIALTY_ACCENT[p.specialty] || '#4f7cac';

  const handleCall = () => {
    if (!p.phone) return;
    if (isMobile()) {
      window.location.href = `tel:${p.phone.replace(/[^0-9+]/g, '')}`;
    } else {
      setPhoneModal(true);
    }
  };

  return (
    <motion.div className="min-h-screen"
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>

      {/* Back */}
      <div className="mb-6">
        <button onClick={onBack}
          className="flex items-center gap-2 text-primary-600 font-medium hover:text-primary-800 transition-colors group">
          <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
          Back to Find Help
        </button>
      </div>

      {/* Hero */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6">
        <div className="h-2" style={{ backgroundColor: accent }} />
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center text-white font-bold text-3xl md:text-4xl flex-shrink-0 shadow-md"
              style={{ backgroundColor: p.avatarColor }}>
              {p.avatarInitials}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{p.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-sm font-semibold px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: accent }}>{p.specialty}</span>
                <span className="text-gray-500 text-sm">{p.hospital}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {p.rating !== null && (
                  <div className="flex items-center gap-1">
                    <Star size={15} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold">{p.rating.toFixed(1)}</span>
                    <span className="text-gray-400">rating</span>
                  </div>
                )}
                {p.experience && (
                  <div className="flex items-center gap-1">
                    <Clock size={15} className="text-gray-400" />
                    <span>{p.experience} experience</span>
                  </div>
                )}
                {p.fees && (
                  <div className="flex items-center gap-1">
                    <IndianRupee size={15} className="text-gray-400" />
                    <span>{p.fees}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="md:col-span-2 space-y-6">
          {p.about && (
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600 leading-relaxed">{p.about}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              {p.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Address</p>
                    <p className="text-gray-700">{p.address}</p>
                  </div>
                </div>
              )}
              {p.qualification && (
                <div className="flex items-start gap-3">
                  <GraduationCap size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Qualification</p>
                    <p className="text-gray-700">{p.qualification}</p>
                  </div>
                </div>
              )}
              {p.languages.length > 0 && (
                <div className="flex items-start gap-3">
                  <Languages size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Languages</p>
                    <p className="text-gray-700">{p.languages.join(', ')}</p>
                  </div>
                </div>
              )}
              {p.availability && (
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Availability</p>
                    <p className="text-gray-700">{p.availability}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {p.modes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Consultation Modes</h2>
              <div className="flex flex-wrap gap-3">
                {p.modes.map(mode => (
                  <div key={mode}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium">
                    <span>{modeIcon(mode)}</span>{mode}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Contact & Book</h2>
            <p className="text-xs text-gray-400 mb-4">All bookings go through the clinic or platform directly.</p>
            <div className="space-y-3">
              {p.phone ? (
                <button onClick={handleCall}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: '#22c55e' }}>
                  <Phone size={18} /> Call Now
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-gray-400 bg-gray-100 text-sm">
                  <Phone size={18} /> Phone not publicly listed
                </div>
              )}

              {p.bookingLink && (
                <a href={p.bookingLink} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: '#4f7cac' }}>
                  <Calendar size={18} /> Book Appointment
                </a>
              )}

              {p.profileLink && (
                <a href={p.profileLink} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                  <ExternalLink size={18} /> View Profile / Clinic
                </a>
              )}
            </div>

            {p.phone && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm">
                <Phone size={14} className="text-gray-400" />
                <span className="font-medium text-gray-700">{p.phone}</span>
              </div>
            )}
          </div>

          {/* Data transparency note */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">Data source:</span> Details sourced from verified public listings. Fields shown as unavailable reflect data not publicly disclosed by the clinic or platform.
            </p>
          </div>
        </div>
      </div>

      {phoneModal && <PhoneModal p={p} onClose={() => setPhoneModal(false)} />}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main FindHelpPage — same layout, filtering, animations
// ─────────────────────────────────────────────────────────────
const FindHelpPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const [city, setCity] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [phoneModalP, setPhoneModalP] = useState<Professional | null>(null);
  const [profileP, setProfileP] = useState<Professional | null>(null);

  const specialties = [
    { value: 'all', label: 'All Specialties' },
    { value: 'Psychiatrist', label: 'Psychiatrist' },
    { value: 'Psychologist', label: 'Psychologist' },
    { value: 'Clinical Psychologist', label: 'Clinical Psychologist' },
    { value: 'Counselor', label: 'Counselor' },
  ];

  const cities = [...new Set(ALL_PROFESSIONALS.map(p => p.city))].sort();

  const handleCall = (p: Professional) => {
    if (!p.phone) return;
    if (isMobile()) {
      window.location.href = `tel:${p.phone.replace(/[^0-9+]/g, '')}`;
    } else {
      setPhoneModalP(p);
    }
  };

  const filtered = ALL_PROFESSIONALS.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.specialty.toLowerCase().includes(q) ||
      p.hospital.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.specialization.toLowerCase().includes(q);
    const matchSpec = specialty === 'all' || p.specialty === specialty;
    const matchCity = !city || p.city === city;
    return matchSearch && matchSpec && matchCity;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') {
      const ra = a.rating ?? -1;
      const rb = b.rating ?? -1;
      return rb - ra;
    }
    if (sortBy === 'experience') return parseExperience(b.experience) - parseExperience(a.experience);
    if (sortBy === 'fees') return parseFees(a.fees) - parseFees(b.fees);
    return 0;
  });

  // ── Profile view ──
  if (profileP) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProfilePage p={profileP} onBack={() => { setProfileP(null); window.scrollTo({ top: 0 }); }} />
      </div>
    );
  }

  // ── Listing view ──
  return (
    <div className="container mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Find Mental Health Professionals</h1>
        <p className="text-gray-600">
          Connect with verified mental health professionals across major Indian cities.
          All data sourced from publicly listed profiles — no information has been fabricated.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input type="text" placeholder="Search by name, specialty, hospital, or city"
              className="input pl-10" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>

          <button className="md:hidden btn-outline flex items-center justify-center"
            onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} className="mr-2" /> Filters
          </button>

          <div className="hidden md:flex gap-4">
            <select className="input w-48" value={specialty} onChange={e => setSpecialty(e.target.value)}>
              {specialties.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select className="input w-44" value={city} onChange={e => setCity(e.target.value)}>
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {showFilters && (
          <motion.div className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-4"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
            <div>
              <label className="label">Specialty</label>
              <select className="input" value={specialty} onChange={e => setSpecialty(e.target.value)}>
                {specialties.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">City</label>
              <select className="input" value={city} onChange={e => setCity(e.target.value)}>
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results header */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {sorted.length} Professional{sorted.length !== 1 ? 's' : ''} Found
        </h2>
        <div className="flex items-center text-sm text-gray-500">
          <Sliders size={16} className="mr-2" />
          <span className="mr-2">Sort:</span>
          <select className="border-none bg-transparent font-medium text-gray-700 focus:outline-none focus:ring-0"
            value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}>
            <option value="rating">Rating</option>
            <option value="experience">Experience</option>
            <option value="fees">Fees (Low → High)</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search size={24} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No professionals found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search filters or location.</p>
          <button className="btn-primary"
            onClick={() => { setSearch(''); setSpecialty('all'); setCity(''); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sorted.map(p => (
            <motion.div key={p.id}
              className="bg-white rounded-xl shadow-soft overflow-hidden"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}>

              <div className="p-6">
                {/* Name + rating */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: p.avatarColor }}>
                      {p.avatarInitials}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold leading-tight">{p.name}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: SPECIALTY_BADGE_BG[p.specialty] || '#f3f4f6',
                          color: SPECIALTY_BADGE_TEXT[p.specialty] || '#374151',
                        }}>
                        {p.specialty}
                      </span>
                    </div>
                  </div>
                  {p.rating !== null ? (
                    <div className="flex items-center bg-amber-50 text-amber-700 px-2 py-1 rounded-lg flex-shrink-0">
                      <Star size={14} className="text-amber-400 fill-amber-400 mr-1" />
                      <span className="text-sm font-semibold">{p.rating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-gray-100 text-gray-400 px-2 py-1 rounded-lg flex-shrink-0 text-xs">
                      No rating listed
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-start">
                    <MapPin size={15} className="text-gray-400 mr-2 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-600">{p.hospital}{p.city ? ` · ${p.city}` : ''}</span>
                  </div>
                  {p.experience && (
                    <div className="flex items-center">
                      <Clock size={15} className="text-gray-400 mr-2 shrink-0" />
                      <span className="text-sm text-gray-600">{p.experience} experience</span>
                    </div>
                  )}
                  {p.languages.length > 0 && (
                    <div className="flex items-center">
                      <Languages size={15} className="text-gray-400 mr-2 shrink-0" />
                      <span className="text-sm text-gray-600">{p.languages.join(', ')}</span>
                    </div>
                  )}
                  {p.fees ? (
                    <div className="flex items-center">
                      <IndianRupee size={15} className="text-gray-400 mr-2 shrink-0" />
                      <span className="text-sm text-gray-600">{p.fees}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <IndianRupee size={15} className="text-gray-400 mr-2 shrink-0" />
                      <span className="text-sm text-gray-400 italic">Fee not publicly listed</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCall(p)}
                    disabled={!p.phone}
                    className={`flex-1 flex justify-center items-center gap-1.5 text-sm py-2 rounded-xl font-medium transition-all ${p.phone ? 'btn-outline' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                    <Phone size={15} />
                    {p.phone ? 'Call' : 'No number'}
                  </button>

                  <button
                    onClick={() => { setProfileP(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="btn-primary flex-1 flex justify-center items-center gap-1.5 text-sm">
                    View Profile <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              {/* Footer strip */}
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  {p.city}
                </span>
                {p.bookingLink && (
                  <a href={p.bookingLink} target="_blank" rel="noopener noreferrer"
                    className="text-primary-600 text-sm font-medium flex items-center hover:text-primary-800 transition-colors"
                    onClick={e => e.stopPropagation()}>
                    Book Online <ExternalLink size={13} className="ml-1" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Crisis support — unchanged */}
      <div className="mt-12 bg-primary-50 border border-primary-100 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Need Immediate Support?</h3>
        <p className="text-gray-700 mb-4">
          If you're experiencing a mental health crisis, help is available 24/7:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-primary-100">
            <h4 className="font-semibold mb-2">NIMHANS Crisis Helpline</h4>
            <p className="text-gray-600 mb-2">080-46110007 — professional mental health support.</p>
            <a href="tel:08046110007" className="text-primary-600 font-medium flex items-center">
              <Phone size={16} className="mr-1" /> Call Helpline
            </a>
          </div>
          <div className="bg-white rounded-lg p-4 border border-primary-100">
            <h4 className="font-semibold mb-2">iCall Helpline (TISS)</h4>
            <p className="text-gray-600 mb-2">9152987821 — free counselling and emotional support.</p>
            <a href="tel:9152987821" className="text-primary-600 font-medium flex items-center">
              <Phone size={16} className="mr-1" /> Call iCall
            </a>
          </div>
        </div>
      </div>

      {phoneModalP && <PhoneModal p={phoneModalP} onClose={() => setPhoneModalP(null)} />}
    </div>
  );
};

export default FindHelpPage;
