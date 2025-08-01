import { state } from './state.js';
import { DOM, addMessage, showTranscriptionLoading, showTranscriptionResult, showTranscriptionError } from './ui.js';
import { transcribeAudio } from './api.js';

// --- Video & Transcription Functions ---

export async function startCall() {
    DOM.meetingModal.classList.add('hidden');
    DOM.videoCallView.classList.remove('hidden');
    try {
        state.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        DOM.localVideo.srcObject = state.localStream;
        // In a real app, this is where you'd connect to a peer
        DOM.remoteVideo.srcObject = state.localStream; // Mocking remote user with local stream
    } catch (err) {
        console.error("Error accessing media devices.", err);
        alert("Could not access camera and microphone.");
        DOM.videoCallView.classList.add('hidden');
    }
}

export function endCall() {
    if (state.isRecording) stopRecording();
    state.localStream?.getTracks().forEach(track => track.stop());
    DOM.videoCallView.classList.add('hidden');
    DOM.localVideo.srcObject = null;
    DOM.remoteVideo.srcObject = null;
    state.localStream = null;
}

function startRecording() {
    if (!state.localStream) {
        alert("Could not get microphone access.");
        return;
    }
    state.audioChunks = [];
    const audioStream = new MediaStream(state.localStream.getAudioTracks());
    state.mediaRecorder = new MediaRecorder(audioStream);
    
    state.mediaRecorder.ondataavailable = event => {
        state.audioChunks.push(event.data);
    };
    state.mediaRecorder.onstop = processRecording;
    
    state.mediaRecorder.start();
    state.isRecording = true;
    
    const recordBtnSpan = DOM.recordTranscribeBtn.querySelector('span');
    DOM.recordTranscribeBtn.classList.add('recording');
    if (recordBtnSpan) recordBtnSpan.textContent = 'Stop';
}

function stopRecording() {
    if (state.mediaRecorder) {
        state.mediaRecorder.stop();
        state.isRecording = false;
        const recordBtnSpan = DOM.recordTranscribeBtn.querySelector('span');
        DOM.recordTranscribeBtn.classList.remove('recording');
        if (recordBtnSpan) recordBtnSpan.textContent = 'Record';
    }
}

export function toggleRecording() {
    if (state.isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

async function processRecording() {
    addMessage(state.activeChannel, 'user', 'A meeting was recorded.');
    const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
    state.audioChunks = [];

    showTranscriptionLoading();

    try {
        const transcriptionText = await transcribeAudio(audioBlob);
        state.lastTranscription = transcriptionText;
        showTranscriptionResult(state.lastTranscription);
        addMessage(state.activeChannel, 'user', 'Meeting transcript is ready. <button class="view-transcription-btn">View Transcript</button>');
    } catch (error) {
        console.error("Transcription Error:", error);
        showTranscriptionError();
        addMessage(state.activeChannel, 'user', 'Sorry, there was an error generating the transcript.');
    }
}
