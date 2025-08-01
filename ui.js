import { state, users, initialMessages } from './state.js';
import { renderGuideInChat } from './guide.js';

// --- DOM Element Selection ---
export const DOM = {
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

// --- UI Functions ---

export const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const addMessage = (channel, user, text) => {
    if (!DOM.messagesList) return;

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

export const loadMessages = (channel) => {
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

export const switchChannel = (channelItem) => {
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

export const createNewChannel = (name) => {
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

export const showTranscriptionLoading = () => {
    DOM.transcriptionPlaceholder.classList.add('hidden');
    DOM.transcriptionOutput.innerHTML = '';
    DOM.transcriptionLoading.classList.remove('hidden');
    if(!DOM.mainContent.classList.contains('transcription-visible')) {
        DOM.mainContent.classList.add('transcription-visible');
    }
};

export const showTranscriptionResult = (text) => {
    DOM.transcriptionOutput.textContent = text;
    DOM.transcriptionLoading.classList.add('hidden');
    DOM.transcriptionBtn.disabled = false;
};

export const showTranscriptionError = () => {
    DOM.transcriptionOutput.textContent = "Error transcribing audio. Please try again.";
    DOM.transcriptionLoading.classList.add('hidden');
};

export const initializeUI = () => {
    const initialActiveChannel = document.querySelector('.channel.active');
    if (initialActiveChannel) {
        switchChannel(initialActiveChannel);
    }
    if (window.innerWidth >= 768) {
        DOM.appContainer.classList.add('chat-view-active');
    }
};
