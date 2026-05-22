// Firebase Authentication Backend Server
// This server handles user authentication, registration, and profile management

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mental-health-assessment-new-default-rtdb.firebaseio.com"
});

const app = express();
const db = admin.firestore();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/auth', authLimiter);
app.use(generalLimiter);

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

// User Registration
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, displayName, age, preferences } = req.body;

    // Validation
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email,
      displayName,
      age: age || null,
      preferences: preferences || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      assessmentHistory: [],
      moodHistory: [],
      isActive: true
    };

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    // Generate custom token
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      },
      customToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User Login
app.post('/auth/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token required' });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Update last login
    await db.collection('users').doc(uid).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get user profile
    const userDoc = await db.collection('users').doc(uid).get();
    const userProfile = userDoc.data();

    res.json({
      message: 'Login successful',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: userProfile?.displayName || decodedToken.name,
        profile: userProfile
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get User Profile
app.get('/auth/profile', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const profile = userDoc.data();
    delete profile.password; // Remove sensitive data

    res.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update User Profile
app.put('/auth/profile', verifyToken, async (req, res) => {
  try {
    const { displayName, age, preferences } = req.body;
    const uid = req.user.uid;

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (displayName) updateData.displayName = displayName;
    if (age) updateData.age = age;
    if (preferences) updateData.preferences = preferences;

    // Update Firestore
    await db.collection('users').doc(uid).update(updateData);

    // Update Firebase Auth if displayName changed
    if (displayName) {
      await admin.auth().updateUser(uid, { displayName });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change Password
app.post('/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const uid = req.user.uid;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    await admin.auth().updateUser(uid, { password: newPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Delete User Account
app.delete('/auth/account', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Soft delete - mark as inactive
    await db.collection('users').doc(uid).update({
      isActive: false,
      deletedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Optionally, disable the user in Firebase Auth
    await admin.auth().updateUser(uid, { disabled: true });

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Save Assessment Result
app.post('/assessments', verifyToken, async (req, res) => {
  try {
    const { type, score, severity, answers, ageGroup, recommendations } = req.body;
    const uid = req.user.uid;

    const assessment = {
      uid,
      type,
      score,
      severity,
      answers,
      ageGroup,
      recommendations,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      id: admin.firestore.FieldValue.serverTimestamp().toString()
    };

    // Save to assessments collection
    const docRef = await db.collection('assessments').add(assessment);

    // Update user's assessment history
    await db.collection('users').doc(uid).update({
      assessmentHistory: admin.firestore.FieldValue.arrayUnion({
        id: docRef.id,
        type,
        score,
        severity,
        timestamp: new Date()
      })
    });

    res.status(201).json({ 
      message: 'Assessment saved successfully',
      assessmentId: docRef.id 
    });
  } catch (error) {
    console.error('Assessment save error:', error);
    res.status(500).json({ error: 'Failed to save assessment' });
  }
});

// Get Assessment History
app.get('/assessments', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { limit = 10, offset = 0 } = req.query;

    const assessments = await db.collection('assessments')
      .where('uid', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const assessmentData = assessments.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ assessments: assessmentData });
  } catch (error) {
    console.error('Assessment fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Firebase Auth Server running on port ${PORT}`);
});

module.exports = app;