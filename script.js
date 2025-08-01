import { transcribeAudio, generateGuideFromSteps } from './api.js';

// --- Application State & Mock Data ---

const state = {
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

const users = {
    'user': { name: 'Service Provider', avatar: 'https://i.pravatar.cc/40?u=user' },
    'client1': { name: 'Alice (Acme Corp)', avatar: 'https://i.pravatar.cc/40?u=client1' },
    'client2': { name: 'Bob (Project Phoenix)', avatar: 'https://i.pravatar.cc/40?u=client2' },
};

const initialMessages = {
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


// --- Main Application Logic (runs after DOM is loaded) ---

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    const DOM = {
        appContainer: document.querySelector('.app-container'),
        channelsList: document.getElementById('channels-list'),
        chatHeaderTitle: document.getElementById('chat-header-title'),
        messagesList: document.getElementById('messages-list'),
        messageForm: document.getElementById('message-form'),
        messageInput: document.getElementById('message-input'),
        backBtn: document.querySelector('.back-btn'),
        transcriptionBtn: document.getElementById('transcription-btn'),
        closeTranscriptionBtn: document.querySelector('.close-transcription-btn'),
        mainContent: document.querySelector('.main-content'),
        transcriptionContent: document.getElementById('transcription-content'),
        transcriptionPlaceholder: document.getElementById('transcription-placeholder'),
        transcriptionLoading: document.getElementById('transcription-loading'),
        transcriptionOutput: document.getElementById('transcription-output'),
        addChannelBtn: document.getElementById('add-channel-btn'),
        addChannelModal: document.getElementById('add-channel-modal'),
        addChannelForm: document.getElementById('add-channel-form'),
        modalCancelBtn: document.getElementById('modal-cancel-btn'),
        newChannelNameInput: document.getElementById('new-channel-name'),
        videoCallBtn: document.getElementById('video-call-btn'),
        meetingModal: document.getElementById('meeting-modal'),
        closeMeetingModalBtn: document.getElementById('close-meeting-modal-btn'),
        copyLinkBtn: document.getElementById('copy-link-btn'),
        meetingLinkInput: document.getElementById('meeting-link'),
        startCallBtn: document.getElementById('start-call-btn'),
        videoCallView: document.getElementById('video-call-view'),
        localVideo: document.getElementById('local-video'),
        remoteVideo: document.getElementById('remote-video'),
        endCallBtn: document.getElementById('end-call-btn'),
        recordTranscribeBtn: document.getElementById('record-transcribe-btn'),
        screenShareBtn: document.getElementById('screen-share-btn'),
        stepRecorderControls: document.getElementById('step-recorder-controls'),
        captureStepBtn: document.getElementById('capture-step-btn'),
        finishRecordingBtn: document.getElementById('finish-recording-btn'),
        cancelRecordingBtn: document.getElementById('cancel-recording-btn'),
        helpBtn: document.getElementById('help-btn'),
        docsModal: document.getElementById('docs-modal'),
        closeDocsModalBtn: document.getElementById('close-docs-modal-btn'),
    };

    // --- UI & Chat Functions ---

    const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const addMessage = (channel, user, text) => {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message');
        
        messageEl.innerHTML = `
            <img src="${users[user].avatar}" alt="${users[user].name}" class="avatar">
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${users[user].name}</span>
                    <span class="message-timestamp">${getTime()}</span>
                </div>
                <div class="message-text">${text}</div>
            </div>`;

        DOM.messagesList.appendChild(messageEl);
        DOM.messagesList.scrollTop = DOM.messagesList.scrollHeight;
        return messageEl;
    };

    const loadMessages = (channel) => {
        DOM.messagesList.innerHTML = '';
        const messages = initialMessages[channel] || [];
        messages.forEach(msg => {
            const messageEl = document.createElement('div');
            messageEl.classList.add('message');
            messageEl.innerHTML = `
                <img src="${users[msg.user].avatar}" alt="${users[msg.user].name}" class="avatar">
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${users[msg.user].name}</span>
                        <span class="message-timestamp">${msg.time}</span>
                    </div>
                    <div class="message-text">${msg.text}</div>
                </div>
            `;
            DOM.messagesList.appendChild(messageEl);
        });
        DOM.messagesList.scrollTop = DOM.messagesList.scrollHeight;
    };

    const switchChannel = (channelItem) => {
        document.querySelector('.channel.active')?.classList.remove('active');
        channelItem.classList.add('active');
        state.activeChannel = channelItem.dataset.channelName;
        DOM.chatHeaderTitle.textContent = `# ${state.activeChannel}`;
        DOM.messageInput.placeholder = `Message #${state.activeChannel}`;
        loadMessages(state.activeChannel);

        DOM.transcriptionBtn.disabled = !state.lastTranscription;

        if (window.innerWidth < 768) {
            DOM.appContainer.classList.add('chat-view-active');
        }
    };

    const createNewChannel = (name) => {
        const channelName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (!channelName || initialMessages.hasOwnProperty(channelName)) {
            alert("Invalid or duplicate channel name.");
            return;
        }
        
        const li = document.createElement('li');
        li.classList.add('channel');
        li.dataset.channelName = channelName;
        li.innerHTML = `<a># ${channelName}</a>`;
        DOM.channelsList.appendChild(li);

        initialMessages[channelName] = [];
        li.addEventListener('click', () => switchChannel(li));
        switchChannel(li);

        DOM.addChannelModal.classList.add('hidden');
        DOM.newChannelNameInput.value = '';
    };
    
    // --- Video Call & Transcription Functions ---

    const startCall = async () => {
        DOM.meetingModal.classList.add('hidden');
        DOM.videoCallView.classList.remove('hidden');
        try {
            state.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            DOM.localVideo.srcObject = state.localStream;
            DOM.remoteVideo.srcObject = state.localStream; // Mocking remote user with local stream
        } catch (err) {
            console.error("Error accessing media devices.", err);
            alert("Could not access camera and microphone.");
            DOM.videoCallView.classList.add('hidden');
        }
    };

    const endCall = () => {
        if (state.isRecording) stopRecording();
        state.localStream?.getTracks().forEach(track => track.stop());
        DOM.videoCallView.classList.add('hidden');
        DOM.localVideo.srcObject = null;
        DOM.remoteVideo.srcObject = null;
        state.localStream = null;
    };

    const startRecording = () => {
        if (!state.localStream) {
            alert("Could not get microphone access.");
            return;
        }
        state.audioChunks = [];
        const audioStream = new MediaStream(state.localStream.getAudioTracks());
        state.mediaRecorder = new MediaRecorder(audioStream);
        
        state.mediaRecorder.ondataavailable = event => state.audioChunks.push(event.data);
        state.mediaRecorder.onstop = processRecording;
        
        state.mediaRecorder.start();
        state.isRecording = true;
        
        DOM.recordTranscribeBtn.classList.add('recording');
        DOM.recordTranscribeBtn.querySelector('span').textContent = 'Stop';
    };

    const stopRecording = () => {
        if (state.mediaRecorder) {
            state.mediaRecorder.stop();
            state.isRecording = false;
            DOM.recordTranscribeBtn.classList.remove('recording');
            DOM.recordTranscribeBtn.querySelector('span').textContent = 'Record';
        }
    };

    const toggleRecording = () => state.isRecording ? stopRecording() : startRecording();

    const processRecording = async () => {
        addMessage(state.activeChannel, 'user', 'A meeting was recorded.');
        const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
        state.audioChunks = [];

        DOM.transcriptionPlaceholder.classList.add('hidden');
        DOM.transcriptionOutput.innerHTML = '';
        DOM.transcriptionLoading.classList.remove('hidden');
        if(!DOM.mainContent.classList.contains('transcription-visible')) {
            DOM.mainContent.classList.add('transcription-visible');
        }

        try {
            const transcriptionText = await transcribeAudio(audioBlob);
            state.lastTranscription = transcriptionText;
            DOM.transcriptionOutput.textContent = state.lastTranscription;
            DOM.transcriptionLoading.classList.add('hidden');
            DOM.transcriptionBtn.disabled = false;
            addMessage(state.activeChannel, 'user', 'Meeting transcript is ready. <button class="view-transcription-btn">View Transcript</button>');
        } catch (error) {
            console.error("Transcription Error:", error);
            DOM.transcriptionOutput.textContent = "Error transcribing audio. Please try again.";
            DOM.transcriptionLoading.classList.add('hidden');
            addMessage(state.activeChannel, 'user', 'Sorry, there was an error generating the transcript.');
        }
    };

    // --- How-To Guide Recorder Functions ---

    const cleanupStepRecording = () => {
        state.isRecordingSteps = false;
        state.screenStream?.getTracks().forEach(track => track.stop());
        state.screenStream = null;
        state.capturedSteps = [];
        DOM.stepRecorderControls.classList.add('hidden');
        DOM.screenShareBtn.disabled = false;
        DOM.finishRecordingBtn.disabled = false;
        DOM.finishRecordingBtn.querySelector('i').className = 'fas fa-check-circle';
        DOM.finishRecordingBtn.innerHTML = '<i class="fas fa-check-circle"></i> Finish & Generate';
    };

    const startStepRecording = async () => {
        if (state.isRecordingSteps) return;
        try {
            state.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: "screen" } });
            state.isRecordingSteps = true;
            state.capturedSteps = [];
            DOM.screenShareBtn.disabled = true;
            DOM.stepRecorderControls.classList.remove('hidden');
            state.screenStream.getVideoTracks()[0].onended = () => {
                if (state.isRecordingSteps) finishStepRecording();
            };
        } catch (error) {
            console.error("Error starting screen share:", error);
            cleanupStepRecording();
        }
    };

    const captureStep = async () => {
        if (!state.screenStream) return;
        const videoTrack = state.screenStream.getVideoTracks()[0];
        const imageCapture = new window.ImageCapture(videoTrack);
        try {
            const frame = await imageCapture.grabFrame();
            const canvas = document.createElement('canvas');
            canvas.width = frame.width;
            canvas.height = frame.height;
            canvas.getContext('2d')?.drawImage(frame, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg', 0.9);
            state.capturedSteps.push({ imageData });
            DOM.captureStepBtn.style.transform = 'scale(1.1)';
            setTimeout(() => DOM.captureStepBtn.style.transform = 'scale(1)', 150);
        } catch (error) {
            console.error("Error capturing step:", error);
        }
    };

    const finishStepRecording = async () => {
        if (!state.isRecordingSteps || state.capturedSteps.length === 0) {
            cleanupStepRecording();
            return;
        }
        DOM.finishRecordingBtn.disabled = true;
        DOM.finishRecordingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

        const messageEl = addMessage(state.activeChannel, 'user', '');
        messageEl.querySelector('.message-text').innerHTML = `
            <div class="placeholder" style="display: flex; align-items: center; gap: 10px;">
                <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
                <p>Generating guide from ${state.capturedSteps.length} steps...</p>
            </div>`;
        
        try {
            const guide = await generateGuideFromSteps(state.capturedSteps);
            renderGuideInChat(guide, messageEl);
        } catch (error) {
            console.error("Failed to generate guide:", error);
            messageEl.querySelector('.message-text').textContent = 'An error occurred while generating the guide.';
        } finally {
            cleanupStepRecording();
        }
    };

    const renderGuideInChat = (guide, messageElToUpdate) => {
        const stepsHtml = guide.map((step, index) => `
            <div class="guide-step">
                <div class="step-number">${index + 1}</div>
                <div class="step-details">
                    <p class="step-description">${step.description}</p>
                    <img src="${step.imageData}" alt="Step ${index + 1} Screenshot" class="step-screenshot"/>
                </div>
            </div>`).join('');
        const guideHtml = `
            <div class="how-to-guide-wrapper">
                <div class="how-to-guide-content">
                    <h4 class="guide-title"><i class="fas fa-list-ol"></i> How-To Guide</h4>
                    ${stepsHtml}
                </div>
            </div>`;
        messageElToUpdate.querySelector('.message-text').innerHTML = guideHtml;
        DOM.messagesList.scrollTop = DOM.messagesList.scrollHeight;
    };

    // --- Event Listeners Initialization ---

    const initializeEventListeners = () => {
        DOM.channelsList.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.channel');
            if (channelItem) switchChannel(channelItem);
        });

        DOM.backBtn.addEventListener('click', () => DOM.appContainer.classList.remove('chat-view-active'));

        DOM.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = DOM.messageInput.value.trim();
            if (text) {
                addMessage(state.activeChannel, 'user', text);
                DOM.messageInput.value = '';
            }
        });

        DOM.transcriptionBtn.addEventListener('click', () => {
            if (!DOM.transcriptionBtn.disabled) {
                DOM.mainContent.classList.toggle('transcription-visible');
                if (DOM.mainContent.classList.contains('transcription-visible')) {
                    DOM.transcriptionPlaceholder.classList.add('hidden');
                    DOM.transcriptionLoading.classList.add('hidden');
                    DOM.transcriptionOutput.textContent = state.lastTranscription;
                }
            }
        });

        DOM.closeTranscriptionBtn.addEventListener('click', () => DOM.mainContent.classList.remove('transcription-visible'));

        DOM.messagesList.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-transcription-btn')) DOM.transcriptionBtn.click();
        });

        DOM.addChannelBtn.addEventListener('click', () => {
            DOM.addChannelModal.classList.remove('hidden');
            DOM.newChannelNameInput.focus();
        });

        DOM.addChannelForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = DOM.newChannelNameInput.value.trim();
            if (name) createNewChannel(name);
        });

        DOM.modalCancelBtn.addEventListener('click', () => DOM.addChannelModal.classList.add('hidden'));
        DOM.addChannelModal.addEventListener('click', (e) => {
            if (e.target === DOM.addChannelModal) DOM.addChannelModal.classList.add('hidden');
        });
        
        DOM.videoCallBtn.addEventListener('click', () => DOM.meetingModal.classList.remove('hidden'));
        DOM.closeMeetingModalBtn.addEventListener('click', () => DOM.meetingModal.classList.add('hidden'));
        DOM.meetingModal.addEventListener('click', (e) => {
            if (e.target === DOM.meetingModal) DOM.meetingModal.classList.add('hidden');
        });

        DOM.copyLinkBtn.addEventListener('click', () => {
            DOM.meetingLinkInput.select();
            document.execCommand('copy');
            DOM.copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                DOM.copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
        });

        DOM.startCallBtn.addEventListener('click', startCall);
        DOM.endCallBtn.addEventListener('click', endCall);
        DOM.recordTranscribeBtn.addEventListener('click', toggleRecording);
        
        DOM.screenShareBtn.addEventListener('click', startStepRecording);
        DOM.captureStepBtn.addEventListener('click', captureStep);
        DOM.finishRecordingBtn.addEventListener('click', finishStepRecording);
        DOM.cancelRecordingBtn.addEventListener('click', cleanupStepRecording);

        DOM.helpBtn.addEventListener('click', () => DOM.docsModal.classList.remove('hidden'));
        DOM.closeDocsModalBtn.addEventListener('click', () => DOM.docsModal.classList.add('hidden'));
        DOM.docsModal.addEventListener('click', (e) => {
            if (e.target === DOM.docsModal) DOM.docsModal.classList.add('hidden');
        });

        console.log("Application initialized successfully.");
    };

    // --- Initial UI Setup ---

    const initializeUI = () => {
        const initialActiveChannel = document.querySelector('.channel.active');
        if (initialActiveChannel) {
            switchChannel(initialActiveChannel);
        }
        if (window.innerWidth >= 768) {
            DOM.appContainer.classList.add('chat-view-active');
        }
    };

    // --- Start the App ---
    initializeUI();
    initializeEventListeners();
});