import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Brain,
  LineChart,
  MessageSquare
} from 'lucide-react';

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const features = [
    {
      icon: <Brain size={24} className="text-primary-500" />,
      title: 'Mental Health Assessment',
      description: 'Take scientifically validated assessments to understand your mental wellbeing and identify potential concerns.',
    },
    {
      icon: <LineChart size={24} className="text-primary-500" />,
      title: 'Mood & Sleep Tracking',
      description: 'Track your mood fluctuations and sleep patterns over time to identify trends and improve self-awareness.',
    },
    {
      icon: <MessageSquare size={24} className="text-primary-500" />,
      title: 'AI-Powered Chatbot',
      description: 'Get 24/7 support and guidance from our intelligent chatbot designed to provide personalized mental health resources.',
    },
    {
      icon: <Users size={24} className="text-primary-500" />,
      title: 'Professional Connection',
      description: 'Connect with licensed mental health professionals in your area based on your assessment results.',
    },
  ];

  const testimonials = [
    {
      quote: 'MindfulCheck helped me understand my anxiety patterns and find the right therapist. It\'s been life-changing.',
      author: 'Kashyap LRV',
      role: 'AI Engineer',
    },
    {
      quote: 'The mood tracking feature gave me insights into how my daily habits affect my mental health. Highly recommend!',
      author: 'Tanshi B.',
      role: 'Software Developer',
    },
    {
      quote: 'As someone who was hesitant to seek help, this platform provided a gentle first step toward addressing my depression.',
      author: 'Akshitha A.',
      role: 'Marketing Professional',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-500 to-accent-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3758105/pexels-photo-3758105.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] opacity-20 bg-cover bg-center"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              className="text-4xl md:text-5xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Welcome to MindfulCheck
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl mb-8 opacity-90"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Self-assessment tools, personalized insights, and professional guidance to support your mental health journey.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link
                to={currentUser ? "/dashboard" : "/register"}
                className="btn bg-white text-primary-600 hover:bg-gray-100"
              >
                Get Started Free
              </Link>
              <Link to="/assessment" className="btn bg-primary-600 text-white hover:bg-primary-700 border border-white">
                Take Assessment
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Comprehensive Mental Health Support</h2>
            <p className="text-gray-600 text-lg">
              Our platform combines technology and expertise to provide tools for understanding and improving your mental wellbeing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-soft p-6 h-full"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="mb-4 p-3 bg-primary-50 rounded-full inline-block">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">How MindfulCheck Works</h2>
            <p className="text-gray-600 text-lg">
              Our simple process helps you understand, track, and improve your mental health
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-5xl mx-auto">
            <motion.div
              className="flex flex-col items-center text-center max-w-xs"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Assessment</h3>
              <p className="text-gray-600">
                Take our evidence-based mental health assessments to understand your current state.
              </p>
            </motion.div>

            <div className="hidden md:block w-24 h-1 bg-gray-200 rounded-full mx-4 transform rotate-90 md:rotate-0"></div>

            <motion.div
              className="flex flex-col items-center text-center max-w-xs"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Personalized Insights</h3>
              <p className="text-gray-600">
                Receive tailored recommendations based on your assessment results.
              </p>
            </motion.div>

            <div className="hidden md:block w-24 h-1 bg-gray-200 rounded-full mx-4 transform rotate-90 md:rotate-0"></div>

            <motion.div
              className="flex flex-col items-center text-center max-w-xs"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress & Connect</h3>
              <p className="text-gray-600">
                Monitor your wellbeing over time and connect with professionals when needed.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-gray-600 text-lg">
              Hear from people who have improved their mental wellbeing with MindfulCheck
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-soft p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="mb-4 text-accent-500">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 32 32">
                    <path d="M10 8v6a6 6 0 1 1-6 6v-2a4 4 0 0 0 4-4h-4V8h6zm12 0v6a6 6 0 1 1-6 6v-2a4 4 0 0 0 4-4h-4V8h6z"></path>
                  </svg>
                </div>
                <p className="text-gray-700 mb-4">{testimonial.quote}</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-primary-600 font-semibold">
                      {testimonial.author.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
};

export default HomePage;
