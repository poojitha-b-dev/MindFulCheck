// Assessment PHQ-9 and GAD-7 Backend Server
// This server handles mental health assessments, scoring, and clinical recommendations

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const assessmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 assessment requests per windowMs
  message: 'Too many assessment requests, please try again later.'
});

app.use('/assessments', assessmentLimiter);

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mental-health-assessment-new-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// PHQ-9 Depression Assessment Questions
const PHQ9_QUESTIONS = [
  {
    id: 'phq9_1',
    text: 'Little interest or pleasure in doing things',
    category: 'anhedonia',
    weight: 1.0
  },
  {
    id: 'phq9_2',
    text: 'Feeling down, depressed, or hopeless',
    category: 'mood',
    weight: 1.0
  },
  {
    id: 'phq9_3',
    text: 'Trouble falling or staying asleep, or sleeping too much',
    category: 'sleep',
    weight: 0.8
  },
  {
    id: 'phq9_4',
    text: 'Feeling tired or having little energy',
    category: 'energy',
    weight: 0.8
  },
  {
    id: 'phq9_5',
    text: 'Poor appetite or overeating',
    category: 'appetite',
    weight: 0.7
  },
  {
    id: 'phq9_6',
    text: 'Feeling bad about yourself or that you are a failure or have let yourself or your family down',
    category: 'self_worth',
    weight: 0.9
  },
  {
    id: 'phq9_7',
    text: 'Trouble concentrating on things, such as reading the newspaper or watching television',
    category: 'concentration',
    weight: 0.8
  },
  {
    id: 'phq9_8',
    text: 'Moving or speaking so slowly that other people could have noticed, or the opposite - being so fidgety or restless that you have been moving around a lot more than usual',
    category: 'psychomotor',
    weight: 0.7
  },
  {
    id: 'phq9_9',
    text: 'Thoughts that you would be better off dead, or of hurting yourself in some way',
    category: 'suicidal_ideation',
    weight: 1.2
  }
];

// GAD-7 Anxiety Assessment Questions
const GAD7_QUESTIONS = [
  {
    id: 'gad7_1',
    text: 'Feeling nervous, anxious, or on edge',
    category: 'general_anxiety',
    weight: 1.0
  },
  {
    id: 'gad7_2',
    text: 'Not being able to stop or control worrying',
    category: 'worry_control',
    weight: 1.0
  },
  {
    id: 'gad7_3',
    text: 'Worrying too much about different things',
    category: 'excessive_worry',
    weight: 0.9
  },
  {
    id: 'gad7_4',
    text: 'Trouble relaxing',
    category: 'tension',
    weight: 0.8
  },
  {
    id: 'gad7_5',
    text: 'Being so restless that it is hard to sit still',
    category: 'restlessness',
    weight: 0.7
  },
  {
    id: 'gad7_6',
    text: 'Becoming easily annoyed or irritable',
    category: 'irritability',
    weight: 0.7
  },
  {
    id: 'gad7_7',
    text: 'Feeling afraid, as if something awful might happen',
    category: 'catastrophic_thinking',
    weight: 0.9
  }
];

// Response options for both assessments
const RESPONSE_OPTIONS = [
  { value: 0, label: 'Not at all', description: 'This has not bothered me at all' },
  { value: 1, label: 'Several days', description: 'This has bothered me for several days' },
  { value: 2, label: 'More than half the days', description: 'This has bothered me more than half the days' },
  { value: 3, label: 'Nearly every day', description: 'This has bothered me nearly every day' }
];

// Get PHQ-9 Assessment
app.get('/assessments/phq9', (req, res) => {
  res.json({
    title: 'Patient Health Questionnaire-9 (PHQ-9)',
    description: 'A 9-question instrument for screening, diagnosing, monitoring and measuring the severity of depression.',
    instructions: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    questions: PHQ9_QUESTIONS.map(q => ({
      id: q.id,
      text: q.text,
      options: RESPONSE_OPTIONS
    })),
    timeframe: '2 weeks',
    maxScore: 27,
    scoringInfo: {
      minimal: { range: '0-4', description: 'Minimal depression' },
      mild: { range: '5-9', description: 'Mild depression' },
      moderate: { range: '10-14', description: 'Moderate depression' },
      moderatelySevere: { range: '15-19', description: 'Moderately severe depression' },
      severe: { range: '20-27', description: 'Severe depression' }
    }
  });
});

