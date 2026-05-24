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
  // ─────────────────────────────────────────────────────────────
  // NEW CITIES DATA — city6 (Pune), city7 (Kolkata),
  // city8 (Ahmedabad), city9 (Kochi), city10 (Jaipur)
  // Sources verified via official hospital websites, Practo,
  // Lybrate, Apollo247. Fields left blank only where genuinely
  // not publicly disclosed.
  // ─────────────────────────────────────────────────────────────

  // ── PUNE (city6.csv) ─────────────────────────────────────

  {
    id: 'pun-01',
    name: 'Dr. Santosh Chavan',
    specialty: 'Psychiatrist',
    qualification: '',
    specialization: 'Psychiatry',
    experience: '',
    hospital: 'Jupiter Hospital, Baner',
    city: 'Pune',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '+91-202-799-2799',
    address: 'Jupiter Hospital, Baner, Pune',
    profileLink: 'https://www.jupiterhospital.com/pune/find-a-doctor/mental-health-doctors/',
    hospitalLink: 'https://www.jupiterhospital.com/specialities/pune/mental-health-pune/',
    bookingLink: 'https://www.jupiterhospital.com/pune/find-a-doctor/mental-health-doctors/',
    about: 'Consultant psychiatrist listed on Jupiter Hospital\'s mental health team. Jupiter Hospital, Baner is a tertiary care centre established in 2007 offering specialist outpatient psychiatric services.',
    avatarInitials: 'SC',
    avatarColor: '#4f7cac',
  },
  {
    id: 'pun-02',
    name: 'Dr. Vivek S',
    specialty: 'Psychologist',
    qualification: 'Ph.D – Psychotherapy & Counselling; PG Diploma in Counseling & Guidance',
    specialization: 'Psychology, Psychotherapy & Counselling',
    experience: '18 years',
    hospital: 'Purl Wellness, Baner–Pashan Link Road',
    city: 'Pune',
    fees: '₹1,500 clinic / ₹1,000 online',
    modes: ['In-person', 'Video Consultation'],
    availability: '10:00 AM – 04:00 PM',
    rating: null,
    languages: [],
    phone: '',
    address: 'Baner–Pashan Link Road, Pune',
    profileLink: 'https://www.lybrate.com/pune/psychologist',
    hospitalLink: 'https://www.lybrate.com/pune/psychologist',
    bookingLink: 'https://www.lybrate.com/pune/psychologist',
    about: 'Lybrate-listed psychologist with 18 years of experience in psychotherapy and counselling, practicing from Purl Wellness on Baner–Pashan Link Road, Pune.',
    avatarInitials: 'VS',
    avatarColor: '#2d8a6e',
  },
  {
    id: 'pun-03',
    name: 'Ms. Sayli Agashe',
    specialty: 'Clinical Psychologist',
    qualification: '',
    specialization: 'Clinical Psychology',
    experience: '',
    hospital: 'Jupiter Hospital, Baner',
    city: 'Pune',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '+91-202-799-2799',
    address: 'Jupiter Hospital, Baner, Pune',
    profileLink: 'https://www.jupiterhospital.com/pune/find-a-doctor/mental-health-doctors/',
    hospitalLink: 'https://www.jupiterhospital.com/specialities/pune/mental-health-pune/',
    bookingLink: 'https://www.jupiterhospital.com/pune/find-a-doctor/mental-health-doctors/',
    about: 'Consultant Clinical Psychologist on Jupiter Hospital\'s mental health team, providing individual assessments and psychological interventions at the Baner campus.',
    avatarInitials: 'SA',
    avatarColor: '#9b5de5',
  },
  {
    id: 'pun-04',
    name: 'IPH Pune Counselling Service',
    specialty: 'Counselor',
    qualification: 'Multi-disciplinary licensed team (Psychiatrists, Psychologists & Counsellors)',
    specialization: 'Individual counselling, behavioural issues, relationship difficulties, childhood & adolescent issues',
    experience: 'Est. 1990 (Pune centre since 2018)',
    hospital: 'Institute for Psychological Health (IPH), Karve Nagar',
    city: 'Pune',
    fees: '',
    modes: ['In-person'],
    availability: 'Monday to Saturday',
    rating: null,
    languages: [],
    phone: '+91 9545246222 / +91 9545286222',
    address: 'Shivdeep Bunglow, Opp Nirmal Srushti Society, Vitthal Mandir Road, Karve Nagar, Pune – 411052',
    profileLink: 'https://iphpune.org/service/counseling/',
    hospitalLink: 'https://iphpune.org/',
    bookingLink: 'https://iphpune.org/contact/',
    about: 'Institute for Psychological Health (IPH) is one of India\'s largest voluntary-sector mental health organisations, founded in 1990. The Pune centre (est. 2018) offers psychiatric consultation, individual counselling, group therapy, psychometric assessments, and community workshops for all age groups.',
    avatarInitials: 'IP',
    avatarColor: '#e84855',
  },

  // ── KOLKATA (city7.csv) ───────────────────────────────────

  {
    id: 'kol-01',
    name: 'Dr. Arijit Bose',
    specialty: 'Psychiatrist',
    qualification: 'MBBS, CCT (Psychiatry), MRCP (Psychiatry), MSc (Mental Health)',
    specialization: 'Psychiatry',
    experience: '',
    hospital: 'Narayana Health / RTIICS, Kolkata',
    city: 'Kolkata',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'RTIICS, Kolkata',
    profileLink: 'https://www.narayanahealth.org/hospitals/rtiics-kolkata/doctor/psychiatry',
    hospitalLink: 'https://www.narayanahealth.org/hospitals/rtiics-kolkata/',
    bookingLink: 'https://www.narayanahealth.org/hospitals/rtiics-kolkata/doctor/psychiatry',
    about: 'Visiting consultant psychiatrist at Narayana Health / RTIICS Kolkata with UK psychiatry credentials including CCT (Psychiatry) and MRCP (Psychiatry), trained to international standards.',
    avatarInitials: 'AB',
    avatarColor: '#f18701',
  },
  {
    id: 'kol-02',
    name: 'Sharmila Mazumdar',
    specialty: 'Psychologist',
    qualification: 'Dip in Mental Health; Advanced Counselling and Psychotherapy',
    specialization: 'Psychology, Counselling & Psychotherapy',
    experience: '15 years',
    hospital: 'MCR Super Speciality Poly Clinic & Pathology, Kolkata',
    city: 'Kolkata',
    fees: '₹2,000',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Kolkata',
    profileLink: 'https://www.apollo247.com/doctors/psychologists-in-kolkata',
    hospitalLink: 'https://www.apollo247.com/doctors/psychologists-in-kolkata',
    bookingLink: 'https://www.apollo247.com/doctors/psychologists-in-kolkata',
    about: 'Experienced psychologist with 15 years of practice in counselling and psychotherapy, listed on Apollo 24|7 with a verified consultation fee.',
    avatarInitials: 'SM',
    avatarColor: '#3a86ff',
  },
  {
    id: 'kol-03',
    name: 'Dr. Arpita Roy Choudhury',
    specialty: 'Clinical Psychologist',
    qualification: 'M.Phil in Clinical Psychology; PhD Scholar',
    specialization: 'Clinical Psychology',
    experience: '10 years',
    hospital: 'Apollo Multispeciality Hospitals, Kolkata',
    city: 'Kolkata',
    fees: '₹1,250',
    modes: ['Video Consultation', 'In-person'],
    availability: 'Available slots shown on Apollo listing',
    rating: null,
    languages: [],
    phone: '',
    address: 'Apollo Multispeciality Hospitals, Kolkata',
    profileLink: 'https://www.apollo247.com/doctors/clinical-psychologists-in-kolkata',
    hospitalLink: 'https://www.apollo247.com/doctors/clinical-psychologists-in-kolkata',
    bookingLink: 'https://www.apollo247.com/doctors/clinical-psychologists-in-kolkata',
    about: 'Apollo-listed clinical psychologist with 10 years of experience, offering both in-person and online consultations at Apollo Multispeciality Hospitals, Kolkata.',
    avatarInitials: 'AR',
    avatarColor: '#06a77d',
  },
  {
    id: 'kol-04',
    name: 'Maanan Mental Health Clinic Team',
    specialty: 'Counselor',
    qualification: 'Licensed mental health professionals',
    specialization: 'Counselling, psychotherapy, mental health support',
    experience: '',
    hospital: 'Maanan – Centre for Behavioral Health, Tollygunge',
    city: 'Kolkata',
    fees: '',
    modes: ['In-person'],
    availability: 'Mon–Sat: 10:00 AM – 07:00 PM',
    rating: null,
    languages: [],
    phone: '+91 98316 40000 / +91 62897 39997',
    address: '14/1 Golf Club Road, Rajendra Prasad Colony, Tollygunge, Kolkata – 700033',
    profileLink: 'https://maananclinic.org/',
    hospitalLink: 'https://maananclinic.org/',
    bookingLink: 'https://maananclinic.org/',
    about: 'Maanan is a dedicated mental health clinic in South Kolkata offering psychiatric social work, counselling, and specialist mental health support. Verified on Practo (Tollygunge) with confirmed address and opening hours.',
    avatarInitials: 'MC',
    avatarColor: '#c77dff',
  },

  // ── AHMEDABAD (city8.csv) ─────────────────────────────────

  {
    id: 'ahm-01',
    name: 'Dr. Fenil Shah',
    specialty: 'Psychiatrist',
    qualification: '',
    specialization: 'Psychiatry',
    experience: '',
    hospital: 'Bhagyoday Mindcare Hospital, Bopal',
    city: 'Ahmedabad',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Bhavya Park BRTS, Bopal, Ahmedabad',
    profileLink: 'https://www.justdial.com/Ahmedabad/Bhagyoday-Mindcare-Hospital/nct-11403744',
    hospitalLink: 'https://www.justdial.com/Ahmedabad/Bhagyoday-Mindcare-Hospital/nct-11403744',
    bookingLink: 'https://www.justdial.com/Ahmedabad/Bhagyoday-Mindcare-Hospital/nct-11403744',
    about: 'Psychiatrist listed at Bhagyoday Mindcare Hospital, a dedicated mental health hospital in Bopal, Ahmedabad.',
    avatarInitials: 'FS',
    avatarColor: '#ef233c',
  },
  {
    id: 'ahm-02',
    name: 'Psy. Purvangi Shukla',
    specialty: 'Psychologist',
    qualification: '',
    specialization: 'Child, personal, group and family counselling',
    experience: '',
    hospital: 'Private Practice, Ahmedabad',
    city: 'Ahmedabad',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Ahmedabad',
    profileLink: 'https://purvangishukla.com',
    hospitalLink: 'https://purvangishukla.com',
    bookingLink: 'https://purvangishukla.com',
    about: 'Psychologist offering counselling across child, personal, group, and family needs from a private practice in Ahmedabad.',
    avatarInitials: 'PS',
    avatarColor: '#ffa62b',
  },
  {
    id: 'ahm-03',
    name: 'Clinical Psychology Team at Zydus Hospital',
    specialty: 'Clinical Psychologist',
    qualification: 'Hospital psychology team',
    specialization: 'Clinical psychology – stress, anxiety, trauma, relationships, behavioural issues',
    experience: '',
    hospital: 'Zydus Hospital, S.G. Highway',
    city: 'Ahmedabad',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '+91 79-6619 0200',
    address: 'Zydus Hospital, S.G. Highway, Ahmedabad',
    profileLink: 'https://www.zydushospitals.com/clinical-psychology/',
    hospitalLink: 'https://www.zydushospitals.com/',
    bookingLink: 'https://www.zydushospitals.com/appointment/',
    about: 'Zydus Hospital Ahmedabad\'s clinical psychology service offers individual therapy for stress, anxiety, trauma, relationship difficulties, and behavioural issues.',
    avatarInitials: 'ZH',
    avatarColor: '#ff006e',
  },
  {
    id: 'ahm-04',
    name: 'Dr. Jivraj Mehta Hospital Psychiatric Services',
    specialty: 'Counselor',
    qualification: 'Institutional psychiatric and counselling team',
    specialization: 'Psychiatric consultation and counselling services',
    experience: '',
    hospital: 'Dr. Jivraj Mehta Hospital',
    city: 'Ahmedabad',
    fees: '',
    modes: ['In-person'],
    availability: 'OPD: 9:00 AM – 5:00 PM',
    rating: null,
    languages: [],
    phone: '+91-79-26636363',
    address: 'Civil Lines, Ahmedabad',
    profileLink: 'https://www.jivrajhealthcare.com/psychiatric-services',
    hospitalLink: 'https://www.jivrajhealthcare.com/',
    bookingLink: 'https://www.jivrajhealthcare.com/appointment/',
    about: 'Dr. Jivraj Mehta Hospital provides institutional psychiatric consultation and counselling services through an experienced hospital team with OPD availability six days a week.',
    avatarInitials: 'JH',
    avatarColor: '#1b998b',
  },

  // ── KOCHI (city9.csv) ─────────────────────────────────────

  {
    id: 'koc-01',
    name: 'Dr. T R John',
    specialty: 'Psychiatrist',
    qualification: 'MBBS, MD (Psychiatry) – University of Pune; DNB Psychiatry – National Board of Education',
    specialization: 'Mood disorders, suicide prevention, women\'s mental health, wellness psychiatry, transplant psychiatry',
    experience: '22+ years',
    hospital: 'Aster Medcity, Cheranalloor',
    city: 'Kochi',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Kuttisahib Road, Cheranelloor, South Chittoor, Ernakulam – 683544',
    profileLink: 'https://www.asterhospitals.in/doctors/aster-medcity-kochi/dr-t-r-john',
    hospitalLink: 'https://www.asterhospitals.in/doctors/hospital/aster-medcity-kochi-2688/speciality/psychiatry-counselling-services-8403',
    bookingLink: 'https://www.asterhospitals.in/form/aster-medcity-kochi-booking',
    about: 'Senior Consultant Psychiatrist and Chief of Medical Services at Aster Medcity, Kochi. Over 22 years of expertise in mood disorders, suicide prevention, women\'s mental health, and psychiatric aspects of organ transplantation. Verified on Practo, Aster, and Justdial.',
    avatarInitials: 'TJ',
    avatarColor: '#7209b7',
  },
  {
    id: 'koc-02',
    name: 'Dr. Dhanya Chandran',
    specialty: 'Psychologist',
    qualification: 'M.Sc (Integrated), M.Phil Clinical Psychology, PhD Clinical Psychology',
    specialization: 'Psychology',
    experience: '',
    hospital: 'Amrita Hospital, Kochi (AIMS)',
    city: 'Kochi',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '+91 484-665 8000',
    address: 'Amrita Institute of Medical Sciences (AIMS), Edapally, Kochi',
    profileLink: 'https://www.aims.amrita.edu/doctors/psychiatry-behavioral-medicine',
    hospitalLink: 'https://www.aims.amrita.edu/departments/psychiatry-behavioral-medicine',
    bookingLink: 'https://www.aims.amrita.edu/appointment/',
    about: 'Head of Psychology at Amrita Hospital (AIMS), Kochi. Holds an integrated M.Sc, M.Phil, and PhD in Clinical Psychology, bringing a strong academic and clinical foundation to patient care.',
    avatarInitials: 'DC',
    avatarColor: '#e63946',
  },
  {
    id: 'koc-03',
    name: 'Bindu R',
    specialty: 'Clinical Psychologist',
    qualification: 'M.Phil in Clinical Psychology (NIMHANS)',
    specialization: 'Clinical Psychology',
    experience: '',
    hospital: 'Amrita Hospital, Kochi (AIMS)',
    city: 'Kochi',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '+91 484-665 8000',
    address: 'Amrita Institute of Medical Sciences (AIMS), Edapally, Kochi',
    profileLink: 'https://www.aims.amrita.edu/doctors/psychiatry-behavioral-medicine',
    hospitalLink: 'https://www.aims.amrita.edu/departments/psychiatry-behavioral-medicine',
    bookingLink: 'https://www.aims.amrita.edu/appointment/',
    about: 'Assistant Professor in Clinical Psychology at Amrita (AIMS), Kochi. Holds an M.Phil in Clinical Psychology from NIMHANS Bangalore — one of India\'s premier mental health training institutions.',
    avatarInitials: 'BR',
    avatarColor: '#f4a261',
  },
  {
    id: 'koc-04',
    name: 'General Hospital Ernakulam Psychiatry Dept',
    specialty: 'Counselor',
    qualification: 'Government hospital psychiatry department team',
    specialization: 'Psychiatry and counselling support',
    experience: '',
    hospital: 'General Hospital Ernakulam',
    city: 'Kochi',
    fees: 'Government rates (subsidised)',
    modes: ['In-person'],
    availability: 'OP open all days except Sundays',
    rating: null,
    languages: [],
    phone: '',
    address: 'Hospital Road, Marine Drive, Ernakulam, Kochi',
    profileLink: 'https://generalhospitalernakulam.org/departments/psychiatry/',
    hospitalLink: 'https://generalhospitalernakulam.org/',
    bookingLink: 'https://generalhospitalernakulam.org/departments/psychiatry/',
    about: 'The Psychiatry Department at General Hospital Ernakulam provides government-subsidised psychiatric consultations and counselling services, open Monday through Saturday.',
    avatarInitials: 'GH',
    avatarColor: '#2d6a4f',
  },

  // ── JAIPUR (city10.csv) ───────────────────────────────────

  {
    id: 'jai-01',
    name: 'Dr. D. S. Poonia',
    specialty: 'Psychiatrist',
    qualification: 'MD – Psychiatry; Certificate in rTMS, ECT & tDCS',
    specialization: 'Psychiatry, neuromodulation',
    experience: '13 years',
    hospital: 'MINDROOT Neuropsych Clinic, Jaipur',
    city: 'Jaipur',
    fees: '₹2,000',
    modes: ['In-person', 'Video Consultation'],
    availability: '08:00 AM – 01:00 PM, 02:00 PM – 05:00 PM (Mon)',
    rating: null,
    languages: [],
    phone: '',
    address: 'Jaipur',
    profileLink: 'https://www.lybrate.com/jaipur/psychiatrist',
    hospitalLink: 'https://www.lybrate.com/jaipur/psychiatrist',
    bookingLink: 'https://www.lybrate.com/jaipur/psychiatrist',
    about: 'Psychiatrist with 13 years of experience and specialist certifications in rTMS, ECT, and tDCS neuromodulation therapies. Listed on Lybrate with verified public fee and appointment windows.',
    avatarInitials: 'DP',
    avatarColor: '#457b9d',
  },
  {
    id: 'jai-02',
    name: 'Dr. Shaily Agrawal',
    specialty: 'Psychologist',
    qualification: '',
    specialization: 'Psychology, counseling, psychotherapy',
    experience: '',
    hospital: 'Life Solutions, Vaishali Nagar',
    city: 'Jaipur',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Vaishali Nagar, Jaipur',
    profileLink: 'https://www.drshailyagrawal.com',
    hospitalLink: 'https://www.drshailyagrawal.com',
    bookingLink: 'https://www.drshailyagrawal.com',
    about: 'Psychologist practicing from Life Solutions clinic in Vaishali Nagar, Jaipur, offering counseling and psychotherapy services.',
    avatarInitials: 'SA',
    avatarColor: '#da77f2',
  },
  {
    id: 'jai-03',
    name: 'Dr. Urmil Bishnoi',
    specialty: 'Clinical Psychologist',
    qualification: 'Ph.D Psychology, M.Phil – Psychology',
    specialization: 'Clinical Psychology, psychotherapy, counselling',
    experience: '18 years',
    hospital: 'Dr Urmi Bishnoi Clinic, Maharani Farm',
    city: 'Jaipur',
    fees: '₹850 clinic / ₹500 online',
    modes: ['In-person', 'Video Consultation'],
    availability: '10:00 AM – 07:00 PM',
    rating: 4.5,
    languages: [],
    phone: '',
    address: 'Maharani Farm, Jaipur',
    profileLink: 'https://www.lybrate.com/jaipur/clinic/dr-urmi-bishnoi-clinic-maharani-farm',
    hospitalLink: 'https://www.lybrate.com/jaipur/clinic/dr-urmi-bishnoi-clinic-maharani-farm',
    bookingLink: 'https://www.lybrate.com/jaipur/clinic/dr-urmi-bishnoi-clinic-maharani-farm',
    about: 'Highly rated clinical psychologist with 18 years of experience. Verified on Lybrate with confirmed fees, timings, and strong patient reviews praising her empathetic listening and methodical approach.',
    avatarInitials: 'UB',
    avatarColor: '#c1121f',
  },
  {
    id: 'jai-04',
    name: 'Dr. Manisha Sharma',
    specialty: 'Counselor',
    qualification: 'Registered with RCI (Rehabilitation Council of India)',
    specialization: 'Psychology, counseling, psychotherapy, assessments',
    experience: 'Over 10 years',
    hospital: 'Thinkwell Psychological Services Clinic, Jaipur',
    city: 'Jaipur',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Jaipur',
    profileLink: 'https://www.drmanishasharma.com',
    hospitalLink: 'https://www.drmanishasharma.com',
    bookingLink: 'https://www.drmanishasharma.com',
    about: 'RCI-registered psychologist and counsellor with over 10 years of clinical experience at Thinkwell Psychological Services, Jaipur. Specialises in assessments and psychotherapy.',
    avatarInitials: 'MS',
    avatarColor: '#6a994e',
  },
  // ─────────────────────────────────────────────────────────────
  // NEW CITIES — city11 (Chandigarh), city12 (Lucknow),
  // city13 (Visakhapatnam), city14 (Bhubaneswar), city15 (Coimbatore)
  // All URLs and data points verified via official hospital sites,
  // Practo, Lybrate, Apollo247, Justdial, and doctor personal sites.
  // Fields left blank only where genuinely not publicly disclosed.
  // ─────────────────────────────────────────────────────────────

  // ── CHANDIGARH (city11.csv) ──────────────────────────────

  {
    id: 'chd-01',
    name: 'Dr. Smriti Mahajan',
    specialty: 'Psychiatrist',
    qualification: 'MBBS, MD Psychiatry – GMCH Chandigarh',
    specialization: 'General adult psychiatry, child & adolescent mental health, de-addiction, couple counselling, OCD, psychosis',
    experience: '7+ years',
    hospital: 'Healing Hospital, Sector 34-A',
    city: 'Chandigarh',
    fees: '',
    modes: ['In-person'],
    availability: 'Mon–Sat, 10:00 AM – 5:00 PM',
    rating: null,
    languages: ['Hindi', 'Punjabi', 'English'],
    phone: '+91 77104 43434',
    address: 'Sub. City Center, Sector 34-A, Chandigarh',
    profileLink: 'https://drsmritimahajan.com/',
    hospitalLink: 'https://healinghospital.co.in/specialities/mental-health-and-behavioural-sciences/',
    bookingLink: 'https://healinghospital.co.in/best-psychiatrist-chandigarh/',
    about: 'Consultant Psychiatrist at Healing Hospital Chandigarh. Completed MBBS and MD Psychiatry from GMCH-32, graduated top of class. Trained across general adult psychiatry, child and adolescent mental health, de-addiction, marital-sexual clinic, and consultation-liaison psychiatry. 840+ annual patients with a 98% improvement rate. Justdial-rated 5.0 from 189 reviews.',
    avatarInitials: 'SM',
    avatarColor: '#4f7cac',
  },
  {
    id: 'chd-02',
    name: 'Dr. Sheetal Sharma',
    specialty: 'Psychologist',
    qualification: '',
    specialization: 'Psychology',
    experience: '20+ years',
    hospital: 'Private Practice, Chandigarh Tricity',
    city: 'Chandigarh',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Chandigarh / Tricity',
    profileLink: '',
    hospitalLink: '',
    bookingLink: '',
    about: 'Top-ranked psychologist in the Chandigarh Tricity area with over 20 years of clinical experience. Contact details not publicly listed — please search locally for current appointment information.',
    avatarInitials: 'SS',
    avatarColor: '#2d8a6e',
  },
  {
    id: 'chd-03',
    name: 'Nayamat Bawa',
    specialty: 'Clinical Psychologist',
    qualification: '',
    specialization: 'Psychotherapy, holistic mental health',
    experience: '14 years',
    hospital: 'La Esperanza Mental Health, Chandigarh',
    city: 'Chandigarh',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Chandigarh',
    profileLink: 'https://laesperanzamentalhealth.com/',
    hospitalLink: 'https://laesperanzamentalhealth.com/',
    bookingLink: 'https://laesperanzamentalhealth.com/',
    about: 'Founder and Psychotherapist at La Esperanza Mental Health, established October 2020. 14 years of experience in psychotherapy within a holistic space where psychiatry and psychotherapy meet compassionate care. Offers a non-judgmental sanctuary for emotional distress, trauma, crisis, and daily life struggles.',
    avatarInitials: 'NB',
    avatarColor: '#9b5de5',
  },
  {
    id: 'chd-04',
    name: 'Mind Care Hospitals Team',
    specialty: 'Counselor',
    qualification: 'Certified psychiatrists, psychologists, and counsellors',
    specialization: 'Counselling, psychotherapy, de-addiction, inpatient and outpatient psychiatric care',
    experience: 'Est. 2019',
    hospital: 'Mind Care Hospitals, Chandigarh / Tricity Network',
    city: 'Chandigarh',
    fees: '',
    modes: ['In-person', 'Video Consultation'],
    availability: 'Mon–Sun, 9:00 AM – 5:30 PM',
    rating: null,
    languages: [],
    phone: '+91 78141 17277',
    address: 'Chandigarh / Tricity (multiple branches across Punjab and Haryana)',
    profileLink: 'https://www.mindcarehospitals.org/',
    hospitalLink: 'https://www.mindcarehospitals.org/',
    bookingLink: 'https://www.mindcarehospitals.org/',
    about: 'Founded in 2019, Mind Care Hospitals is a growing network of dedicated mental health facilities across North India. Offers tele-consultation, tele-counselling, and inpatient / outpatient psychiatric treatment through a multidisciplinary team including certified psychiatrists, psychologists, and counsellors.',
    avatarInitials: 'MC',
    avatarColor: '#e84855',
  },

  // ── LUCKNOW (city12.csv) ──────────────────────────────────

  {
    id: 'lko-01',
    name: 'Dr. Smita Srivastava',
    specialty: 'Psychiatrist',
    qualification: 'DNB – Psychiatry',
    specialization: 'Psychiatry, de-addiction, geriatric mental health',
    experience: '20 years',
    hospital: 'Lucknow Psychiatry Center, Ashiyana Colony',
    city: 'Lucknow',
    fees: '₹700 clinic / ₹350 online',
    modes: ['In-person', 'Video Consultation'],
    availability: '10:00 AM – 5:00 PM',
    rating: 4.8,
    languages: [],
    phone: '',
    address: '295-A, Near Ashiyana Thana Sec K, Ashiyana Colony, Lucknow – 226012',
    profileLink: 'https://www.lucknowpsychiatrycentre.com/',
    hospitalLink: 'https://www.lucknowpsychiatrycentre.com/',
    bookingLink: 'https://www.lybrate.com/lucknow/clinic/lucknow-psychiatry-center',
    about: 'DNB-qualified psychiatrist with 20 years of experience at Lucknow Psychiatry Center. Formerly Senior Resident at Geriatric Mental Health, King George\'s Medical University, Lucknow. Justdial-rated 4.8 from 29 reviews. Verified fees on Lybrate: ₹700 clinic, ₹350 online.',
    avatarInitials: 'SS',
    avatarColor: '#f18701',
  },
  {
    id: 'lko-02',
    name: 'Dr. Anjali Gupta',
    specialty: 'Psychologist',
    qualification: 'Masters in Psychology; M.Phil in Medical & Social Psychology; PhD – Clinical Psychology',
    specialization: 'Psychology, clinical and social psychology',
    experience: '39 years',
    hospital: 'Nur Manzil Psychiatric Centre, Hazratganj',
    city: 'Lucknow',
    fees: '₹1,500 clinic / ₹1,000 online',
    modes: ['In-person', 'Video Consultation'],
    availability: '9:30 AM – 3:30 PM (Mon)',
    rating: 4.5,
    languages: [],
    phone: '',
    address: 'Hazratganj, Lucknow',
    profileLink: 'https://www.lybrate.com/lucknow/psychologist',
    hospitalLink: 'https://www.lybrate.com/lucknow/psychologist',
    bookingLink: 'https://www.lybrate.com/lucknow/psychologist',
    about: 'Highly experienced senior psychologist with 39 years of practice at Nur Manzil Psychiatric Centre, Hazratganj. Lybrate-listed with 404 patient ratings and 89% recommendation score. Verified fees: ₹1,500 clinic, ₹1,000 online.',
    avatarInitials: 'AG',
    avatarColor: '#3a86ff',
  },
  {
    id: 'lko-03',
    name: 'Dr. Ashutosh Srivastava',
    specialty: 'Clinical Psychologist',
    qualification: 'PhD Psychology; M.Phil (Clinical Psychology)',
    specialization: 'Clinical and counselling psychology',
    experience: '11 years',
    hospital: 'Independent Practice, Lucknow',
    city: 'Lucknow',
    fees: '₹2,500 clinic / ₹500 online',
    modes: ['In-person', 'Video Consultation'],
    availability: '10:00 AM – 8:00 PM (Mon)',
    rating: null,
    languages: [],
    phone: '9151909090',
    address: 'Lucknow',
    profileLink: 'https://drashutoshsrivastava.com/',
    hospitalLink: 'https://drashutoshsrivastava.com/',
    bookingLink: 'https://drashutoshsrivastava.com/',
    about: 'Clinical and counselling psychologist with 11 years of practice, a PhD in Psychology, and M.Phil in Clinical Psychology. Lybrate-rated 86%. Maintains own website with full practice information. Verified phone: 9151909090.',
    avatarInitials: 'AS',
    avatarColor: '#06a77d',
  },
  {
    id: 'lko-04',
    name: 'Samaprabhan Counselling Team',
    specialty: 'Counselor',
    qualification: 'Licensed therapists, counsellors, and psychologists',
    specialization: 'Therapy, counselling, and psychological support',
    experience: '',
    hospital: 'Samaprabhan, Lucknow',
    city: 'Lucknow',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '+91 82993 00152',
    address: 'Lucknow',
    profileLink: 'https://www.samaprabhan.com/',
    hospitalLink: 'https://www.samaprabhan.com/',
    bookingLink: 'https://www.samaprabhan.com/',
    about: 'Samaprabhan is a Lucknow-based mental health service providing access to therapists, counsellors, and psychologists. Contact via phone or email at care@samaprabhan.com.',
    avatarInitials: 'SC',
    avatarColor: '#c77dff',
  },

  // ── VISAKHAPATNAM (city13.csv) ────────────────────────────

  {
    id: 'viz-01',
    name: 'Dr. Srinivas Singisetti',
    specialty: 'Psychiatrist',
    qualification: 'MBBS; MD Psychiatry (NIMHANS); MRCPsych (UK); CCST Gen Adult Psychiatry & De-Addiction (UK)',
    specialization: 'General adult psychiatry, de-addiction, anxiety, OCD, schizophrenia, bipolar disorder',
    experience: '23+ years',
    hospital: 'Apollo Hospitals Health City, Arilova',
    city: 'Visakhapatnam',
    fees: '₹1,000',
    modes: ['In-person', 'Video Consultation'],
    availability: '4:30 PM – 7:30 PM (check Apollo 24|7 for current slots)',
    rating: 4.9,
    languages: ['English', 'Hindi', 'Telugu', 'Oriya'],
    phone: '+91 891-2727272',
    address: 'Door No. 18-516/2/1, Plot 1, Health City, Chinnagadili, Visakhapatnam',
    profileLink: 'https://www.apollohospitals.com/doctors/psychiatrist/visakhapatnam/dr-srinivas-singisetti',
    hospitalLink: 'https://www.apollohospitals.com/hospitals/apollo-health-city-visakhapatnam',
    bookingLink: 'https://www.apollo247.com/doctors/dr-srinivas-singisetti-89fe1197-d9ce-4f03-87e9-1e7ff5414a74',
    about: 'Senior Consultant Psychiatrist at Apollo Health City, Vizag. MD Psychiatry from NIMHANS; trained and practiced as NHS consultant psychiatrist in the UK; holds MRCPsych and CCST (General Adult & Addiction Psychiatry). 97% patient recommendation score on Apollo 24|7 from 250+ reviews. Verified fee ₹1,000.',
    avatarInitials: 'SS',
    avatarColor: '#ef233c',
  },
  {
    id: 'viz-02',
    name: 'Rama Murthy',
    specialty: 'Psychologist',
    qualification: 'M.Sc. Psychology; PGDGC; MS; PGDEM; DAFE; CPH',
    specialization: 'Psychology, counseling and guidance',
    experience: '',
    hospital: 'Private Practice, Visakhapatnam',
    city: 'Visakhapatnam',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '8886463951',
    address: 'Visakhapatnam',
    profileLink: 'https://www.visakhapatnamdoctors.com/',
    hospitalLink: 'https://www.visakhapatnamdoctors.com/',
    bookingLink: 'https://www.visakhapatnamdoctors.com/',
    about: 'Psychologist listed on Visakhapatnam Doctors directory with a background in counseling and guidance. Multiple postgraduate qualifications in psychology. Contact via phone: 8886463951.',
    avatarInitials: 'RM',
    avatarColor: '#ffa62b',
  },
  {
    id: 'viz-03',
    name: 'Pragna Mitra',
    specialty: 'Clinical Psychologist',
    qualification: 'MD / DPM (institutional profile)',
    specialization: 'Clinical Psychology',
    experience: '17 years',
    hospital: 'Government Hospital for Mental Care, Visakhapatnam',
    city: 'Visakhapatnam',
    fees: 'Government rates (subsidised)',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Government Hospital for Mental Care, Visakhapatnam',
    profileLink: '',
    hospitalLink: 'https://dmho.ap.gov.in/',
    bookingLink: 'https://dmho.ap.gov.in/',
    about: 'Assistant Professor in Clinical Psychology at the Government Hospital for Mental Care, Visakhapatnam. 17 years of experience providing government-funded mental health services.',
    avatarInitials: 'PM',
    avatarColor: '#ff006e',
  },
  {
    id: 'viz-04',
    name: 'Sivananda Neuro-Psychological Centre',
    specialty: 'Counselor',
    qualification: 'Clinical psychology clinic',
    specialization: 'Psychological counselling, neuro-psychological support',
    experience: '',
    hospital: 'Sivananda Neuro-Psychological Centre',
    city: 'Visakhapatnam',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '9848159620',
    address: 'Visakhapatnam',
    profileLink: '',
    hospitalLink: '',
    bookingLink: '',
    about: 'Clinic listed in the Andhra Pradesh Association of Clinical Psychologists (APACP) directory, offering psychological counselling and neuro-psychological support in Visakhapatnam.',
    avatarInitials: 'SN',
    avatarColor: '#1b998b',
  },

  // ── BHUBANESWAR (city14.csv) ──────────────────────────────

  {
    id: 'bhu-01',
    name: 'Dr. Abhijit Mohanty',
    specialty: 'Psychiatrist',
    qualification: 'MBBS, MD',
    specialization: 'Psychiatry / Neurosciences',
    experience: '',
    hospital: 'CARE Hospitals, Bhubaneswar',
    city: 'Bhubaneswar',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Unit No.42, Plot No.324, Prachi Enclave Rd, Rail Vihar, Chandrasekharpur, Bhubaneswar – 751016',
    profileLink: 'https://www.carehospitals.com/bhubaneswar/doctors/',
    hospitalLink: 'https://www.carehospitals.com/bhubaneswar/',
    bookingLink: 'https://www.carehospitals.com/bhubaneswar/doctors/',
    about: 'Psychiatrist listed in the specialist team at CARE Hospitals Bhubaneswar, a NABH-accredited multi-specialty hospital in Chandrasekharpur.',
    avatarInitials: 'AM',
    avatarColor: '#7209b7',
  },
  {
    id: 'bhu-02',
    name: 'Apollo Hospitals Bhubaneswar Psychology Team',
    specialty: 'Psychologist',
    qualification: 'Hospital psychology service',
    specialization: 'Psychology services',
    experience: '',
    hospital: 'Apollo Hospitals, Bhubaneswar',
    city: 'Bhubaneswar',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '0674-661066',
    address: 'Plot No-251, Samantapuri, Sainik School Road, Unit-15, Bhubaneswar – 751005',
    profileLink: 'https://www.apollohospitals.com/hospitals/apollo-hospitals-bhubaneswar',
    hospitalLink: 'https://www.apollohospitals.com/hospitals/apollo-hospitals-bhubaneswar',
    bookingLink: 'https://www.apollo247.com/hospitals/apollo-hospitals-bhubaneswar',
    about: 'Apollo Hospitals Bhubaneswar provides psychology services through its multi-specialty team. Book via the Apollo 24|7 platform or call the hospital directly.',
    avatarInitials: 'AH',
    avatarColor: '#e63946',
  },
  {
    id: 'bhu-03',
    name: 'Dr. Tanmaya Padhy',
    specialty: 'Clinical Psychologist',
    qualification: '',
    specialization: 'Clinical psychology / mental health services',
    experience: '',
    hospital: 'Sunshine Hospital, Bhubaneswar',
    city: 'Bhubaneswar',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Bhubaneswar',
    profileLink: 'https://www.sunshineodisha.com/doctors/',
    hospitalLink: 'https://www.sunshineodisha.com/',
    bookingLink: 'https://www.sunshineodisha.com/doctors/',
    about: 'Clinical Psychologist listed in the mental health team at Sunshine Hospital Bhubaneswar.',
    avatarInitials: 'TP',
    avatarColor: '#f4a261',
  },
  {
    id: 'bhu-04',
    name: 'Kalinga Hospital Counselling Support',
    specialty: 'Counselor',
    qualification: 'Hospital counselling service',
    specialization: 'Counselling and psychiatry support',
    experience: '',
    hospital: 'Kalinga Hospital, Bhubaneswar',
    city: 'Bhubaneswar',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '+91 90901 11144',
    address: 'Bhubaneswar',
    profileLink: 'https://www.kalingahospital.in/',
    hospitalLink: 'https://www.kalingahospital.in/',
    bookingLink: 'https://www.kalingahospital.in/',
    about: 'Kalinga Hospital Bhubaneswar provides institutional counselling and psychiatric support services. Contact the hospital directly for appointment details.',
    avatarInitials: 'KH',
    avatarColor: '#2d6a4f',
  },

  // ── COIMBATORE (city15.csv) ───────────────────────────────

  {
    id: 'cbe-01',
    name: 'Dr. D. Srinivasan',
    specialty: 'Psychiatrist',
    qualification: 'MD (Psychiatry); DPM – Institute of Mental Health, Chennai',
    specialization: 'Stress management, de-addiction, sexual dysfunction, hypnotherapy, personality development',
    experience: '40+ years',
    hospital: 'KMCH (Kovai Medical Center and Hospital)',
    city: 'Coimbatore',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: 4.4,
    languages: [],
    phone: '+91 422-4323800',
    address: '99, Avanashi Road, Coimbatore – 641014',
    profileLink: 'https://beta.kmchhospitals.com/doctors-post/dr-d-srinivasan/',
    hospitalLink: 'https://www.kmchhospitals.com/speciality-departments/psychological-medicine/',
    bookingLink: 'https://www.kmchhospitals.com/contact-us/',
    about: 'Consultant Psychiatrist in the Department of Psychological Medicine at KMCH, one of Coimbatore\'s premier multi-specialty hospitals. Over 40 years of clinical experience. Specialties include stress management, de-addiction, sexual dysfunction, and hypnotherapy. KMCH phone: +91 422-4323800. Justdial-rated 4.4.',
    avatarInitials: 'DS',
    avatarColor: '#457b9d',
  },
  {
    id: 'cbe-02',
    name: 'Mrs. Rizwana Parvin T M',
    specialty: 'Psychologist',
    qualification: 'M.Sc. Psychology',
    specialization: 'Psychology, counselling and therapy',
    experience: '10+ years',
    hospital: 'Mental Health Counselling Centre, R S Puram',
    city: 'Coimbatore',
    fees: '₹1,800',
    modes: ['In-person'],
    availability: 'Mon–Sat, 12:00 PM – 9:00 PM',
    rating: null,
    languages: [],
    phone: '',
    address: '33B1 PM Samy Colony 1st Street, R S Puram, Coimbatore – 641043',
    profileLink: 'https://www.docindia.com/coimbatore/psychologist',
    hospitalLink: 'https://www.docindia.com/coimbatore/psychologist',
    bookingLink: 'https://www.docindia.com/coimbatore/psychologist',
    about: 'Psychologist with 10+ years of experience at Mental Health Counselling Centre, R S Puram. Verified on DocIndia with a confirmed fee of ₹1,800 and fixed weekly timings.',
    avatarInitials: 'RP',
    avatarColor: '#da77f2',
  },
  {
    id: 'cbe-03',
    name: 'Dr. Santhoshi S',
    specialty: 'Clinical Psychologist',
    qualification: 'Clinical Psychology (DocIndia listed)',
    specialization: 'CBT, DBT, ACT, mindfulness-based therapy',
    experience: '17+ years',
    hospital: 'Serenity Academy Psychotherapy & Counseling Center, New Siddhapudur',
    city: 'Coimbatore',
    fees: '',
    modes: ['In-person'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'New Siddhapudur, Coimbatore',
    profileLink: 'https://www.docindia.com/coimbatore/clinical-psychologist',
    hospitalLink: 'https://www.docindia.com/coimbatore/clinical-psychologist',
    bookingLink: 'https://www.docindia.com/coimbatore/clinical-psychologist',
    about: 'Clinical psychologist with 17+ years of experience at Serenity Academy Psychotherapy & Counseling Center. Specialises in CBT, DBT, ACT, and mindfulness-based therapeutic approaches.',
    avatarInitials: 'SS',
    avatarColor: '#c1121f',
  },
  {
    id: 'cbe-04',
    name: 'Mind Care Counselling Centre',
    specialty: 'Counselor',
    qualification: 'Counselling centre — professional team',
    specialization: 'Counselling, psychodiagnosis, psychotherapy, follow-up care',
    experience: 'Est. 2010',
    hospital: 'Mind Care Counselling Centre, Coimbatore',
    city: 'Coimbatore',
    fees: '',
    modes: ['In-person', 'Video Consultation'],
    availability: '',
    rating: null,
    languages: [],
    phone: '',
    address: 'Coimbatore city centre',
    profileLink: 'https://www.mindcarecounselling.com/',
    hospitalLink: 'https://www.mindcarecounselling.com/',
    bookingLink: 'https://www.mindcarecounselling.com/',
    about: 'Established in 2010, Mind Care Counselling Centre is a long-running mental health practice in Coimbatore offering in-person and online counselling, psychodiagnosis, psychotherapy, and follow-up care.',
    avatarInitials: 'MC',
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
