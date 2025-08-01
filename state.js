/**
 * This file centralizes the application's state.
 */

// --- App State ---
export const state = {
    activeChannel: 'project-phoenix',
    mediaRecorder: null,
    audioChunks: [],
    localStream: null,
    isRecording: false,
    lastTranscription: "",
    isRecordingSteps: false,
    screenStream: null,
    capturedSteps: [],
};

// --- Mock Data ---
export const users = {
    'user': { name: 'Service Provider', avatar: 'https://i.pravatar.cc/40?u=user' },
    'client1': { name: 'Alice (Acme Corp)', avatar: 'https://i.pravatar.cc/40?u=client1' },
    'client2': { name: 'Bob (Project Phoenix)', avatar: 'https://i.pravatar.cc/40?u=client2' },
};

export const initialMessages = {
    'project-phoenix': [
        { user: 'client2', text: 'Hey, checking in on the latest designs. Any updates?', time: '10:30 AM' },
        { user: 'user', text: 'Working on them now! Should have something for you to review by EOD.', time: '10:31 AM' },
    ],
    'acme-corp': [
        { user: 'client1', text: 'Can we schedule a call for tomorrow to discuss the Q3 report?', time: 'Yesterday' },
    ],
    'general': [],
    'internal-dev': [],
};