// Get GAD-7 Assessment
app.get('/assessments/gad7', (req, res) => {
  res.json({
    title: 'Generalized Anxiety Disorder 7-item (GAD-7)',
    description: 'A 7-question instrument for screening and measuring the severity of generalized anxiety disorder.',
    instructions: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    questions: GAD7_QUESTIONS.map(q => ({
      id: q.id,
      text: q.text,
      options: RESPONSE_OPTIONS
    })),
    timeframe: '2 weeks',
    maxScore: 21,
    scoringInfo: {
      minimal: { range: '0-4', description: 'Minimal anxiety' },
      mild: { range: '5-9', description: 'Mild anxiety' },
      moderate: { range: '10-14', description: 'Moderate anxiety' },
      severe: { range: '15-21', description: 'Severe anxiety' }
    }
  });
});

// Submit PHQ-9 Assessment
app.post('/assessments/phq9/submit', verifyToken, async (req, res) => {
  try {
    const { answers, demographics } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length !== 9) {
      return res.status(400).json({ error: 'Invalid answers format. Expected array of 9 responses.' });
    }

    // Validate answer values
    const invalidAnswers = answers.filter(answer => 
      typeof answer !== 'number' || answer < 0 || answer > 3
    );

    if (invalidAnswers.length > 0) {
      return res.status(400).json({ error: 'Invalid answer values. Each answer must be 0-3.' });
    }

    const result = calculatePHQ9Score(answers, demographics);
    
    // Save assessment to database
    const assessmentData = {
      uid: req.user.uid,
      type: 'PHQ-9',
      answers,
      score: result.totalScore,
      severity: result.severity,
      riskLevel: result.riskLevel,
      recommendations: result.recommendations,
      clinicalNotes: result.clinicalNotes,
      demographics: demographics || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      version: '1.0'
    };

    const docRef = await db.collection('phq9_assessments').add(assessmentData);

    // Update user's assessment history
    await db.collection('users').doc(req.user.uid).update({
      lastPHQ9Assessment: {
        id: docRef.id,
        score: result.totalScore,
        severity: result.severity,
        date: new Date()
      },
      assessmentHistory: admin.firestore.FieldValue.arrayUnion({
        type: 'PHQ-9',
        id: docRef.id,
        score: result.totalScore,
        severity: result.severity,
        date: new Date()
      })
    });

    res.status(201).json({
      assessmentId: docRef.id,
      ...result
    });

  } catch (error) {
    console.error('PHQ-9 submission error:', error);
    res.status(500).json({ error: 'Failed to process PHQ-9 assessment' });
  }
});

// Submit GAD-7 Assessment
app.post('/assessments/gad7/submit', verifyToken, async (req, res) => {
  try {
    const { answers, demographics } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length !== 7) {
      return res.status(400).json({ error: 'Invalid answers format. Expected array of 7 responses.' });
    }

    // Validate answer values
    const invalidAnswers = answers.filter(answer => 
      typeof answer !== 'number' || answer < 0 || answer > 3
    );

    if (invalidAnswers.length > 0) {
      return res.status(400).json({ error: 'Invalid answer values. Each answer must be 0-3.' });
    }

    const result = calculateGAD7Score(answers, demographics);
    
    // Save assessment to database
    const assessmentData = {
      uid: req.user.uid,
      type: 'GAD-7',
      answers,
      score: result.totalScore,
      severity: result.severity,
      riskLevel: result.riskLevel,
      recommendations: result.recommendations,
      clinicalNotes: result.clinicalNotes,
      demographics: demographics || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      version: '1.0'
    };

    const docRef = await db.collection('gad7_assessments').add(assessmentData);

    // Update user's assessment history
    await db.collection('users').doc(req.user.uid).update({
      lastGAD7Assessment: {
        id: docRef.id,
        score: result.totalScore,
        severity: result.severity,
        date: new Date()
      },
      assessmentHistory: admin.firestore.FieldValue.arrayUnion({
        type: 'GAD-7',
        id: docRef.id,
        score: result.totalScore,
        severity: result.severity,
        date: new Date()
      })
    });

    res.status(201).json({
      assessmentId: docRef.id,
      ...result
    });

  } catch (error) {
    console.error('GAD-7 submission error:', error);
    res.status(500).json({ error: 'Failed to process GAD-7 assessment' });
  }
});

