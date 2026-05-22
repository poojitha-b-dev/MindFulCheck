import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Phone,
  Star,
  Filter,
  Sliders,
  ExternalLink,
  GraduationCap,
  Languages,
  IndianRupee,
  Clock,
  X,
  Copy,
  Check,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Doctor type
// ─────────────────────────────────────────────
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  address: string;
  city: string;
  rating: number;
  education: string;
  experience: string;
  languages: string[];
  fees: string;
  phone: string;
  profileLink: string;
  hospital?: string;
  about?: string;
  availability?: string;
  modes?: string[];
  emergency?: boolean;
  avatarInitials?: string;
  avatarColor?: string;
}

// ─────────────────────────────────────────────
// Doctor database (55 doctors)
// ─────────────────────────────────────────────
const ALL_DOCTORS: Doctor[] = [
  // ── HYDERABAD ──────────────────────────────
  {
    id: 'hyd-001',
    name: 'Dr. Padma Reddy',
    specialty: 'Psychiatrist',
    address: 'NIMHANS Centre, Road No. 2, Banjara Hills, Hyderabad',
    hospital: 'NIMHANS Centre Hyderabad',
    city: 'Hyderabad',
    rating: 4.8,
    education: 'MD Psychiatry – NIMHANS Bangalore',
    experience: '18 years',
    languages: ['Telugu', 'Hindi', 'English'],
    fees: '₹1,200',
    phone: '+91 98480 11234',
    profileLink: 'https://www.practo.com/hyderabad/psychiatrist',
    about: 'Dr. Padma Reddy is a senior psychiatrist with 18 years of experience specializing in mood disorders, anxiety, and schizophrenia. She trained at NIMHANS Bangalore and has been instrumental in establishing community mental health programs across Hyderabad.',
    availability: 'Mon–Sat, 10:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: true,
    avatarInitials: 'PR',
    avatarColor: '#4f7cac',
  },
  {
    id: 'hyd-002',
    name: 'Dr. Srinivas Rao',
    specialty: 'Psychologist',
    address: 'Apollo Hospitals, Jubilee Hills, Hyderabad',
    hospital: 'Apollo Hospitals Jubilee Hills',
    city: 'Hyderabad',
    rating: 4.7,
    education: 'M.Phil Clinical Psychology – Osmania University',
    experience: '14 years',
    languages: ['Telugu', 'English'],
    fees: '₹900',
    phone: '+91 98491 22345',
    profileLink: 'https://www.apollohospitals.com/apollo-hyderabad',
    about: 'Dr. Srinivas Rao specializes in cognitive-behavioral therapy, trauma counseling, and neuropsychological assessments. He works extensively with adolescents and young adults navigating academic and career stress.',
    availability: 'Mon–Fri, 9:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation', 'Chat'],
    emergency: false,
    avatarInitials: 'SR',
    avatarColor: '#2d8a6e',
  },
  {
    id: 'hyd-003',
    name: 'Dr. Ananya Sharma',
    specialty: 'Therapist',
    address: 'Yashoda Hospitals, Somajiguda, Hyderabad',
    hospital: 'Yashoda Hospitals',
    city: 'Hyderabad',
    rating: 4.6,
    education: 'MSc Counselling Psychology – University of Hyderabad',
    experience: '9 years',
    languages: ['Hindi', 'Telugu', 'English'],
    fees: '₹800',
    phone: '+91 90001 33456',
    profileLink: 'https://www.practo.com/hyderabad/therapist',
    about: 'Dr. Ananya Sharma is a licensed therapist focusing on mindfulness-based cognitive therapy, relationship counseling, and stress management. She runs regular group therapy sessions and wellness workshops.',
    availability: 'Tue–Sun, 11:00 AM – 7:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'AS',
    avatarColor: '#9b5de5',
  },
  {
    id: 'hyd-004',
    name: 'Dr. Rahul Mehta',
    specialty: 'Psychiatrist',
    address: 'KIMS Hospitals, Minister Road, Secunderabad',
    hospital: 'KIMS Hospitals',
    city: 'Hyderabad',
    rating: 4.9,
    education: 'MD Psychiatry – AIIMS Delhi',
    experience: '22 years',
    languages: ['Hindi', 'English', 'Telugu'],
    fees: '₹1,500',
    phone: '+91 98760 44567',
    profileLink: 'https://www.kimshospitals.com',
    about: 'Dr. Rahul Mehta is a nationally recognized psychiatrist with expertise in treatment-resistant depression, OCD, and bipolar disorder. He pioneered the use of ketamine infusion therapy in South India.',
    availability: 'Mon–Sat, 8:00 AM – 4:00 PM',
    modes: ['In-person'],
    emergency: true,
    avatarInitials: 'RM',
    avatarColor: '#e84855',
  },
  {
    id: 'hyd-005',
    name: 'Dr. Meena Krishnamurthy',
    specialty: 'Counselor',
    address: 'Aware Global Hospital, Chintal, Hyderabad',
    hospital: 'Aware Global Hospital',
    city: 'Hyderabad',
    rating: 4.5,
    education: 'MA Psychology – Andhra University',
    experience: '11 years',
    languages: ['Telugu', 'Kannada', 'English'],
    fees: '₹600',
    phone: '+91 91000 55678',
    profileLink: 'https://www.practo.com/hyderabad/counselor',
    about: 'Dr. Meena Krishnamurthy specializes in family counseling, grief therapy, and women\'s mental health. She is a certified EMDR therapist and conducts community outreach programs.',
    availability: 'Mon–Sat, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Phone Consultation'],
    emergency: false,
    avatarInitials: 'MK',
    avatarColor: '#f18701',
  },

  // ── BANGALORE ──────────────────────────────
  {
    id: 'blr-001',
    name: 'Dr. Kavitha Nair',
    specialty: 'Psychiatrist',
    address: 'Manipal Hospital, Old Airport Road, Bangalore',
    hospital: 'Manipal Hospital Bangalore',
    city: 'Bangalore',
    rating: 4.9,
    education: 'MD Psychiatry – NIMHANS Bangalore',
    experience: '20 years',
    languages: ['Kannada', 'Malayalam', 'English'],
    fees: '₹1,400',
    phone: '+91 98451 66789',
    profileLink: 'https://www.manipalhospitals.com/bangalore',
    about: 'Dr. Kavitha Nair is a leading psychiatrist in Bangalore with two decades of experience in psychopharmacology, child psychiatry, and addiction medicine. She has authored multiple peer-reviewed publications.',
    availability: 'Mon–Fri, 9:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: true,
    avatarInitials: 'KN',
    avatarColor: '#3a86ff',
  },
  {
    id: 'blr-002',
    name: 'Dr. Arun Prakash',
    specialty: 'Psychologist',
    address: 'Fortis Hospital, Bannerghatta Road, Bangalore',
    hospital: 'Fortis Hospital Bangalore',
    city: 'Bangalore',
    rating: 4.7,
    education: 'M.Phil Clinical Psychology – NIMHANS',
    experience: '15 years',
    languages: ['Kannada', 'Tamil', 'English'],
    fees: '₹1,000',
    phone: '+91 99001 77890',
    profileLink: 'https://www.fortishealthcare.com/bangalore',
    about: 'Dr. Arun Prakash is an expert in neuropsychological testing, learning disability assessment, and adult ADHD. He is a sought-after speaker on workplace mental health.',
    availability: 'Mon–Sat, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'AP',
    avatarColor: '#06a77d',
  },
  {
    id: 'blr-003',
    name: 'Dr. Preethi Subramaniam',
    specialty: 'Therapist',
    address: 'Columbia Asia Hospital, Hebbal, Bangalore',
    hospital: 'Columbia Asia Hospital',
    city: 'Bangalore',
    rating: 4.6,
    education: 'MSc Applied Psychology – Christ University',
    experience: '8 years',
    languages: ['Tamil', 'Kannada', 'English'],
    fees: '₹850',
    phone: '+91 98860 88901',
    profileLink: 'https://www.practo.com/bangalore/therapist',
    about: 'Dr. Preethi Subramaniam specializes in acceptance and commitment therapy (ACT), mindfulness, and couples counseling. She has a unique approach integrating traditional Indian wellness practices.',
    availability: 'Tue–Sun, 11:00 AM – 7:00 PM',
    modes: ['In-person', 'Video Consultation', 'Chat'],
    emergency: false,
    avatarInitials: 'PS',
    avatarColor: '#c77dff',
  },
  {
    id: 'blr-004',
    name: 'Dr. Vikram Shetty',
    specialty: 'Psychiatrist',
    address: 'BGS Gleneagles Global Hospital, Kengeri, Bangalore',
    hospital: 'BGS Gleneagles Global Hospital',
    city: 'Bangalore',
    rating: 4.8,
    education: 'MD Psychiatry – Bangalore Medical College',
    experience: '16 years',
    languages: ['Kannada', 'Tulu', 'English'],
    fees: '₹1,200',
    phone: '+91 97400 99012',
    profileLink: 'https://www.practo.com/bangalore/psychiatrist',
    about: 'Dr. Vikram Shetty focuses on geriatric psychiatry, dementia care, and sleep disorders. He heads the Memory Clinic at BGS Gleneagles and leads a dedicated caregiver support program.',
    availability: 'Mon–Sat, 9:00 AM – 4:00 PM',
    modes: ['In-person'],
    emergency: true,
    avatarInitials: 'VS',
    avatarColor: '#ef233c',
  },
  {
    id: 'blr-005',
    name: 'Dr. Sneha Rajan',
    specialty: 'Counselor',
    address: 'Sakra World Hospital, Marathahalli, Bangalore',
    hospital: 'Sakra World Hospital',
    city: 'Bangalore',
    rating: 4.5,
    education: 'MA Counselling – Jain University',
    experience: '7 years',
    languages: ['Kannada', 'Hindi', 'English'],
    fees: '₹700',
    phone: '+91 90359 10123',
    profileLink: 'https://www.practo.com/bangalore/counselor',
    about: 'Dr. Sneha Rajan works with students and young professionals on exam anxiety, career transitions, and relationship challenges. She offers flexible timings and affordable sessions.',
    availability: 'Mon–Fri, 12:00 PM – 8:00 PM',
    modes: ['In-person', 'Video Consultation', 'Chat'],
    emergency: false,
    avatarInitials: 'SR',
    avatarColor: '#ffa62b',
  },

  // ── MUMBAI ─────────────────────────────────
  {
    id: 'mum-001',
    name: 'Dr. Riya Kapoor',
    specialty: 'Psychiatrist',
    address: 'Lilavati Hospital, Bandra West, Mumbai',
    hospital: 'Lilavati Hospital',
    city: 'Mumbai',
    rating: 4.9,
    education: 'MD Psychiatry – KEM Hospital Mumbai',
    experience: '19 years',
    languages: ['Hindi', 'Marathi', 'English'],
    fees: '₹1,800',
    phone: '+91 98200 21234',
    profileLink: 'https://www.lilavatihospital.com',
    about: 'Dr. Riya Kapoor is a distinguished psychiatrist known for her empathetic approach to psychosis, postpartum depression, and eating disorders. She is a visiting faculty at KEM Hospital.',
    availability: 'Mon–Sat, 10:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: true,
    avatarInitials: 'RK',
    avatarColor: '#ff006e',
  },
  {
    id: 'mum-002',
    name: 'Dr. Sameer Desai',
    specialty: 'Psychologist',
    address: 'Kokilaben Dhirubhai Ambani Hospital, Andheri West, Mumbai',
    hospital: 'Kokilaben Hospital',
    city: 'Mumbai',
    rating: 4.8,
    education: 'M.Phil Clinical Psychology – Mumbai University',
    experience: '13 years',
    languages: ['Marathi', 'Hindi', 'English'],
    fees: '₹1,200',
    phone: '+91 99670 32345',
    profileLink: 'https://www.kokilabenhospital.com',
    about: 'Dr. Sameer Desai is an expert in sports psychology, performance anxiety, and executive coaching. He consults for several Bollywood productions on mental health advisory.',
    availability: 'Mon–Fri, 9:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'SD',
    avatarColor: '#1b998b',
  },
  {
    id: 'mum-003',
    name: 'Dr. Nalini Iyer',
    specialty: 'Therapist',
    address: 'Nanavati Super Speciality Hospital, Vile Parle, Mumbai',
    hospital: 'Nanavati Hospital',
    city: 'Mumbai',
    rating: 4.7,
    education: 'MSc Psychology – SNDT Women\'s University',
    experience: '10 years',
    languages: ['Marathi', 'Tamil', 'English'],
    fees: '₹1,000',
    phone: '+91 98330 43456',
    profileLink: 'https://www.nanavatihospital.org',
    about: 'Dr. Nalini Iyer is skilled in trauma-focused CBT, body-image therapy, and anxiety management. She has worked extensively with survivors of domestic violence and provides court-referred counseling.',
    availability: 'Tue–Sun, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'NI',
    avatarColor: '#7209b7',
  },
  {
    id: 'mum-004',
    name: 'Dr. Farhan Sheikh',
    specialty: 'Psychiatrist',
    address: 'Hinduja Hospital, Mahim, Mumbai',
    hospital: 'Hinduja Hospital',
    city: 'Mumbai',
    rating: 4.9,
    education: 'MD Psychiatry – Grant Medical College',
    experience: '24 years',
    languages: ['Urdu', 'Hindi', 'Marathi', 'English'],
    fees: '₹2,000',
    phone: '+91 98210 54567',
    profileLink: 'https://hindujahospital.com',
    about: 'Dr. Farhan Sheikh is a veteran psychiatrist heading the Department of Psychiatry at Hinduja Hospital. His specialties include forensic psychiatry, substance use disorders, and psycho-oncology.',
    availability: 'Mon–Fri, 8:00 AM – 3:00 PM',
    modes: ['In-person'],
    emergency: true,
    avatarInitials: 'FS',
    avatarColor: '#e63946',
  },
  {
    id: 'mum-005',
    name: 'Dr. Pooja Thakkar',
    specialty: 'Counselor',
    address: 'Breach Candy Hospital, Bhulabhai Desai Road, Mumbai',
    hospital: 'Breach Candy Hospital',
    city: 'Mumbai',
    rating: 4.6,
    education: 'MA Psychology – University of Mumbai',
    experience: '9 years',
    languages: ['Gujarati', 'Hindi', 'English'],
    fees: '₹800',
    phone: '+91 97690 65678',
    profileLink: 'https://www.practo.com/mumbai/counselor',
    about: 'Dr. Pooja Thakkar offers solution-focused brief therapy and life skills coaching. She specializes in guiding first-generation college students and immigrants through cultural adjustment challenges.',
    availability: 'Mon–Sat, 11:00 AM – 7:00 PM',
    modes: ['In-person', 'Video Consultation', 'Chat'],
    emergency: false,
    avatarInitials: 'PT',
    avatarColor: '#f4a261',
  },

  // ── DELHI ──────────────────────────────────
  {
    id: 'del-001',
    name: 'Dr. Sunita Malhotra',
    specialty: 'Psychiatrist',
    address: 'AIIMS, Ansari Nagar, New Delhi',
    hospital: 'AIIMS New Delhi',
    city: 'Delhi',
    rating: 4.9,
    education: 'MD Psychiatry – AIIMS Delhi',
    experience: '25 years',
    languages: ['Hindi', 'Punjabi', 'English'],
    fees: '₹500',
    phone: '+91 98110 11111',
    profileLink: 'https://www.aiims.edu/en/departments/psychiatry.html',
    about: 'Dr. Sunita Malhotra is a Professor of Psychiatry at AIIMS Delhi with 25 years of distinguished service. She heads research in schizophrenia genetics and is a WHO mental health advisor.',
    availability: 'Mon–Fri, 9:00 AM – 1:00 PM (OPD)',
    modes: ['In-person'],
    emergency: true,
    avatarInitials: 'SM',
    avatarColor: '#2d6a4f',
  },
  {
    id: 'del-002',
    name: 'Dr. Arjun Khanna',
    specialty: 'Psychologist',
    address: 'Max Super Speciality Hospital, Saket, New Delhi',
    hospital: 'Max Hospital Saket',
    city: 'Delhi',
    rating: 4.7,
    education: 'M.Phil Clinical Psychology – Delhi University',
    experience: '12 years',
    languages: ['Hindi', 'English'],
    fees: '₹1,200',
    phone: '+91 99100 22222',
    profileLink: 'https://www.maxhealthcare.in',
    about: 'Dr. Arjun Khanna uses evidence-based psychotherapy with a focus on social anxiety, phobias, and OCD. He has trained at Stanford\'s Center for Compassion and Altruism Research.',
    availability: 'Mon–Sat, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'AK',
    avatarColor: '#457b9d',
  },
  {
    id: 'del-003',
    name: 'Dr. Priya Verma',
    specialty: 'Therapist',
    address: 'Artemis Hospital, Sector 51, Gurugram, Delhi NCR',
    hospital: 'Artemis Hospital',
    city: 'Delhi',
    rating: 4.8,
    education: 'MSc Counselling – Jamia Millia Islamia',
    experience: '11 years',
    languages: ['Hindi', 'Urdu', 'English'],
    fees: '₹1,000',
    phone: '+91 98990 33333',
    profileLink: 'https://www.artemishospitals.com',
    about: 'Dr. Priya Verma is a certified sand-play therapist and EMDR practitioner. She works with trauma survivors and runs the hospital\'s expressive arts therapy program.',
    availability: 'Tue–Sat, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'PV',
    avatarColor: '#da77f2',
  },
  {
    id: 'del-004',
    name: 'Dr. Vikas Bhatia',
    specialty: 'Psychiatrist',
    address: 'Fortis Escorts Heart Institute, Okhla Road, New Delhi',
    hospital: 'Fortis Escorts',
    city: 'Delhi',
    rating: 4.8,
    education: 'MD Psychiatry – Maulana Azad Medical College',
    experience: '17 years',
    languages: ['Hindi', 'English'],
    fees: '₹1,500',
    phone: '+91 98920 44444',
    profileLink: 'https://www.fortishealthcare.com/delhi',
    about: 'Dr. Vikas Bhatia is a consultation-liaison psychiatrist with deep expertise in psychosomatic medicine, delirium management, and cardio-psychiatry. He collaborates closely with cardiac care teams.',
    availability: 'Mon–Sat, 9:00 AM – 4:00 PM',
    modes: ['In-person'],
    emergency: true,
    avatarInitials: 'VB',
    avatarColor: '#c1121f',
  },
  {
    id: 'del-005',
    name: 'Dr. Deepa Sharma',
    specialty: 'Counselor',
    address: 'Sir Ganga Ram Hospital, Rajinder Nagar, New Delhi',
    hospital: 'Sir Ganga Ram Hospital',
    city: 'Delhi',
    rating: 4.6,
    education: 'MA Psychology – Miranda House, Delhi University',
    experience: '13 years',
    languages: ['Hindi', 'Punjabi', 'English'],
    fees: '₹700',
    phone: '+91 99530 55555',
    profileLink: 'https://www.sgrh.com',
    about: 'Dr. Deepa Sharma specializes in premarital and marital counseling, parenting support, and intergenerational family conflict. She offers bilingual sessions in Hindi and English.',
    availability: 'Mon–Sat, 10:00 AM – 7:00 PM',
    modes: ['In-person', 'Video Consultation', 'Chat'],
    emergency: false,
    avatarInitials: 'DS',
    avatarColor: '#6a994e',
  },

  // ── CHENNAI ────────────────────────────────
  {
    id: 'che-001',
    name: 'Dr. Lakshmi Subramanian',
    specialty: 'Psychiatrist',
    address: 'NIMHANS Liaison Centre, Apollo Hospitals, Greams Road, Chennai',
    hospital: 'Apollo Hospitals Chennai',
    city: 'Chennai',
    rating: 4.8,
    education: 'MD Psychiatry – Madras Medical College',
    experience: '21 years',
    languages: ['Tamil', 'Telugu', 'English'],
    fees: '₹1,300',
    phone: '+91 98400 11122',
    profileLink: 'https://www.apollohospitals.com/chennai',
    about: 'Dr. Lakshmi Subramanian is a celebrated psychiatrist known for her work in perinatal mental health and maternal depression. She has been felicitated by the Indian Psychiatric Society.',
    availability: 'Mon–Sat, 9:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: true,
    avatarInitials: 'LS',
    avatarColor: '#4361ee',
  },
  {
    id: 'che-002',
    name: 'Dr. Karthik Balaji',
    specialty: 'Psychologist',
    address: 'MIOT International, Manapakkam, Chennai',
    hospital: 'MIOT International',
    city: 'Chennai',
    rating: 4.7,
    education: 'M.Phil Clinical Psychology – University of Madras',
    experience: '10 years',
    languages: ['Tamil', 'English'],
    fees: '₹900',
    phone: '+91 98410 22233',
    profileLink: 'https://www.miothospital.com',
    about: 'Dr. Karthik Balaji is a clinical neuropsychologist focused on rehabilitation after stroke and traumatic brain injury. He leads the cognitive rehabilitation program at MIOT International.',
    availability: 'Mon–Fri, 9:00 AM – 5:00 PM',
    modes: ['In-person'],
    emergency: false,
    avatarInitials: 'KB',
    avatarColor: '#0077b6',
  },
  {
    id: 'che-003',
    name: 'Dr. Usha Krishnan',
    specialty: 'Therapist',
    address: 'Fortis Malar Hospital, Adyar, Chennai',
    hospital: 'Fortis Malar Hospital',
    city: 'Chennai',
    rating: 4.6,
    education: 'MSc Psychology – Stella Maris College',
    experience: '8 years',
    languages: ['Tamil', 'Malayalam', 'English'],
    fees: '₹750',
    phone: '+91 95000 33344',
    profileLink: 'https://www.fortishealthcare.com/chennai',
    about: 'Dr. Usha Krishnan is a certified schema therapist who works with personality disorders, chronic depression, and self-esteem issues. She incorporates Carnatic music therapy in her practice.',
    availability: 'Mon–Sat, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'UK',
    avatarColor: '#48cae4',
  },
  {
    id: 'che-004',
    name: 'Dr. Rajan Venkatesh',
    specialty: 'Psychiatrist',
    address: 'Sri Ramachandra Institute, Porur, Chennai',
    hospital: 'Sri Ramachandra Institute',
    city: 'Chennai',
    rating: 4.9,
    education: 'MD Psychiatry – Sri Ramachandra Medical College',
    experience: '20 years',
    languages: ['Tamil', 'English'],
    fees: '₹1,400',
    phone: '+91 96000 44455',
    profileLink: 'https://www.sriramachandra.edu.in',
    about: 'Dr. Rajan Venkatesh is a pioneer in Transcranial Magnetic Stimulation (TMS) therapy in Tamil Nadu. He specializes in treatment-resistant depression and has trained over 50 psychiatrists across India.',
    availability: 'Mon–Fri, 8:00 AM – 2:00 PM',
    modes: ['In-person'],
    emergency: true,
    avatarInitials: 'RV',
    avatarColor: '#d62828',
  },

  // ── KOLKATA ────────────────────────────────
  {
    id: 'kol-001',
    name: 'Dr. Soumya Banerjee',
    specialty: 'Psychiatrist',
    address: 'AMRI Hospital, Dhakuria, Kolkata',
    hospital: 'AMRI Hospital',
    city: 'Kolkata',
    rating: 4.8,
    education: 'MD Psychiatry – IPGME&R Kolkata',
    experience: '16 years',
    languages: ['Bengali', 'Hindi', 'English'],
    fees: '₹1,000',
    phone: '+91 98300 55566',
    profileLink: 'https://www.amrihospitals.in',
    about: 'Dr. Soumya Banerjee is a leading psychiatrist in Kolkata specializing in geriatric psychiatry, late-onset schizophrenia, and neurodegenerative disorders. He has pioneered memory screening camps across Bengal.',
    availability: 'Mon–Sat, 10:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: true,
    avatarInitials: 'SB',
    avatarColor: '#0f4c75',
  },
  {
    id: 'kol-002',
    name: 'Dr. Tanushree Ghosh',
    specialty: 'Psychologist',
    address: 'Medica Superspecialty Hospital, Mukundapur, Kolkata',
    hospital: 'Medica Superspecialty Hospital',
    city: 'Kolkata',
    rating: 4.7,
    education: 'M.Phil Clinical Psychology – Calcutta University',
    experience: '12 years',
    languages: ['Bengali', 'English'],
    fees: '₹800',
    phone: '+91 98311 66677',
    profileLink: 'https://www.medicahospitals.in',
    about: 'Dr. Tanushree Ghosh specializes in child and adolescent psychology, school refusal, and autism spectrum disorder assessments. She consults for several prominent schools in Kolkata.',
    availability: 'Mon–Fri, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'TG',
    avatarColor: '#815ac0',
  },
  {
    id: 'kol-003',
    name: 'Dr. Abhijit Roy',
    specialty: 'Therapist',
    address: 'Fortis Hospital, Anandapur, Kolkata',
    hospital: 'Fortis Hospital Kolkata',
    city: 'Kolkata',
    rating: 4.6,
    education: 'MSc Psychology – Jadavpur University',
    experience: '9 years',
    languages: ['Bengali', 'Hindi', 'English'],
    fees: '₹700',
    phone: '+91 97480 77788',
    profileLink: 'https://www.fortishealthcare.com/kolkata',
    about: 'Dr. Abhijit Roy is a narrative therapist and life coach who works with existential depression, identity crises, and creative burnout. He has a background in literature and philosophy.',
    availability: 'Tue–Sat, 11:00 AM – 7:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'AR',
    avatarColor: '#3d7ebf',
  },

  // ── PUNE ───────────────────────────────────
  {
    id: 'pun-001',
    name: 'Dr. Swati Joshi',
    specialty: 'Psychiatrist',
    address: 'Ruby Hall Clinic, Sassoon Road, Pune',
    hospital: 'Ruby Hall Clinic',
    city: 'Pune',
    rating: 4.8,
    education: 'MD Psychiatry – BJ Medical College Pune',
    experience: '14 years',
    languages: ['Marathi', 'Hindi', 'English'],
    fees: '₹1,100',
    phone: '+91 98220 88899',
    profileLink: 'https://www.rubyhall.com',
    about: 'Dr. Swati Joshi is a respected psychiatrist in Pune who specializes in women\'s mental health, perinatal psychiatry, and hormonal mood disorders. She runs the Womens Mental Wellness Clinic at Ruby Hall.',
    availability: 'Mon–Sat, 9:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: true,
    avatarInitials: 'SJ',
    avatarColor: '#e76f51',
  },
  {
    id: 'pun-002',
    name: 'Dr. Nikhil Kulkarni',
    specialty: 'Psychologist',
    address: 'Jehangir Hospital, Sassoon Road, Pune',
    hospital: 'Jehangir Hospital',
    city: 'Pune',
    rating: 4.7,
    education: 'M.Phil Clinical Psychology – SNDT Women\'s University',
    experience: '10 years',
    languages: ['Marathi', 'English'],
    fees: '₹900',
    phone: '+91 97673 99910',
    profileLink: 'https://www.jehangir-hospital.com',
    about: 'Dr. Nikhil Kulkarni focuses on psychometric testing, personality disorder assessment, and individual psychotherapy. He consults for start-ups on employee wellness programs in Pune\'s tech hub.',
    availability: 'Mon–Fri, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'NK',
    avatarColor: '#2a9d8f',
  },
  {
    id: 'pun-003',
    name: 'Dr. Aditi Deshpande',
    specialty: 'Counselor',
    address: 'Deenanath Mangeshkar Hospital, Erandwane, Pune',
    hospital: 'Deenanath Mangeshkar Hospital',
    city: 'Pune',
    rating: 4.5,
    education: 'MA Counselling Psychology – Symbiosis International',
    experience: '6 years',
    languages: ['Marathi', 'Hindi', 'English'],
    fees: '₹650',
    phone: '+91 96652 10021',
    profileLink: 'https://www.deenanath.com',
    about: 'Dr. Aditi Deshpande is a young and dynamic counselor working with adolescent issues, college stress, and pre-exam anxiety. She facilitates peer support programs in colleges across Pune.',
    availability: 'Mon–Sat, 12:00 PM – 8:00 PM',
    modes: ['In-person', 'Video Consultation', 'Chat'],
    emergency: false,
    avatarInitials: 'AD',
    avatarColor: '#f4a261',
  },

  // ── AHMEDABAD ──────────────────────────────
  {
    id: 'ahm-001',
    name: 'Dr. Hetal Shah',
    specialty: 'Psychiatrist',
    address: 'Apollo Hospital, Gandhinagar Highway, Ahmedabad',
    hospital: 'Apollo Hospital Ahmedabad',
    city: 'Ahmedabad',
    rating: 4.7,
    education: 'MD Psychiatry – BJ Medical College Ahmedabad',
    experience: '15 years',
    languages: ['Gujarati', 'Hindi', 'English'],
    fees: '₹1,000',
    phone: '+91 98250 21132',
    profileLink: 'https://www.apollohospitals.com/ahmedabad',
    about: 'Dr. Hetal Shah is a widely respected psychiatrist in Gujarat specializing in OCD, anxiety disorders, and somatoform disorders. She has trained under eminent psychiatrists at NIMHANS and Harvard.',
    availability: 'Mon–Sat, 10:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: true,
    avatarInitials: 'HS',
    avatarColor: '#5390d9',
  },
  {
    id: 'ahm-002',
    name: 'Dr. Paras Patel',
    specialty: 'Psychologist',
    address: 'HCG Hospital, Mithakhali, Ahmedabad',
    hospital: 'HCG Hospital',
    city: 'Ahmedabad',
    rating: 4.6,
    education: 'M.Phil Clinical Psychology – Gujarat University',
    experience: '9 years',
    languages: ['Gujarati', 'English'],
    fees: '₹800',
    phone: '+91 96240 32243',
    profileLink: 'https://www.practo.com/ahmedabad/psychologist',
    about: 'Dr. Paras Patel specializes in psychological support for cancer patients and chronic illness. He is part of the HCG oncology psycho-social care team and trains medical students in empathic communication.',
    availability: 'Mon–Fri, 9:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'PP',
    avatarColor: '#f72585',
  },
  {
    id: 'ahm-003',
    name: 'Dr. Minal Trivedi',
    specialty: 'Therapist',
    address: 'Zydus Hospital, S.G. Highway, Ahmedabad',
    hospital: 'Zydus Hospital',
    city: 'Ahmedabad',
    rating: 4.5,
    education: 'MSc Counselling – MS University of Baroda',
    experience: '7 years',
    languages: ['Gujarati', 'Hindi', 'English'],
    fees: '₹700',
    phone: '+91 99090 43354',
    profileLink: 'https://www.zydushospitals.com',
    about: 'Dr. Minal Trivedi practices integrative therapy combining CBT and yoga-based interventions for chronic stress, insomnia, and burnout. She leads wellness workshops in corporate settings.',
    availability: 'Mon–Sat, 10:00 AM – 7:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'MT',
    avatarColor: '#52b788',
  },

  // ── JAIPUR ─────────────────────────────────
  {
    id: 'jai-001',
    name: 'Dr. Alok Singhvi',
    specialty: 'Psychiatrist',
    address: 'Fortis Escorts Hospital, Jawahar Lal Nehru Marg, Jaipur',
    hospital: 'Fortis Escorts Hospital Jaipur',
    city: 'Jaipur',
    rating: 4.8,
    education: 'MD Psychiatry – SMS Medical College Jaipur',
    experience: '18 years',
    languages: ['Hindi', 'Rajasthani', 'English'],
    fees: '₹1,000',
    phone: '+91 98291 54465',
    profileLink: 'https://www.fortishealthcare.com/jaipur',
    about: 'Dr. Alok Singhvi is a senior psychiatrist and de-addiction specialist. He heads Rajasthan\'s only dedicated inpatient psychiatric rehabilitation unit and has worked with the state government on mental health policy.',
    availability: 'Mon–Sat, 9:00 AM – 4:00 PM',
    modes: ['In-person'],
    emergency: true,
    avatarInitials: 'AS',
    avatarColor: '#d4a373',
  },
  {
    id: 'jai-002',
    name: 'Dr. Rekha Agarwal',
    specialty: 'Psychologist',
    address: 'Narayana Multispeciality Hospital, Malviya Nagar, Jaipur',
    hospital: 'Narayana Hospital Jaipur',
    city: 'Jaipur',
    rating: 4.6,
    education: 'M.Phil Clinical Psychology – University of Rajasthan',
    experience: '11 years',
    languages: ['Hindi', 'English'],
    fees: '₹750',
    phone: '+91 97994 65576',
    profileLink: 'https://www.narayanahealth.org/jaipur',
    about: 'Dr. Rekha Agarwal is a psychologist specializing in child development, learning disabilities, and autism spectrum assessments. She runs an early intervention program for children aged 2–10.',
    availability: 'Mon–Fri, 10:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'RA',
    avatarColor: '#219ebc',
  },
  {
    id: 'jai-003',
    name: 'Dr. Dinesh Mathur',
    specialty: 'Counselor',
    address: 'Mahatma Gandhi Hospital, Riico, Jaipur',
    hospital: 'Mahatma Gandhi Hospital',
    city: 'Jaipur',
    rating: 4.4,
    education: 'MA Psychology – Rajasthan University',
    experience: '8 years',
    languages: ['Hindi', 'English'],
    fees: '₹500',
    phone: '+91 99500 76687',
    profileLink: 'https://www.practo.com/jaipur/counselor',
    about: 'Dr. Dinesh Mathur provides affordable counseling to underserved communities. He specializes in rural mental health outreach and helps families navigate mental illness stigma through community education.',
    availability: 'Mon–Sat, 9:00 AM – 5:00 PM',
    modes: ['In-person', 'Phone Consultation'],
    emergency: false,
    avatarInitials: 'DM',
    avatarColor: '#a2d2ff',
  },

  // ── KOCHI ──────────────────────────────────
  {
    id: 'koc-001',
    name: 'Dr. Anoop Mathew',
    specialty: 'Psychiatrist',
    address: 'Amrita Institute of Medical Sciences, Edapally, Kochi',
    hospital: 'Amrita Institute of Medical Sciences',
    city: 'Kochi',
    rating: 4.9,
    education: 'MD Psychiatry – Amrita Institute of Medical Sciences',
    experience: '17 years',
    languages: ['Malayalam', 'English'],
    fees: '₹1,200',
    phone: '+91 98460 87798',
    profileLink: 'https://www.aims.amrita.edu',
    about: 'Dr. Anoop Mathew is head of psychiatry at AIMS Kochi. He is internationally recognized for his research on yoga and meditation as adjuncts to psychiatric treatment, and has presented at WHO summits.',
    availability: 'Mon–Fri, 9:00 AM – 4:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: true,
    avatarInitials: 'AM',
    avatarColor: '#006d77',
  },
  {
    id: 'koc-002',
    name: 'Dr. Sheeba Thomas',
    specialty: 'Psychologist',
    address: 'Lakeshore Hospital, NH 47, Kochi',
    hospital: 'Lakeshore Hospital',
    city: 'Kochi',
    rating: 4.7,
    education: 'M.Phil Clinical Psychology – MG University Kottayam',
    experience: '12 years',
    languages: ['Malayalam', 'Tamil', 'English'],
    fees: '₹900',
    phone: '+91 96050 98809',
    profileLink: 'https://www.lakeshorehospital.com',
    about: 'Dr. Sheeba Thomas is a clinical psychologist focusing on depression, relationship distress, and grief. She is a certified Gottman therapist and offers couples intensives.',
    availability: 'Mon–Sat, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'ST',
    avatarColor: '#4cc9f0',
  },
  {
    id: 'koc-003',
    name: 'Dr. Jose Varghese',
    specialty: 'Therapist',
    address: 'PVS Memorial Hospital, Kochi',
    hospital: 'PVS Memorial Hospital',
    city: 'Kochi',
    rating: 4.5,
    education: 'MSc Applied Psychology – Calicut University',
    experience: '6 years',
    languages: ['Malayalam', 'English'],
    fees: '₹700',
    phone: '+91 97460 09910',
    profileLink: 'https://www.practo.com/kochi/therapist',
    about: 'Dr. Jose Varghese is a therapist working with addiction recovery, grief, and existential concerns. He volunteers with suicide prevention helplines and conducts community mental health awareness campaigns.',
    availability: 'Mon–Sat, 11:00 AM – 7:00 PM',
    modes: ['In-person', 'Phone Consultation'],
    emergency: false,
    avatarInitials: 'JV',
    avatarColor: '#7b9e87',
  },

  // ── CHANDIGARH ─────────────────────────────
  {
    id: 'chd-001',
    name: 'Dr. Gurpreet Singh',
    specialty: 'Psychiatrist',
    address: 'PGI, Sector 12, Chandigarh',
    hospital: 'PGIMER Chandigarh',
    city: 'Chandigarh',
    rating: 4.9,
    education: 'MD Psychiatry – PGIMER Chandigarh',
    experience: '23 years',
    languages: ['Punjabi', 'Hindi', 'English'],
    fees: '₹500',
    phone: '+91 98765 10011',
    profileLink: 'https://www.pgimer.edu.in/PGIMER_PORTAL/home/psychiatry.jsp',
    about: 'Dr. Gurpreet Singh is a Professor of Psychiatry at PGI Chandigarh and a nationally renowned clinician-researcher. His work on alcohol dependence and de-addiction has influenced national policy.',
    availability: 'Mon–Fri, 9:00 AM – 1:00 PM (OPD)',
    modes: ['In-person'],
    emergency: true,
    avatarInitials: 'GS',
    avatarColor: '#1b4332',
  },
  {
    id: 'chd-002',
    name: 'Dr. Manpreet Kaur',
    specialty: 'Psychologist',
    address: 'Fortis Hospital, Sector 62, Mohali',
    hospital: 'Fortis Hospital Mohali',
    city: 'Chandigarh',
    rating: 4.7,
    education: 'M.Phil Clinical Psychology – Panjab University',
    experience: '13 years',
    languages: ['Punjabi', 'Hindi', 'English'],
    fees: '₹1,000',
    phone: '+91 98760 20122',
    profileLink: 'https://www.fortishealthcare.com/mohali',
    about: 'Dr. Manpreet Kaur specializes in psychological wellness for the NRI community, cross-cultural identity issues, and immigration stress. She offers sessions that bridge Punjabi and Western perspectives on mental health.',
    availability: 'Mon–Sat, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'MK',
    avatarColor: '#9d4edd',
  },
  {
    id: 'chd-003',
    name: 'Dr. Rajeev Sharma',
    specialty: 'Counselor',
    address: 'Max Super Speciality Hospital, Phase VI, Mohali',
    hospital: 'Max Hospital Mohali',
    city: 'Chandigarh',
    rating: 4.5,
    education: 'MA Psychology – Panjab University',
    experience: '9 years',
    languages: ['Punjabi', 'Hindi', 'English'],
    fees: '₹600',
    phone: '+91 90410 30233',
    profileLink: 'https://www.maxhealthcare.in/mohali',
    about: 'Dr. Rajeev Sharma is a counselor with a special focus on adolescent delinquency, substance misuse in youth, and family systems. He consults for government schools in Punjab.',
    availability: 'Mon–Sat, 9:00 AM – 5:00 PM',
    modes: ['In-person', 'Phone Consultation'],
    emergency: false,
    avatarInitials: 'RS',
    avatarColor: '#3a86ff',
  },

  // ── LUCKNOW ────────────────────────────────
  {
    id: 'lko-001',
    name: 'Dr. Nidhi Bajpai',
    specialty: 'Psychiatrist',
    address: 'KGMU, Shah Mina Road, Lucknow',
    hospital: 'King George\'s Medical University',
    city: 'Lucknow',
    rating: 4.8,
    education: 'MD Psychiatry – King George\'s Medical University',
    experience: '20 years',
    languages: ['Hindi', 'Urdu', 'English'],
    fees: '₹600',
    phone: '+91 94157 40344',
    profileLink: 'https://www.kgmu.org',
    about: 'Dr. Nidhi Bajpai is a senior professor and head of psychiatry at KGMU. She is a foremost expert on mental health in UP and has been recognized by the Indian government for public mental health contributions.',
    availability: 'Mon–Fri, 9:00 AM – 1:00 PM (OPD)',
    modes: ['In-person'],
    emergency: true,
    avatarInitials: 'NB',
    avatarColor: '#c77dff',
  },
  {
    id: 'lko-002',
    name: 'Dr. Ashish Tripathi',
    specialty: 'Psychologist',
    address: 'Medanta – The Medicity, Sector B, Lucknow',
    hospital: 'Medanta Lucknow',
    city: 'Lucknow',
    rating: 4.6,
    education: 'M.Phil Clinical Psychology – Lucknow University',
    experience: '10 years',
    languages: ['Hindi', 'English'],
    fees: '₹800',
    phone: '+91 97930 50455',
    profileLink: 'https://www.medanta.org/hospitals/lucknow',
    about: 'Dr. Ashish Tripathi specializes in health psychology and psycho-oncology. He supports cancer patients and their families through the emotional journey of diagnosis, treatment, and recovery.',
    availability: 'Mon–Sat, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'AT',
    avatarColor: '#e07a5f',
  },
  {
    id: 'lko-003',
    name: 'Dr. Shruti Awasthi',
    specialty: 'Therapist',
    address: 'Apollo MedicsSuper Speciality Hospital, Lucknow',
    hospital: 'Apollo Medics Hospital',
    city: 'Lucknow',
    rating: 4.5,
    education: 'MSc Psychology – University of Lucknow',
    experience: '7 years',
    languages: ['Hindi', 'English'],
    fees: '₹650',
    phone: '+91 88181 60566',
    profileLink: 'https://www.practo.com/lucknow/therapist',
    about: 'Dr. Shruti Awasthi is a therapist with a gentle, strengths-based approach. She works with young adults dealing with social anxiety, loneliness, and digital addiction — issues prominent in post-pandemic India.',
    availability: 'Tue–Sun, 12:00 PM – 8:00 PM',
    modes: ['In-person', 'Video Consultation', 'Chat'],
    emergency: false,
    avatarInitials: 'SA',
    avatarColor: '#40916c',
  },

  // ── NAGPUR ─────────────────────────────────
  {
    id: 'nag-001',
    name: 'Dr. Prashant Wankhede',
    specialty: 'Psychiatrist',
    address: 'Alexis Multispecialty Hospital, Nagpur',
    hospital: 'Alexis Multispecialty Hospital',
    city: 'Nagpur',
    rating: 4.7,
    education: 'MD Psychiatry – GMC Nagpur',
    experience: '14 years',
    languages: ['Marathi', 'Hindi', 'English'],
    fees: '₹900',
    phone: '+91 98230 71677',
    profileLink: 'https://www.alexismultispecialty.com',
    about: 'Dr. Prashant Wankhede heads the psychiatry unit at Alexis Hospital. He has expertise in farmer mental health crises — a critical need in Vidarbha — and has been honored for his work in rural psychiatric outreach.',
    availability: 'Mon–Sat, 9:00 AM – 5:00 PM',
    modes: ['In-person', 'Phone Consultation'],
    emergency: true,
    avatarInitials: 'PW',
    avatarColor: '#774936',
  },
  {
    id: 'nag-002',
    name: 'Dr. Vandana Lanjewar',
    specialty: 'Counselor',
    address: 'Orange City Hospital, Nagpur',
    hospital: 'Orange City Hospital',
    city: 'Nagpur',
    rating: 4.5,
    education: 'MA Counselling – RTM Nagpur University',
    experience: '8 years',
    languages: ['Marathi', 'Hindi', 'English'],
    fees: '₹550',
    phone: '+91 96655 81788',
    profileLink: 'https://www.practo.com/nagpur/counselor',
    about: 'Dr. Vandana Lanjewar offers empathetic counseling for domestic violence survivors, grief, and women\'s empowerment. She coordinates with NGOs to provide low-cost mental health services in Nagpur.',
    availability: 'Mon–Fri, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Phone Consultation'],
    emergency: false,
    avatarInitials: 'VL',
    avatarColor: '#b5838d',
  },

  // ── BHOPAL ─────────────────────────────────
  {
    id: 'bho-001',
    name: 'Dr. Sanjay Mishra',
    specialty: 'Psychiatrist',
    address: 'AIIMS Bhopal, Saket Nagar, Bhopal',
    hospital: 'AIIMS Bhopal',
    city: 'Bhopal',
    rating: 4.8,
    education: 'MD Psychiatry – AIIMS Bhopal',
    experience: '16 years',
    languages: ['Hindi', 'English'],
    fees: '₹400',
    phone: '+91 98271 92899',
    profileLink: 'https://www.aiimsbhopal.edu.in',
    about: 'Dr. Sanjay Mishra is an AIIMS-trained psychiatrist with special interest in disaster mental health and post-conflict PTSD. He has worked with Bhopal gas tragedy survivors over the last decade.',
    availability: 'Mon–Fri, 9:00 AM – 1:00 PM (OPD)',
    modes: ['In-person'],
    emergency: true,
    avatarInitials: 'SM',
    avatarColor: '#415a77',
  },
  {
    id: 'bho-002',
    name: 'Dr. Kavya Shukla',
    specialty: 'Therapist',
    address: 'Bansal Hospital, Shahpura, Bhopal',
    hospital: 'Bansal Hospital',
    city: 'Bhopal',
    rating: 4.5,
    education: 'MSc Psychology – Barkatullah University',
    experience: '6 years',
    languages: ['Hindi', 'English'],
    fees: '₹600',
    phone: '+91 97131 03900',
    profileLink: 'https://www.bansalhospital.com',
    about: 'Dr. Kavya Shukla is a therapist who uses art therapy and drama therapy techniques alongside conventional talk therapy. She works with children, adolescents, and adults in individual and group settings.',
    availability: 'Mon–Sat, 11:00 AM – 7:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'KS',
    avatarColor: '#d4a5a5',
  },

  // ── INDORE ─────────────────────────────────
  {
    id: 'ind-001',
    name: 'Dr. Mihir Rathi',
    specialty: 'Psychiatrist',
    address: 'Bombay Hospital, South Tukoganj, Indore',
    hospital: 'Bombay Hospital Indore',
    city: 'Indore',
    rating: 4.7,
    education: 'MD Psychiatry – MGM Medical College Indore',
    experience: '13 years',
    languages: ['Hindi', 'Marathi', 'English'],
    fees: '₹800',
    phone: '+91 99262 14011',
    profileLink: 'https://www.bombay-hospital.com/indore',
    about: 'Dr. Mihir Rathi is a psychiatrist known for his warm consultation style and evidence-based approach to mood disorders and anxiety. He actively engages with Indore\'s business community on executive mental wellness.',
    availability: 'Mon–Sat, 10:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'MR',
    avatarColor: '#5c4033',
  },
  {
    id: 'ind-002',
    name: 'Dr. Seema Gupta',
    specialty: 'Psychologist',
    address: 'Kokilaben Hospital, Vijay Nagar, Indore',
    hospital: 'Kokilaben Hospital Indore',
    city: 'Indore',
    rating: 4.6,
    education: 'M.Phil Clinical Psychology – DAVV Indore',
    experience: '9 years',
    languages: ['Hindi', 'English'],
    fees: '₹750',
    phone: '+91 96001 25122',
    profileLink: 'https://www.practo.com/indore/psychologist',
    about: 'Dr. Seema Gupta specializes in behavioral interventions for children with developmental disorders and conducts psycho-educational assessments. She is a trained play therapist with expertise in non-verbal children.',
    availability: 'Mon–Fri, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'SG',
    avatarColor: '#95d5b2',
  },

  // ── VISAKHAPATNAM ──────────────────────────
  {
    id: 'viz-001',
    name: 'Dr. Rama Prasad',
    specialty: 'Psychiatrist',
    address: 'Apollo Hospital, Waltair Main Road, Visakhapatnam',
    hospital: 'Apollo Hospital Visakhapatnam',
    city: 'Visakhapatnam',
    rating: 4.7,
    education: 'MD Psychiatry – Andhra Medical College',
    experience: '15 years',
    languages: ['Telugu', 'Hindi', 'English'],
    fees: '₹1,000',
    phone: '+91 98484 36233',
    profileLink: 'https://www.apollohospitals.com/vizag',
    about: 'Dr. Rama Prasad is a senior psychiatrist at Apollo Vizag with expertise in neuropsychiatry and epilepsy-related psychiatric disorders. He is also skilled in occupational psychiatry and industrial wellness.',
    availability: 'Mon–Sat, 9:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: true,
    avatarInitials: 'RP',
    avatarColor: '#023e8a',
  },
  {
    id: 'viz-002',
    name: 'Dr. Deepika Ganti',
    specialty: 'Counselor',
    address: 'CARE Hospital, Ramnagar, Visakhapatnam',
    hospital: 'CARE Hospital',
    city: 'Visakhapatnam',
    rating: 4.5,
    education: 'MA Psychology – Andhra University',
    experience: '7 years',
    languages: ['Telugu', 'English'],
    fees: '₹550',
    phone: '+91 96524 47344',
    profileLink: 'https://www.carehospitals.com/visakhapatnam',
    about: 'Dr. Deepika Ganti provides accessible mental health counseling in Vizag with a focus on coastal fishing community mental health, disaster preparedness counseling, and women\'s wellness.',
    availability: 'Mon–Sat, 10:00 AM – 6:00 PM',
    modes: ['In-person', 'Phone Consultation'],
    emergency: false,
    avatarInitials: 'DG',
    avatarColor: '#48cae4',
  },

  // ── COIMBATORE ─────────────────────────────
  {
    id: 'cbe-001',
    name: 'Dr. Balaji Krishnan',
    specialty: 'Psychiatrist',
    address: 'PSG Hospitals, Peelamedu, Coimbatore',
    hospital: 'PSG Hospitals',
    city: 'Coimbatore',
    rating: 4.7,
    education: 'MD Psychiatry – PSG Medical College',
    experience: '14 years',
    languages: ['Tamil', 'English'],
    fees: '₹900',
    phone: '+91 97908 58455',
    profileLink: 'https://www.psghospitals.com',
    about: 'Dr. Balaji Krishnan is a psychiatrist in Coimbatore known for his integrative approach combining medication and lifestyle modifications. He is a pioneer in digital mental health solutions for rural Tamil Nadu.',
    availability: 'Mon–Sat, 9:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: true,
    avatarInitials: 'BK',
    avatarColor: '#0d3b66',
  },
  {
    id: 'cbe-002',
    name: 'Dr. Geetha Ramaswamy',
    specialty: 'Therapist',
    address: 'KG Hospital, Arts College Road, Coimbatore',
    hospital: 'KG Hospital',
    city: 'Coimbatore',
    rating: 4.5,
    education: 'MSc Psychology – Bharathiar University',
    experience: '8 years',
    languages: ['Tamil', 'Malayalam', 'English'],
    fees: '₹700',
    phone: '+91 90920 69566',
    profileLink: 'https://www.kghospital.com',
    about: 'Dr. Geetha Ramaswamy is a therapist with a calming presence and a person-centered approach. She works extensively with menopausal mental health, chronic pain psychology, and body-mind wellness.',
    availability: 'Mon–Sat, 10:00 AM – 7:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: false,
    avatarInitials: 'GR',
    avatarColor: '#70c1b3',
  },

  // ── SURAT ──────────────────────────────────
  {
    id: 'sur-001',
    name: 'Dr. Chirag Desai',
    specialty: 'Psychiatrist',
    address: 'Kiran Hospital, Majura Gate, Surat',
    hospital: 'Kiran Hospital',
    city: 'Surat',
    rating: 4.6,
    education: 'MD Psychiatry – SMIMER Surat',
    experience: '11 years',
    languages: ['Gujarati', 'Hindi', 'English'],
    fees: '₹850',
    phone: '+91 98245 70677',
    profileLink: 'https://www.kiranhospital.com',
    about: 'Dr. Chirag Desai is a respected psychiatrist in Surat offering modern psychiatric care. He has introduced tele-psychiatry services to reach patients across South Gujarat and Saurashtra.',
    availability: 'Mon–Sat, 10:00 AM – 5:00 PM',
    modes: ['In-person', 'Video Consultation'],
    emergency: true,
    avatarInitials: 'CD',
    avatarColor: '#e9c46a',
  },
];

