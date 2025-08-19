import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { UserProfile, LearningSession, QRData } from '../types';

interface AppState {
  user: UserProfile;
  currentSession: LearningSession | null;
  recentScans: QRData[];
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: UserProfile }
  | { type: 'START_SESSION'; payload: LearningSession }
  | { type: 'END_SESSION' }
  | { type: 'ADD_QR_SCAN'; payload: QRData }
  | { type: 'INCREMENT_QUESTIONS_ASKED' }
  | { type: 'INCREMENT_QR_SCANNED' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  user: {
    name: 'Student',
    email: 'student@learning.app',
    questionsAsked: 0,
    quizzesTaken: 0,
    qrCodesScanned: 0,
  },
  currentSession: null,
  recentScans: [],
  isLoading: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'START_SESSION':
      return { ...state, currentSession: action.payload };
    
    case 'END_SESSION':
      return { ...state, currentSession: null };
    
    case 'ADD_QR_SCAN':
      return {
        ...state,
        recentScans: [action.payload, ...state.recentScans.slice(0, 9)], // Keep last 10 scans
      };
    
    case 'INCREMENT_QUESTIONS_ASKED':
      return {
        ...state,
        user: {
          ...state.user,
          questionsAsked: state.user.questionsAsked + 1,
        },
      };
    
    case 'INCREMENT_QR_SCANNED':
      return {
        ...state,
        user: {
          ...state.user,
          qrCodesScanned: state.user.qrCodesScanned + 1,
        },
      };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Helper hooks for common operations
export const useUser = () => {
  const { state } = useAppContext();
  return state.user;
};

export const useCurrentSession = () => {
  const { state } = useAppContext();
  return state.currentSession;
};

export const useRecentScans = () => {
  const { state } = useAppContext();
  return state.recentScans;
};
