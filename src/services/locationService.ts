// This is a mock service for demonstration
// In a real app, this would use the browser's geolocation API
// and connect to a real healthcare provider API

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  rating: number;
  distance: number;
  languages: string[];
  education: string;
  experience: string;
  fees: string;
}

// Mock function to get user's location
export const getUserLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    } else {
      reject(new Error('Geolocation is not supported by this browser.'));
    }
  });
};

// Mock function to get nearby mental health professionals
export const getNearbyDoctors = async (
  specialty: string = 'all'
): Promise<Doctor[]> => {
  // In a real app, this would make an API call to a healthcare provider database
  // using the user's location to find nearby professionals
  
  // For demo purposes, return mock data
  const mockDoctors: Doctor[] = [
    {
      id: '1',
      name: 'Dr. Priya Sharma',
      specialty: 'Psychiatrist',
      address: 'Fortis Hospital, Bannerghatta Road, Bangalore 560076',
      phone: '+91 80 2222 1111',
      rating: 4.8,
      distance: 1.2,
      languages: ['English', 'Hindi', 'Kannada'],
      education: 'MBBS, MD Psychiatry - AIIMS Delhi',
      experience: '15 years',
      fees: '₹1500'
    },
    {
      id: '2',
      name: 'Dr. Rajesh Kumar',
      specialty: 'Psychologist',
      address: 'Apollo Hospitals, Greams Road, Chennai 600006',
      phone: '+91 44 2829 3333',
      rating: 4.9,
      distance: 2.5,
      languages: ['English', 'Tamil', 'Hindi'],
      education: 'PhD Clinical Psychology - NIMHANS',
      experience: '12 years',
      fees: '₹1200'
    },
    {
      id: '3',
      name: 'Dr. Anjali Desai',
      specialty: 'Therapist',
      address: 'Max Healthcare, Saket, New Delhi 110017',
      phone: '+91 11 2651 5555',
      rating: 4.7,
      distance: 3.1,
      languages: ['English', 'Hindi', 'Gujarati'],
      education: 'MA Clinical Psychology - Delhi University',
      experience: '10 years',
      fees: '₹1000'
    },
    {
      id: '4',
      name: 'Dr. Sanjay Mehta',
      specialty: 'Psychiatrist',
      address: 'Kokilaben Hospital, Mumbai 400053',
      phone: '+91 22 4269 6969',
      rating: 4.9,
      distance: 4.2,
      languages: ['English', 'Hindi', 'Marathi'],
      education: 'MBBS, DPM - KEM Hospital',
      experience: '18 years',
      fees: '₹2000'
    },
    {
      id: '5',
      name: 'Dr. Meera Reddy',
      specialty: 'Counselor',
      address: 'Care Hospitals, Banjara Hills, Hyderabad 500034',
      phone: '+91 40 2322 4444',
      rating: 4.6,
      distance: 2.8,
      languages: ['English', 'Telugu', 'Hindi'],
      education: 'MSc Psychology - Osmania University',
      experience: '8 years',
      fees: '₹800'
    }
  ];

  // Filter by specialty if specified
  if (specialty !== 'all') {
    return mockDoctors.filter(
      (doctor) => doctor.specialty.toLowerCase() === specialty.toLowerCase()
    );
  }

  return mockDoctors;
};

// Get doctor details by ID
export const getDoctorDetails = async (id: string): Promise<Doctor | null> => {
  const doctors = await getNearbyDoctors();
  return doctors.find((doctor) => doctor.id === id) || null;
};