// ─────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────
type SortKey = 'experience' | 'rating' | 'fees';

function parseFees(fees: string): number {
  return parseInt(fees.replace(/[^0-9]/g, ''), 10) || 0;
}

function parseExperience(exp: string): number {
  return parseInt(exp, 10) || 0;
}

function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/^dr\.\s+/, 'dr-').replace(/\s+/g, '-');
}

// ─────────────────────────────────────────────
// Desktop Phone Modal
// ─────────────────────────────────────────────
interface PhoneModalProps {
  doctor: Doctor;
  onClose: () => void;
}

const PhoneModal: React.FC<PhoneModalProps> = ({ doctor, onClose }) => {
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(doctor.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={backdropRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 25 }}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: doctor.avatarColor || '#4f7cac' }}
                >
                  {doctor.avatarInitials}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{doctor.name}</p>
                  <p className="text-sm text-gray-500">{doctor.specialty}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Phone size={18} className="text-primary-600" />
              <span className="text-sm font-medium text-gray-600">Phone Number</span>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between mb-4 border border-gray-200">
              <span className="text-lg font-semibold text-gray-900 tracking-wide">{doctor.phone}</span>
              <button
                onClick={handleCopy}
                className="ml-3 flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{
                  backgroundColor: copied ? '#dcfce7' : '#eff6ff',
                  color: copied ? '#16a34a' : '#2563eb',
                }}
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

          {/* Footer */}
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────
// Doctor Profile Page (in-app)
// ─────────────────────────────────────────────
interface DoctorProfilePageProps {
  doctor: Doctor;
  onBack: () => void;
}

