import { v4 as uuidv4 } from 'uuid';

// --- MONGODB SCHEMA DEFINITIONS (For Backend Implementation) ---
/*
  // User Schema
  const UserSchema = new Schema({
    userId: String,
    lastActive: Date,
    preferences: Object
  });

  // Activity Log Schema
  const LogSchema = new Schema({
    userId: String,
    timestamp: Date,
    actionType: String, // 'QUICK_SEARCH', 'DEEP_RESEARCH', 'DOC_ANALYSIS'
    query: String,
    documentName: String,
    documentFormat: String,
    metadata: Object
  });
*/

// --- FRONTEND SERVICE ---

const USER_ID_KEY = 'jarvis_user_id';
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8002/api";

const getUserId = () => {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
};

export interface ActivityLog {
  actionType: 'QUICK_SEARCH' | 'DEEP_RESEARCH' | 'DOC_ANALYSIS' | 'NAVIGATE';
  query?: string;
  documentName?: string;
  documentFormat?: string;
  timestamp: Date;
  userId?: string;
}

export const logActivity = async (activity: Omit<ActivityLog, 'timestamp'>) => {
  const payload = {
    userId: getUserId(),
    timestamp: new Date(),
    ...activity
  };

  // 1. Send to backend MongoDB
  try {
    const response = await fetch(`${API_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[MongoDB] Logged Activity:', result);
  } catch (error) {
    console.error('Failed to log to MongoDB', error);
  }

  // 2. Also save to LocalStorage as backup
  try {
    const existingLogs = JSON.parse(localStorage.getItem('jarvis_activity_logs') || '[]');
    existingLogs.push(payload);
    localStorage.setItem('jarvis_activity_logs', JSON.stringify(existingLogs));
  } catch (error) {
    console.error('Failed to save to localStorage', error);
  }
};

export const getUserHistory = async () => {
  const userId = getUserId();
  
  // Try to get history from backend MongoDB first
  try {
    const response = await fetch(`${API_URL}/user-history/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.logs || [];
  } catch (error) {
    console.error('Failed to retrieve history from MongoDB, falling back to localStorage', error);
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('jarvis_activity_logs') || '[]');
  }
};