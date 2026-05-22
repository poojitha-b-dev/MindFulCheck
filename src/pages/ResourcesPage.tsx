import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FileText,
  Video,
  Headphones,
  Search,
  ExternalLink,
  Phone,
  Heart,
  User,
  Clock,
  Share2,
  Bookmark
} from 'lucide-react';

// Resource categories
const categories = [
  { id: 'all', label: 'All Resources' },
  { id: 'articles', label: 'Articles', icon: <FileText className="h-4 w-4" /> },
  { id: 'videos', label: 'Videos', icon: <Video className="h-4 w-4" /> },
  { id: 'podcasts', label: 'Podcasts', icon: <Headphones className="h-4 w-4" /> },
  { id: 'guides', label: 'Self-Help Guides', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'emergency', label: 'Emergency Support', icon: <Phone className="h-4 w-4" /> }
];

// Resource data
const resources = [
  {
    id: 1,
    title: 'Understanding Anxiety: Causes, Symptoms and Treatment Options',
    description: 'A comprehensive guide to understanding anxiety disorders...',
    category: 'articles',
    tags: ['anxiety', 'mental health', 'treatment'],
    image: 'https://images.pexels.com/photos/3755755/pexels-photo-3755755.jpeg?auto=compress&cs=tinysrgb&w=600',
    source: 'Mental Health Foundation',
    readTime: '8 min read',
    featured: true,
    link: 'https://www.mentalhealth.org.uk/anxiety-guide'
  },
  {
    id: 2,
    title: 'Mindfulness Meditation for Beginners',
    description: 'Learn the basics of mindfulness meditation...',
    category: 'videos',
    tags: ['meditation', 'mindfulness', 'stress'],
    image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=600',
    source: 'Mindfulness Center',
    readTime: '15 min video',
    featured: true,
    link: 'https://www.youtube.com/watch?v=ZToicYcHIOU'
  },
  {
    id: 3,
    title: 'Sleep Hygiene: Improving Your Sleep Quality',
    description: 'Practical tips and strategies to improve your sleep...',
    category: 'guides',
    tags: ['sleep', 'health', 'habits'],
    image: 'https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg?auto=compress&cs=tinysrgb&w=600',
    source: 'Sleep Research Institute',
    readTime: '12 min read',
    link: 'https://www.sleepfoundation.org/sleep-hygiene'
  },
  {
    id: 4,
    title: 'The Science of Depression and Effective Treatments',
    description: 'An evidence-based overview of depression...',
    category: 'articles',
    tags: ['depression', 'treatment', 'science'],
    image: 'https://images.pexels.com/photos/5699516/pexels-photo-5699516.jpeg?auto=compress&cs=tinysrgb&w=600',
    source: 'Psychology Today',
    readTime: '10 min read',
    link: 'https://www.psychologytoday.com/depression-treatment'
  },
  {
    id: 5,
    title: 'Mental Health in the Workplace: Managing Stress and Burnout',
    description: 'Strategies for identifying and managing workplace stress...',
    category: 'podcasts',
    tags: ['work', 'stress', 'burnout'],
    image: 'https://images.pexels.com/photos/7948073/pexels-photo-7948073.jpeg?auto=compress&cs=tinysrgb&w=600',
    source: 'Workplace Wellness Podcast',
    readTime: '32 min podcast',
    link: 'https://open.spotify.com/show/mental-health-workplace'
  },
  {
    id: 6,
    title: 'Cognitive Behavioral Therapy Techniques You Can Use Today',
    description: 'Learn practical CBT techniques...',
    category: 'guides',
    tags: ['therapy', 'CBT', 'techniques'],
    image: 'https://images.pexels.com/photos/6624862/pexels-photo-6624862.jpeg?auto=compress&cs=tinysrgb&w=600',
    source: 'CBT Center',
    readTime: '15 min read',
    link: 'https://www.nhs.uk/mental-health/therapies-overview/cbt'
  },
  {
    id: 7,
    title: 'Crisis Support Hotlines and Resources',
    description: 'A comprehensive list of emergency mental health resources...',
    category: 'emergency',
    tags: ['crisis', 'emergency', 'support'],
    image: 'https://cdn.sanity.io/images/68lp9qid/production/683723515cae0753002ae39ba4972d1a7a114005-3200x1800.png',
    source: 'National Crisis Support Network',
    readTime: '5 min read',
    featured: true,
    link: 'https://www.crisistextline.org'
  },
  {
    id: 8,
    title: 'Breathing Exercises for Immediate Anxiety Relief',
    description: 'Simple breathing techniques that can help reduce anxiety...',
    category: 'videos',
    tags: ['anxiety', 'breathing', 'techniques'],
    image: 'https://images.pexels.com/photos/3759660/pexels-photo-3759660.jpeg?auto=compress&cs=tinysrgb&w=600',
    source: 'Anxiety Relief Center',
    readTime: '8 min video',
    link: 'https://www.youtube.com/watch?v=odADwWzHR24'
  }
];

const ResourcesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarkedResources, setBookmarkedResources] = useState<number[]>([]);

  const toggleBookmark = (id: number) => {
    if (bookmarkedResources.includes(id)) {
      setBookmarkedResources(bookmarkedResources.filter(resId => resId !== id));
    } else {
      setBookmarkedResources([...bookmarkedResources, id]);
    }
  };

  // Filter resources based on search query and selected category
  const filteredResources = resources.filter(resource => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get featured resources
  const featuredResources = resources.filter(resource => resource.featured);

  return (
    <div className="container mx-auto mt-24 px-4">
      <div>
        <h1 className="text-2xl font-bold text-text md:text-3xl">Mental Health Resources</h1>
        <p className="text-gray-600">
          Explore our curated collection of resources to support your mental well-being
        </p>
      </div>

      {/* Search and filters */}
      <div className="mt-8">
        <div className="mb-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon && <span className="mr-2">{category.icon}</span>}
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured resources */}
      {selectedCategory === 'all' && searchQuery === '' && (
        <div className="space-y-8">
          <h2 className="text-lg font-semibold text-text">Featured Resources</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredResources.map((resource) => (
              <motion.div
                key={resource.id}
                className="relative overflow-hidden rounded-lg border border-gray-200 shadow-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <img src={resource.image} alt={resource.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-text">{resource.title}</h3>
                  <p className="text-sm text-gray-500">{resource.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{resource.readTime}</span>
                    <a
                      href={resource.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex w-full items-center justify-center rounded-md border border-primary bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
                    >
                      View Resource
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Filtered resources */}
      <div className="space-y-8 mt-10">
        <h2 className="text-lg font-semibold text-text">Resources</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <motion.div
              key={resource.id}
              className="relative overflow-hidden rounded-lg border border-gray-200 shadow-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img src={resource.image} alt={resource.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-lg text-text">{resource.title}</h3>
                <p className="text-sm text-gray-500">{resource.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{resource.readTime}</span>
                  <a
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex w-full items-center justify-center rounded-md border border-primary bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
                  >
                    View Resource
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