// Get Assessment History
app.get('/assessments/history', verifyToken, async (req, res) => {
  try {
    const { type, limit = 10, offset = 0 } = req.query;
    const uid = req.user.uid;

    let query = db.collectionGroup('phq9_assessments')
      .where('uid', '==', uid);

    if (type === 'GAD-7') {
      query = db.collectionGroup('gad7_assessments')
        .where('uid', '==', uid);
    } else if (type === 'PHQ-9') {
      query = db.collectionGroup('phq9_assessments')
        .where('uid', '==', uid);
    }

    const assessments = await query
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const assessmentData = assessments.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));

    res.json({ assessments: assessmentData });
  } catch (error) {
    console.error('Assessment history error:', error);
    res.status(500).json({ error: 'Failed to fetch assessment history' });
  }
});

// Get Specific Assessment
app.get('/assessments/:type/:id', verifyToken, async (req, res) => {
  try {
    const { type, id } = req.params;
    const uid = req.user.uid;

    let collection = 'phq9_assessments';
    if (type.toUpperCase() === 'GAD-7') {
      collection = 'gad7_assessments';
    }

    const doc = await db.collection(collection).doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const data = doc.data();
    if (data.uid !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate()
    });
  } catch (error) {
    console.error('Assessment fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// Assessment Analytics
app.get('/assessments/analytics', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { timeframe = '6months' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 6);
    }

    // Fetch PHQ-9 assessments
    const phq9Query = await db.collection('phq9_assessments')
      .where('uid', '==', uid)
      .where('timestamp', '>=', startDate)
      .orderBy('timestamp', 'asc')
      .get();

    // Fetch GAD-7 assessments
    const gad7Query = await db.collection('gad7_assessments')
      .where('uid', '==', uid)
      .where('timestamp', '>=', startDate)
      .orderBy('timestamp', 'asc')
      .get();

    const phq9Data = phq9Query.docs.map(doc => ({
      date: doc.data().timestamp.toDate(),
      score: doc.data().score,
      severity: doc.data().severity
    }));

    const gad7Data = gad7Query.docs.map(doc => ({
      date: doc.data().timestamp.toDate(),
      score: doc.data().score,
      severity: doc.data().severity
    }));

    // Calculate trends
    const analytics = {
      phq9: {
        assessments: phq9Data,
        trend: calculateTrend(phq9Data),
        averageScore: calculateAverage(phq9Data),
        latestSeverity: phq9Data.length > 0 ? phq9Data[phq9Data.length - 1].severity : null
      },
      gad7: {
        assessments: gad7Data,
        trend: calculateTrend(gad7Data),
        averageScore: calculateAverage(gad7Data),
        latestSeverity: gad7Data.length > 0 ? gad7Data[gad7Data.length - 1].severity : null
      },
      timeframe,
      totalAssessments: phq9Data.length + gad7Data.length
    };

    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// Helper Functions

function calculatePHQ9Score(answers, demographics = {}) {
  const totalScore = answers.reduce((sum, answer) => sum + answer, 0);
  
  // Determine severity based on PHQ-9 scoring
  let severity, riskLevel, color;
  if (totalScore <= 4) {
    severity = 'minimal';
    riskLevel = 'low';
    color = '#4caf50';
  } else if (totalScore <= 9) {
    severity = 'mild';
    riskLevel = 'low-moderate';
    color = '#8bc34a';
  } else if (totalScore <= 14) {
    severity = 'moderate';
    riskLevel = 'moderate';
    color = '#ff9800';
  } else if (totalScore <= 19) {
    severity = 'moderately severe';
    riskLevel = 'moderate-high';
    color = '#ff5722';
  } else {
    severity = 'severe';
    riskLevel = 'high';
    color = '#f44336';
  }

  // Check for suicidal ideation (question 9)
  const suicidalIdeation = answers[8] > 0;
  if (suicidalIdeation) {
    riskLevel = 'high';
  }

  // Generate recommendations
  const recommendations = generatePHQ9Recommendations(totalScore, severity, suicidalIdeation, demographics);
  
  // Generate clinical notes
  const clinicalNotes = generatePHQ9ClinicalNotes(answers, totalScore, severity, demographics);

  return {
    totalScore,
    severity,
    riskLevel,
    color,
    suicidalIdeation,
    recommendations,
    clinicalNotes,
    interpretation: getPHQ9Interpretation(totalScore, severity),
    nextSteps: getPHQ9NextSteps(severity, suicidalIdeation)
  };
}

function calculateGAD7Score(answers, demographics = {}) {
  const totalScore = answers.reduce((sum, answer) => sum + answer, 0);
  
  // Determine severity based on GAD-7 scoring
  let severity, riskLevel, color;
  if (totalScore <= 4) {
    severity = 'minimal';
    riskLevel = 'low';
    color = '#4caf50';
  } else if (totalScore <= 9) {
    severity = 'mild';
    riskLevel = 'low-moderate';
    color = '#8bc34a';
  } else if (totalScore <= 14) {
    severity = 'moderate';
    riskLevel = 'moderate';
    color = '#ff9800';
  } else {
    severity = 'severe';
    riskLevel = 'high';
    color = '#f44336';
  }

  // Generate recommendations
  const recommendations = generateGAD7Recommendations(totalScore, severity, demographics);
  
  // Generate clinical notes
  const clinicalNotes = generateGAD7ClinicalNotes(answers, totalScore, severity, demographics);

  return {
    totalScore,
    severity,
    riskLevel,
    color,
    recommendations,
    clinicalNotes,
    interpretation: getGAD7Interpretation(totalScore, severity),
    nextSteps: getGAD7NextSteps(severity)
  };
}

function generatePHQ9Recommendations(score, severity, suicidalIdeation, demographics) {
  const recommendations = [];

  if (suicidalIdeation) {
    recommendations.push({
      priority: 'urgent',
      category: 'safety',
      title: 'Immediate Safety Assessment',
      description: 'Suicidal ideation detected. Immediate professional evaluation recommended.',
      action: 'Contact mental health professional or crisis hotline immediately'
    });
  }

  switch (severity) {
    case 'minimal':
      recommendations.push({
        priority: 'low',
        category: 'prevention',
        title: 'Maintain Mental Wellness',
        description: 'Continue current positive practices and monitor mood regularly.',
        action: 'Regular self-assessment and healthy lifestyle maintenance'
      });
      break;

    case 'mild':
      recommendations.push({
        priority: 'moderate',
        category: 'self-care',
        title: 'Enhanced Self-Care',
        description: 'Implement structured self-care routines and consider counseling.',
        action: 'Establish daily routine, exercise, and consider therapy'
      });
      break;

    case 'moderate':
      recommendations.push({
        priority: 'high',
        category: 'treatment',
        title: 'Professional Treatment',
        description: 'Professional mental health treatment is recommended.',
        action: 'Schedule appointment with mental health professional'
      });
      break;

    case 'moderately severe':
    case 'severe':
      recommendations.push({
        priority: 'urgent',
        category: 'treatment',
        title: 'Immediate Professional Care',
        description: 'Immediate professional mental health care is strongly recommended.',
        action: 'Contact mental health professional within 24-48 hours'
      });
      break;
  }

  // Add lifestyle recommendations
  recommendations.push({
    priority: 'moderate',
    category: 'lifestyle',
    title: 'Lifestyle Modifications',
    description: 'Regular exercise, adequate sleep, and social support can significantly improve mood.',
    action: 'Implement daily exercise, sleep hygiene, and social activities'
  });

  return recommendations;
}

function generateGAD7Recommendations(score, severity, demographics) {
  const recommendations = [];

  switch (severity) {
    case 'minimal':
      recommendations.push({
        priority: 'low',
        category: 'prevention',
        title: 'Stress Management',
        description: 'Continue current stress management practices.',
        action: 'Maintain healthy coping strategies and regular relaxation'
      });
      break;

    case 'mild':
      recommendations.push({
        priority: 'moderate',
        category: 'self-care',
        title: 'Anxiety Management Techniques',
        description: 'Learn and practice anxiety management techniques.',
        action: 'Practice breathing exercises, mindfulness, and relaxation techniques'
      });
      break;

    case 'moderate':
      recommendations.push({
        priority: 'high',
        category: 'treatment',
        title: 'Professional Anxiety Treatment',
        description: 'Professional treatment for anxiety is recommended.',
        action: 'Consider therapy, particularly CBT for anxiety management'
      });
      break;

    case 'severe':
      recommendations.push({
        priority: 'urgent',
        category: 'treatment',
        title: 'Immediate Anxiety Treatment',
        description: 'Immediate professional treatment for severe anxiety is recommended.',
        action: 'Contact mental health professional immediately'
      });
      break;
  }

  // Add anxiety-specific recommendations
  recommendations.push({
    priority: 'moderate',
    category: 'techniques',
    title: 'Anxiety Reduction Techniques',
    description: 'Progressive muscle relaxation, deep breathing, and grounding techniques can help manage anxiety.',
    action: 'Practice daily relaxation and breathing exercises'
  });

  return recommendations;
}

function generatePHQ9ClinicalNotes(answers, totalScore, severity, demographics) {
  const notes = {
    assessment: 'PHQ-9 Depression Screening',
    score: `Total score: ${totalScore}/27 (${severity})`,
    symptoms: [],
    riskFactors: [],
    recommendations: []
  };

  // Analyze individual symptoms
  PHQ9_QUESTIONS.forEach((question, index) => {
    if (answers[index] >= 2) {
      notes.symptoms.push(`${question.category}: ${question.text} (Score: ${answers[index]})`);
    }
  });

  // Special attention to suicidal ideation
  if (answers[8] > 0) {
    notes.riskFactors.push(`Suicidal ideation present (Score: ${answers[8]})`);
  }

  // Add demographic considerations
  if (demographics.age) {
    if (demographics.age < 18) {
      notes.recommendations.push('Consider adolescent-specific treatment approaches');
    } else if (demographics.age > 65) {
      notes.recommendations.push('Consider geriatric depression considerations');
    }
  }

  return notes;
}

function generateGAD7ClinicalNotes(answers, totalScore, severity, demographics) {
  const notes = {
    assessment: 'GAD-7 Anxiety Screening',
    score: `Total score: ${totalScore}/21 (${severity})`,
    symptoms: [],
    riskFactors: [],
    recommendations: []
  };

  // Analyze individual symptoms
  GAD7_QUESTIONS.forEach((question, index) => {
    if (answers[index] >= 2) {
      notes.symptoms.push(`${question.category}: ${question.text} (Score: ${answers[index]})`);
    }
  });

  // Add demographic considerations
  if (demographics.age) {
    if (demographics.age < 18) {
      notes.recommendations.push('Consider adolescent anxiety treatment approaches');
    } else if (demographics.age > 65) {
      notes.recommendations.push('Consider late-life anxiety considerations');
    }
  }

  return notes;
}

function getPHQ9Interpretation(score, severity) {
  const interpretations = {
    minimal: 'Minimal depression symptoms. Continue monitoring and maintain healthy lifestyle practices.',
    mild: 'Mild depression symptoms present. Consider self-care strategies and monitor for changes.',
    moderate: 'Moderate depression symptoms. Professional treatment is recommended for optimal outcomes.',
    'moderately severe': 'Moderately severe depression. Professional treatment is strongly recommended.',
    severe: 'Severe depression symptoms. Immediate professional treatment is essential.'
  };

  return interpretations[severity] || 'Assessment complete. Consult with healthcare provider for interpretation.';
}

function getGAD7Interpretation(score, severity) {
  const interpretations = {
    minimal: 'Minimal anxiety symptoms. Continue current stress management practices.',
    mild: 'Mild anxiety symptoms. Consider anxiety management techniques and monitor symptoms.',
    moderate: 'Moderate anxiety symptoms. Professional treatment may be beneficial.',
    severe: 'Severe anxiety symptoms. Professional treatment is strongly recommended.'
  };

  return interpretations[severity] || 'Assessment complete. Consult with healthcare provider for interpretation.';
}

function getPHQ9NextSteps(severity, suicidalIdeation) {
  if (suicidalIdeation) {
    return [
      'Immediate safety assessment required',
      'Contact crisis hotline: 988 (Suicide & Crisis Lifeline)',
      'Do not leave person alone if actively suicidal',
      'Emergency services if immediate danger'
    ];
  }

  const nextSteps = {
    minimal: [
      'Continue regular self-monitoring',
      'Maintain healthy lifestyle practices',
      'Reassess in 2-4 weeks if symptoms change'
    ],
    mild: [
      'Implement self-care strategies',
      'Consider counseling or therapy',
      'Monitor symptoms weekly',
      'Reassess with PHQ-9 in 2-4 weeks'
    ],
    moderate: [
      'Schedule appointment with mental health professional',
      'Consider therapy (CBT recommended)',
      'Monitor symptoms closely',
      'Reassess in 1-2 weeks'
    ],
    'moderately severe': [
      'Immediate referral to mental health professional',
      'Consider medication evaluation',
      'Weekly monitoring recommended',
      'Safety planning if needed'
    ],
    severe: [
      'Urgent referral to mental health professional',
      'Consider intensive treatment options',
      'Daily monitoring of symptoms',
      'Safety planning essential'
    ]
  };

  return nextSteps[severity] || ['Consult with healthcare provider for next steps'];
}

function getGAD7NextSteps(severity) {
  const nextSteps = {
    minimal: [
      'Continue stress management practices',
      'Monitor for changes in anxiety levels',
      'Reassess if symptoms worsen'
    ],
    mild: [
      'Practice anxiety management techniques',
      'Consider stress reduction strategies',
      'Monitor symptoms weekly',
      'Reassess in 2-4 weeks'
    ],
    moderate: [
      'Consider professional anxiety treatment',
      'Learn CBT techniques for anxiety',
      'Practice relaxation techniques daily',
      'Reassess in 1-2 weeks'
    ],
    severe: [
      'Immediate professional treatment recommended',
      'Consider medication evaluation',
      'Intensive anxiety management program',
      'Weekly professional monitoring'
    ]
  };

  return nextSteps[severity] || ['Consult with healthcare provider for next steps'];
}

function calculateTrend(data) {
  if (data.length < 2) return 'insufficient_data';

  const scores = data.map(d => d.score);
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const difference = secondAvg - firstAvg;

  if (difference > 2) return 'worsening';
  if (difference < -2) return 'improving';
  return 'stable';
}

function calculateAverage(data) {
  if (data.length === 0) return 0;
  return data.reduce((sum, d) => sum + d.score, 0) / data.length;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    assessments: {
      phq9: 'available',
      gad7: 'available'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Assessment PHQ-9/GAD-7 Server running on port ${PORT}`);
});

module.exports = app;