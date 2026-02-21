export const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
};
export const isFirebaseConfigured = (): boolean => {
  return !!(firebaseConfig.projectId && firebaseConfig.privateKey && firebaseConfig.clientEmail);
};
