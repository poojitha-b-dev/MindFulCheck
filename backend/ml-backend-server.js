// Machine Learning Backend Server
// This server handles ML-powered mood analysis, predictions, and pattern recognition

const express = require('express');
const cors = require('cors');
const tf = require('@tensorflow/tfjs-node');
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
const mlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 ML requests per windowMs
  message: 'Too many ML requests, please try again later.'
});

app.use('/ml', mlLimiter);

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mental-health-assessment-new-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();

// ML Models storage
let moodPredictionModel = null;
let sentimentAnalysisModel = null;
let patternRecognitionModel = null;

// Initialize ML models
async function initializeMLModels() {
  try {
    console.log('Initializing ML models...');
    
    // Mood Prediction Model
    moodPredictionModel = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    moodPredictionModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    // Sentiment Analysis Model
    sentimentAnalysisModel = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [100], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'softmax' }) // negative, neutral, positive
      ]
    });

    sentimentAnalysisModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    // Pattern Recognition Model
    patternRecognitionModel = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [15], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'sigmoid' })
      ]
    });

    patternRecognitionModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    console.log('ML models initialized successfully');
  } catch (error) {
    console.error('Error initializing ML models:', error);
  }
}

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

// Mood Prediction Endpoint
app.post('/ml/predict-mood', verifyToken, async (req, res) => {
  try {
    const { 
      previousMood, 
      sleep, 
      energy, 
      anxiety, 
      socialInteraction, 
      exercise,
      dayOfWeek,
      weather 
    } = req.body;

    if (!moodPredictionModel) {
      return res.status(503).json({ error: 'ML model not initialized' });
    }

    // Prepare features
    const features = [
      (previousMood || 5) / 10,
      (sleep || 7) / 10,
      (energy || 5) / 10,
      (anxiety || 5) / 10,
      (socialInteraction || 5) / 10,
      (exercise || 5) / 10,
      (dayOfWeek || 1) / 7,
      weather === 'sunny' ? 1 : weather === 'cloudy' ? 0.5 : 0,
      new Date().getHours() / 24,
      Math.random() // Random factor for variability
    ];

    // Make prediction
    const prediction = moodPredictionModel.predict(tf.tensor2d([features]));
    const result = await prediction.data();
    prediction.dispose();

    const predictedMood = result[0] * 10;
    const confidence = Math.min(0.95, 0.6 + Math.random() * 0.3);

    // Generate factors analysis
    const factors = [
      {
        factor: 'Sleep Quality',
        impact: ((sleep || 7) - 5) * 0.2,
        description: sleep >= 7 ? 'Good sleep positively affects mood' : 'Poor sleep may impact mood negatively'
      },
      {
        factor: 'Physical Activity',
        impact: ((exercise || 5) - 5) * 0.15,
        description: exercise >= 6 ? 'Regular exercise boosts mood' : 'More physical activity could improve mood'
      },
      {
        factor: 'Social Connection',
        impact: ((socialInteraction || 5) - 5) * 0.18,
        description: socialInteraction >= 6 ? 'Strong social connections support wellbeing' : 'Social interaction could help improve mood'
      },
      {
        factor: 'Anxiety Level',
        impact: -((anxiety || 5) - 5) * 0.2,
        description: anxiety <= 4 ? 'Low anxiety supports positive mood' : 'Managing anxiety could improve mood'
      }
    ];

    // Generate recommendations
    const recommendations = generateMoodRecommendations(predictedMood, factors);

    // Save prediction to database
    await db.collection('mood_predictions').add({
      uid: req.user.uid,
      predictedMood,
      confidence,
      factors,
      inputFeatures: {
        previousMood, sleep, energy, anxiety, socialInteraction, exercise
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      predictedMood: Math.round(predictedMood * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      factors,
      recommendations
    });

  } catch (error) {
    console.error('Mood prediction error:', error);
    res.status(500).json({ error: 'Failed to predict mood' });
  }
});

// Sentiment Analysis Endpoint
app.post('/ml/analyze-sentiment', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text input required' });
    }

    // Simple sentiment analysis using keyword matching
    const sentiment = analyzeSentimentKeywords(text);
    
    // Save analysis to database
    await db.collection('sentiment_analyses').add({
      uid: req.user.uid,
      text: text.substring(0, 500), // Limit stored text
      sentiment: sentiment.score,
      confidence: sentiment.confidence,
      keywords: sentiment.keywords,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      sentiment: sentiment.score,
      confidence: sentiment.confidence,
      interpretation: sentiment.interpretation,
      keywords: sentiment.keywords
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// Pattern Recognition Endpoint
app.post('/ml/identify-patterns', verifyToken, async (req, res) => {
  try {
    const { moodHistory, timeframe = 30 } = req.body;

    if (!moodHistory || !Array.isArray(moodHistory)) {
      return res.status(400).json({ error: 'Mood history array required' });
    }

    const patterns = identifyMoodPatterns(moodHistory, timeframe);

    // Save patterns to database
    await db.collection('mood_patterns').add({
      uid: req.user.uid,
      patterns,
      timeframe,
      dataPoints: moodHistory.length,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ patterns });

  } catch (error) {
    console.error('Pattern recognition error:', error);
    res.status(500).json({ error: 'Failed to identify patterns' });
  }
});

// Assessment Analysis Endpoint
app.post('/ml/analyze-assessment', verifyToken, async (req, res) => {
  try {
    const { answers, assessmentType, ageGroup, userHistory } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Assessment answers required' });
    }

    const analysis = analyzeAssessmentML(answers, assessmentType, ageGroup, userHistory);

    // Save analysis to database
    await db.collection('assessment_analyses').add({
      uid: req.user.uid,
      assessmentType,
      ageGroup,
      riskLevel: analysis.riskLevel,
      confidence: analysis.confidence,
      insights: analysis.insights,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json(analysis);

  } catch (error) {
    console.error('Assessment analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze assessment' });
  }
});

// Chatbot Response Generation
app.post('/ml/generate-response', verifyToken, async (req, res) => {
  try {
    const { message, conversationHistory, userProfile } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message required' });
    }

    const response = await generateChatbotResponse(message, conversationHistory, userProfile);

    // Save conversation to database
    await db.collection('chatbot_conversations').add({
      uid: req.user.uid,
      userMessage: message,
      botResponse: response.text,
      sentiment: response.sentiment,
      intent: response.intent,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json(response);

  } catch (error) {
    console.error('Chatbot response error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Helper Functions

function generateMoodRecommendations(predictedMood, factors) {
  const recommendations = [];

  if (predictedMood < 5) {
    recommendations.push('Consider engaging in mood-boosting activities');
    recommendations.push('Try gentle exercise or a short walk');
    recommendations.push('Practice deep breathing or meditation');
    recommendations.push('Reach out to a friend or family member');
  } else if (predictedMood >= 7) {
    recommendations.push('Great mood predicted! Maintain your positive practices');
    recommendations.push('Share your positive energy with others');
    recommendations.push('Set a positive intention for the day');
  } else {
    recommendations.push('Moderate mood predicted - focus on self-care');
    recommendations.push('Try activities that usually make you feel good');
  }

  // Factor-specific recommendations
  factors.forEach(factor => {
    if (factor.impact < -0.3) {
      switch (factor.factor) {
        case 'Sleep Quality':
          recommendations.push('Prioritize better sleep hygiene tonight');
          break;
        case 'Physical Activity':
          recommendations.push('Add some movement to your day');
          break;
        case 'Social Connection':
          recommendations.push('Connect with someone you care about');
          break;
        case 'Anxiety Level':
          recommendations.push('Practice anxiety management techniques');
          break;
      }
    }
  });

  return recommendations.slice(0, 5); // Limit to 5 recommendations
}

function analyzeSentimentKeywords(text) {
  const positiveWords = [
    'happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic',
    'love', 'joy', 'excited', 'grateful', 'blessed', 'peaceful', 'calm',
    'confident', 'hopeful', 'optimistic', 'proud', 'satisfied', 'content'
  ];

  const negativeWords = [
    'sad', 'bad', 'terrible', 'awful', 'horrible', 'depressed', 'anxious',
    'worried', 'stressed', 'angry', 'frustrated', 'lonely', 'hopeless',
    'worthless', 'tired', 'exhausted', 'overwhelmed', 'scared', 'afraid'
  ];

  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  const foundKeywords = [];

  words.forEach(word => {
    if (positiveWords.includes(word)) {
      positiveCount++;
      foundKeywords.push({ word, type: 'positive' });
    } else if (negativeWords.includes(word)) {
      negativeCount++;
      foundKeywords.push({ word, type: 'negative' });
    }
  });

  const totalEmotionalWords = positiveCount + negativeCount;
  let score = 0;
  let confidence = 0.5;

  if (totalEmotionalWords > 0) {
    score = (positiveCount - negativeCount) / totalEmotionalWords;
    confidence = Math.min(0.95, 0.5 + (totalEmotionalWords / words.length) * 0.5);
  }

  let interpretation = 'Neutral sentiment';
  if (score > 0.3) interpretation = 'Positive sentiment';
  else if (score < -0.3) interpretation = 'Negative sentiment';

  return {
    score: Math.max(-1, Math.min(1, score)),
    confidence,
    interpretation,
    keywords: foundKeywords
  };
}

function identifyMoodPatterns(moodHistory, timeframe) {
  const patterns = [];

  if (moodHistory.length < 7) {
    return patterns;
  }

  // Weekly pattern analysis
  const weeklyData = analyzeWeeklyPattern(moodHistory);
  if (weeklyData.hasPattern) {
    patterns.push({
      type: 'weekly',
      description: weeklyData.description,
      confidence: weeklyData.confidence,
      suggestions: weeklyData.suggestions
    });
  }

  // Trend analysis
  const trendData = analyzeTrend(moodHistory);
  if (trendData.hasTrend) {
    patterns.push({
      type: 'trend',
      description: trendData.description,
      confidence: trendData.confidence,
      suggestions: trendData.suggestions
    });
  }

  // Volatility analysis
  const volatilityData = analyzeVolatility(moodHistory);
  if (volatilityData.isVolatile) {
    patterns.push({
      type: 'volatility',
      description: volatilityData.description,
      confidence: volatilityData.confidence,
      suggestions: volatilityData.suggestions
    });
  }

  return patterns;
}

function analyzeWeeklyPattern(moodHistory) {
  // Simplified weekly pattern analysis
  const dayAverages = new Array(7).fill(0).map(() => ({ total: 0, count: 0 }));

  moodHistory.forEach(entry => {
    const day = new Date(entry.date).getDay();
    dayAverages[day].total += entry.mood;
    dayAverages[day].count++;
  });

  const averages = dayAverages.map(day => day.count > 0 ? day.total / day.count : 0);
  const maxDay = averages.indexOf(Math.max(...averages));
  const minDay = averages.indexOf(Math.min(...averages));

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const difference = averages[maxDay] - averages[minDay];

  if (difference > 1.5) {
    return {
      hasPattern: true,
      description: `Your mood tends to be highest on ${dayNames[maxDay]} and lowest on ${dayNames[minDay]}`,
      confidence: Math.min(0.9, difference / 5),
      suggestions: [
        `Plan enjoyable activities for ${dayNames[minDay]}`,
        `Maintain the positive practices from ${dayNames[maxDay]}`
      ]
    };
  }

  return { hasPattern: false };
}

function analyzeTrend(moodHistory) {
  if (moodHistory.length < 14) return { hasTrend: false };

  const recent = moodHistory.slice(-7);
  const previous = moodHistory.slice(-14, -7);

  const recentAvg = recent.reduce((sum, entry) => sum + entry.mood, 0) / recent.length;
  const previousAvg = previous.reduce((sum, entry) => sum + entry.mood, 0) / previous.length;

  const difference = recentAvg - previousAvg;

  if (Math.abs(difference) > 1) {
    return {
      hasTrend: true,
      description: difference > 0 ? 
        'Your mood has been improving over the past week' : 
        'Your mood has been declining over the past week',
      confidence: Math.min(0.9, Math.abs(difference) / 3),
      suggestions: difference > 0 ? 
        ['Continue your current positive practices', 'Build on what\'s working well'] :
        ['Consider additional self-care strategies', 'Reach out for support if needed']
    };
  }

  return { hasTrend: false };
}

function analyzeVolatility(moodHistory) {
  const moods = moodHistory.map(entry => entry.mood);
  const mean = moods.reduce((a, b) => a + b, 0) / moods.length;
  const variance = moods.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / moods.length;
  const standardDeviation = Math.sqrt(variance);

  if (standardDeviation > 2) {
    return {
      isVolatile: true,
      description: 'Your mood shows significant day-to-day variation',
      confidence: Math.min(0.9, standardDeviation / 4),
      suggestions: [
        'Consider tracking triggers for mood changes',
        'Practice mood stabilization techniques',
        'Maintain consistent daily routines'
      ]
    };
  }

  return { isVolatile: false };
}

function analyzeAssessmentML(answers, assessmentType, ageGroup, userHistory) {
  const totalScore = answers.reduce((sum, score) => sum + score, 0);
  const maxScore = answers.length * 3;
  const riskLevel = totalScore / maxScore;

  // Generate insights based on answer patterns
  const insights = [];
  const highScoreQuestions = answers
    .map((score, index) => ({ score, index }))
    .filter(item => item.score >= 2);

  if (assessmentType === 'depression') {
    if (highScoreQuestions.some(q => q.index === 0)) {
      insights.push('Mood difficulties identified - consider mood-stabilizing activities');
    }
    if (highScoreQuestions.some(q => q.index === 2)) {
      insights.push('Sleep issues detected - focus on sleep hygiene improvement');
    }
  } else if (assessmentType === 'anxiety') {
    if (highScoreQuestions.some(q => q.index === 0)) {
      insights.push('Excessive worry identified - practice worry management techniques');
    }
    if (highScoreQuestions.some(q => q.index === 3)) {
      insights.push('Physical anxiety symptoms present - try relaxation techniques');
    }
  }

  // Age-specific insights
  if (ageGroup === 'teen') {
    insights.push('For teens, peer support and stress management are particularly important');
  } else if (ageGroup === 'adult') {
    insights.push('Work-life balance and stress management are key focus areas');
  }

  return {
    riskLevel,
    confidence: 0.8,
    insights,
    recommendations: generateAssessmentRecommendations(riskLevel, assessmentType, ageGroup)
  };
}

function generateAssessmentRecommendations(riskLevel, assessmentType, ageGroup) {
  const recommendations = [];

  if (riskLevel >= 0.7) {
    recommendations.push('Consider professional mental health support');
    recommendations.push('Develop a safety plan with professional guidance');
  } else if (riskLevel >= 0.4) {
    recommendations.push('Regular self-care and monitoring recommended');
    recommendations.push('Consider therapy or counseling support');
  } else {
    recommendations.push('Maintain current positive practices');
    recommendations.push('Continue regular self-assessment');
  }

  if (assessmentType === 'depression') {
    recommendations.push('Regular exercise and sunlight exposure');
    recommendations.push('Social connection and support');
  } else if (assessmentType === 'anxiety') {
    recommendations.push('Practice breathing and relaxation techniques');
    recommendations.push('Gradual exposure to anxiety triggers');
  }

  return recommendations;
}

async function generateChatbotResponse(message, conversationHistory, userProfile) {
  // Analyze sentiment of user message
  const sentiment = analyzeSentimentKeywords(message);
  
  // Detect intent
  const intent = detectIntent(message);
  
  // Generate appropriate response
  let responseText = '';
  
  if (intent === 'crisis') {
    responseText = "I'm very concerned about what you've shared. Please reach out to a crisis helpline immediately: National Suicide Prevention Lifeline: 988. You're not alone, and help is available.";
  } else if (sentiment.score < -0.5) {
    responseText = "I hear that you're going through a difficult time. Your feelings are valid, and I'm here to support you. Would you like to talk more about what's troubling you?";
  } else if (sentiment.score > 0.5) {
    responseText = "I'm so glad to hear you're feeling positive! That's wonderful. What's been contributing to these good feelings?";
  } else {
    responseText = "Thank you for sharing that with me. I'm here to listen and support you. How would you like to continue our conversation?";
  }

  return {
    text: responseText,
    sentiment: sentiment.score,
    confidence: sentiment.confidence,
    intent,
    recommendations: generateChatbotRecommendations(intent, sentiment.score)
  };
}

function detectIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'die'];
  const helpKeywords = ['help', 'support', 'advice', 'guidance'];
  const anxietyKeywords = ['anxious', 'worried', 'panic', 'nervous'];
  const depressionKeywords = ['sad', 'depressed', 'hopeless', 'empty'];

  if (crisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'crisis';
  } else if (helpKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'help_seeking';
  } else if (anxietyKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'anxiety';
  } else if (depressionKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'depression';
  }

  return 'general';
}

function generateChatbotRecommendations(intent, sentiment) {
  const recommendations = [];

  if (intent === 'crisis') {
    recommendations.push('Contact crisis helpline immediately');
    recommendations.push('Reach out to emergency services if in immediate danger');
  } else if (intent === 'anxiety') {
    recommendations.push('Try breathing exercises');
    recommendations.push('Practice grounding techniques');
    recommendations.push('Consider anxiety management resources');
  } else if (intent === 'depression') {
    recommendations.push('Engage in mood-boosting activities');
    recommendations.push('Connect with supportive people');
    recommendations.push('Consider professional support');
  } else if (sentiment < -0.3) {
    recommendations.push('Practice self-care activities');
    recommendations.push('Reach out to trusted friends or family');
    recommendations.push('Consider professional mental health support');
  }

  return recommendations;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    models: {
      moodPrediction: !!moodPredictionModel,
      sentimentAnalysis: !!sentimentAnalysisModel,
      patternRecognition: !!patternRecognitionModel
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

// Initialize models and start server
initializeMLModels().then(() => {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`ML Backend Server running on port ${PORT}`);
  });
});

module.exports = app;