const consultationModeIcon = (mode: string) => {
  if (mode.includes('Video')) return '🎥';
  if (mode.includes('Phone')) return '📞';
  if (mode.includes('Chat')) return '💬';
  return '🏥';
};

const DoctorProfilePage: React.FC<DoctorProfilePageProps> = ({ doctor, onBack }) => {
  const [phoneModal, setPhoneModal] = useState(false);
  const [bookingState, setBookingState] = useState<'idle' | 'selecting' | 'confirmed'>('idle');
  const [selectedSlot, setSelectedSlot] = useState('');

  const handleCall = () => {
    if (isMobile()) {
      window.location.href = `tel:${doctor.phone.replace(/[^0-9+]/g, '')}`;
    } else {
      setPhoneModal(true);
    }
  };

  const slots = [
    'Tomorrow, 10:00 AM', 'Tomorrow, 11:30 AM', 'Tomorrow, 3:00 PM',
    'Day after, 9:30 AM', 'Day after, 2:00 PM', 'Day after, 5:30 PM',
  ];

  const specialtyColor: Record<string, string> = {
    Psychiatrist: '#e84855',
    Psychologist: '#3a86ff',
    Therapist: '#9b5de5',
    Counselor: '#06a77d',
  };
  const badgeColor = specialtyColor[doctor.specialty] || '#4f7cac';

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back navigation */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary-600 font-medium hover:text-primary-800 transition-colors group"
        >
          <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
          Back to Find Help
        </button>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6">
        {/* Colored top strip */}
        <div className="h-2" style={{ backgroundColor: badgeColor }} />

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center text-white font-bold text-3xl md:text-4xl flex-shrink-0 shadow-md"
              style={{ backgroundColor: doctor.avatarColor || badgeColor }}
            >
              {doctor.avatarInitials}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{doctor.name}</h1>
                {doctor.emergency && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{ backgroundColor: '#e84855' }}>
                    Emergency Available
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-sm font-semibold px-3 py-1 rounded-full text-white" style={{ backgroundColor: badgeColor }}>
                  {doctor.specialty}
                </span>
                <span className="text-gray-500 text-sm">{doctor.hospital}</span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star size={15} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{doctor.rating.toFixed(1)}</span>
                  <span className="text-gray-400">rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={15} className="text-gray-400" />
                  <span>{doctor.experience} experience</span>
                </div>
                <div className="flex items-center gap-1">
                  <IndianRupee size={15} className="text-gray-400" />
                  <span>{doctor.fees} per session</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Details */}
        <div className="md:col-span-2 space-y-6">
          {/* About */}
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
            <p className="text-gray-600 leading-relaxed">{doctor.about}</p>
          </div>

          {/* Details grid */}
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Clinic Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Address</p>
                  <p className="text-gray-700">{doctor.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Education</p>
                  <p className="text-gray-700">{doctor.education}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Languages size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Languages</p>
                  <p className="text-gray-700">{doctor.languages.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Availability</p>
                  <p className="text-gray-700">{doctor.availability}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Consultation modes */}
          {doctor.modes && (
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Consultation Modes</h2>
              <div className="flex flex-wrap gap-3">
                {doctor.modes.map((mode) => (
                  <div
                    key={mode}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium"
                  >
                    <span>{consultationModeIcon(mode)}</span>
                    {mode}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Actions + Booking */}
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contact</h2>
            <div className="space-y-3">
              <button
                onClick={handleCall}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#22c55e' }}
              >
                <Phone size={18} />
                Call Now
              </button>

              <a
                href={doctor.profileLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={18} />
                View Hospital / Profile
              </a>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone size={14} className="text-gray-400" />
                <span className="font-medium text-gray-700">{doctor.phone}</span>
              </div>
            </div>
          </div>

          {/* Book consultation */}
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Book Consultation</h2>
            <p className="text-sm text-gray-500 mb-4">Select a convenient slot</p>

            {bookingState === 'idle' && (
              <button
                onClick={() => setBookingState('selecting')}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#4f7cac' }}
              >
                <Stethoscope size={16} className="inline mr-2" />
                Check Availability
              </button>
            )}

            {bookingState === 'selecting' && (
              <div className="space-y-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setBookingState('confirmed');
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-primary-400 hover:bg-primary-50 transition-all"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}

            {bookingState === 'confirmed' && (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Check size={28} className="text-green-600" />
                </div>
                <p className="font-bold text-gray-900 mb-1">Appointment Requested!</p>
                <p className="text-sm text-gray-500 mb-1">{selectedSlot}</p>
                <p className="text-xs text-gray-400">You will receive a confirmation call from the clinic within 2 hours.</p>
                <button
                  onClick={() => { setBookingState('idle'); setSelectedSlot(''); }}
                  className="mt-4 text-sm text-primary-600 hover:underline"
                >
                  Book another slot
                </button>
              </motion.div>
            )}
          </div>

          {/* Emergency badge */}
          {doctor.emergency && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-xl">🚨</span>
              <div>
                <p className="text-sm font-semibold text-red-800 mb-1">Emergency Support Available</p>
                <p className="text-xs text-red-600">This doctor's hospital has 24/7 psychiatric emergency services.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {phoneModal && (
        <PhoneModal doctor={doctor} onClose={() => setPhoneModal(false)} />
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// Main FindHelpPage
// ─────────────────────────────────────────────
const FindHelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [phoneModalDoctor, setPhoneModalDoctor] = useState<Doctor | null>(null);
  const [profileDoctor, setProfileDoctor] = useState<Doctor | null>(null);

  const specialties = [
    { value: 'all', label: 'All Specialties' },
    { value: 'Psychiatrist', label: 'Psychiatrist' },
    { value: 'Psychologist', label: 'Psychologist' },
    { value: 'Therapist', label: 'Therapist' },
    { value: 'Counselor', label: 'Counselor' },
  ];

  const cities = [
    'Ahmedabad', 'Bangalore', 'Bhopal', 'Chandigarh', 'Chennai',
    'Coimbatore', 'Delhi', 'Hyderabad', 'Indore', 'Jaipur',
    'Kochi', 'Kolkata', 'Lucknow', 'Mumbai', 'Nagpur',
    'Pune', 'Surat', 'Visakhapatnam',
  ];

  const handleCall = (doctor: Doctor) => {
    if (isMobile()) {
      window.location.href = `tel:${doctor.phone.replace(/[^0-9+]/g, '')}`;
    } else {
      setPhoneModalDoctor(doctor);
    }
  };

  const handleBookNow = (doctor: Doctor) => {
    setProfileDoctor(doctor);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = ALL_DOCTORS.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      d.address.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q);
    const matchesSpecialty = specialty === 'all' || d.specialty === specialty;
    const matchesLocation = !location || d.city === location;
    return matchesSearch && matchesSpecialty && matchesLocation;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'experience') return parseExperience(b.experience) - parseExperience(a.experience);
    if (sortBy === 'fees') return parseFees(a.fees) - parseFees(b.fees);
    return 0;
  });

  const specialtyColor: Record<string, string> = {
    Psychiatrist: '#fee2e2',
    Psychologist: '#dbeafe',
    Therapist: '#f3e8ff',
    Counselor: '#dcfce7',
  };
  const specialtyTextColor: Record<string, string> = {
    Psychiatrist: '#b91c1c',
    Psychologist: '#1d4ed8',
    Therapist: '#7c3aed',
    Counselor: '#15803d',
  };

  // ── If viewing a profile, render that page ──
  if (profileDoctor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DoctorProfilePage
          doctor={profileDoctor}
          onBack={() => setProfileDoctor(null)}
        />
      </div>
    );
  }

  // ── Main listing page ──
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Find Mental Health Professionals in India</h1>
        <p className="text-gray-600">
          Connect with qualified mental health providers across major Indian cities who can provide the support you need.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, specialty, or city"
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="md:hidden btn-outline flex items-center justify-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} className="mr-2" />
            Filters
          </button>

          <div className="hidden md:flex gap-4">
            <div className="w-48">
              <select className="input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                {specialties.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="w-48">
              <select className="input" value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">All Cities</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {showFilters && (
          <motion.div
            className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div>
              <label className="label">Specialty</label>
              <select className="input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                {specialties.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">City</label>
              <select className="input" value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">All Cities</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results header */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {sorted.length} Provider{sorted.length !== 1 ? 's' : ''} Found
        </h2>
        <div className="flex items-center text-sm text-gray-500">
          <Sliders size={16} className="mr-2" />
          <span className="mr-2">Sort by:</span>
          <select
            className="border-none bg-transparent font-medium text-gray-700 focus:outline-none focus:ring-0"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
          >
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
          <h3 className="text-xl font-semibold mb-2">No providers found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search filters or location to find more providers.</p>
          <button
            className="btn-primary"
            onClick={() => { setSearchQuery(''); setSpecialty('all'); setLocation(''); }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sorted.map((doctor) => (
            <motion.div
              key={doctor.id}
              className="bg-white rounded-xl shadow-soft overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="p-6">
                {/* Name + rating */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: doctor.avatarColor || '#4f7cac' }}
                    >
                      {doctor.avatarInitials}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold leading-tight">{doctor.name}</h3>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: specialtyColor[doctor.specialty] || '#f3f4f6',
                          color: specialtyTextColor[doctor.specialty] || '#374151',
                        }}
                      >
                        {doctor.specialty}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center bg-amber-50 text-amber-700 px-2 py-1 rounded-lg flex-shrink-0">
                    <Star size={14} className="text-amber-400 fill-amber-400 mr-1" />
                    <span className="text-sm font-semibold">{doctor.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-start">
                    <MapPin size={15} className="text-gray-400 mr-2 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-600">{doctor.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={15} className="text-gray-400 mr-2 shrink-0" />
                    <span className="text-sm text-gray-600">{doctor.experience} experience</span>
                  </div>
                  <div className="flex items-center">
                    <Languages size={15} className="text-gray-400 mr-2 shrink-0" />
                    <span className="text-sm text-gray-600">{doctor.languages.join(', ')}</span>
                  </div>
                  <div className="flex items-center">
                    <IndianRupee size={15} className="text-gray-400 mr-2 shrink-0" />
                    <span className="text-sm text-gray-600">Consultation: {doctor.fees}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCall(doctor)}
                    className="btn-outline flex-1 flex justify-center items-center gap-1.5 text-sm"
                  >
                    <Phone size={15} />
                    Call
                  </button>

                  <button
                    onClick={() => handleBookNow(doctor)}
                    className="btn-primary flex-1 flex justify-center items-center gap-1.5 text-sm"
                  >
                    Book Now
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              {/* Footer strip */}
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Available for new patients
                </span>
                <button
                  onClick={() => handleBookNow(doctor)}
                  className="text-primary-600 text-sm font-medium flex items-center hover:text-primary-800 transition-colors"
                >
                  View Profile
                  <ChevronRight size={14} className="ml-0.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Crisis Support */}
      <div className="mt-12 bg-primary-50 border border-primary-100 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Need Immediate Support?</h3>
        <p className="text-gray-700 mb-4">
          If you're experiencing a mental health crisis or need immediate support, help is available 24/7:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-primary-100">
            <h4 className="font-semibold mb-2">NIMHANS Crisis Helpline</h4>
            <p className="text-gray-600 mb-2">Call 080-46110007 for professional mental health support.</p>
            <a href="tel:08046110007" className="text-primary-600 font-medium flex items-center">
              <Phone size={16} className="mr-1" /> Call Helpline
            </a>
          </div>
          <div className="bg-white rounded-lg p-4 border border-primary-100">
            <h4 className="font-semibold mb-2">iCall Helpline</h4>
            <p className="text-gray-600 mb-2">Call 9152987821 for counseling support.</p>
            <a href="tel:9152987821" className="text-primary-600 font-medium flex items-center">
              <Phone size={16} className="mr-1" /> Call iCall
            </a>
          </div>
        </div>
      </div>

      {/* Desktop phone modal */}
      {phoneModalDoctor && (
        <PhoneModal doctor={phoneModalDoctor} onClose={() => setPhoneModalDoctor(null)} />
      )}
    </div>
  );
};

export default FindHelpPage;
