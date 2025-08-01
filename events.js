
import { DOM, switchChannel, addMessage, createNewChannel } from './ui.js';
import { state } from './state.js';
import { startCall, endCall, toggleRecording } from './video.js';
import { startStepRecording, captureStep, finishStepRecording, cancelStepRecording } from './guide.js';

export function initializeEventListeners() {
    // Channels list
    if (DOM.channelsList) {
        DOM.channelsList.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.channel');
            if (channelItem) switchChannel(channelItem);
        });
    }

    // Back button for mobile
    if (DOM.backBtn) {
        DOM.backBtn.addEventListener('click', () => {
            DOM.appContainer.classList.remove('chat-view-active');
        });
    }

    // Message form submission
    if (DOM.messageForm) {
        DOM.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = DOM.messageInput.value.trim();
            if (text) {
                addMessage(state.activeChannel, 'user', text);
                DOM.messageInput.value = '';
            }
        });
    }

    // Transcription Pane Listeners
    if (DOM.transcriptionBtn) {
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
    }
    
    if (DOM.closeTranscriptionBtn) {
        DOM.closeTranscriptionBtn.addEventListener('click', () => {
            DOM.mainContent.classList.remove('transcription-visible');
        });
    }

    if (DOM.messagesList) {
        DOM.messagesList.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-transcription-btn')) {
                DOM.transcriptionBtn.click();
            }
        });
    }

    // Add Channel Modal Listeners
    if (DOM.addChannelBtn) {
        DOM.addChannelBtn.addEventListener('click', () => {
            DOM.addChannelModal.classList.remove('hidden');
            DOM.newChannelNameInput.focus();
        });
    }
    
    if (DOM.addChannelForm) {
        DOM.addChannelForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = DOM.newChannelNameInput.value.trim();
            if (name) createNewChannel(name);
        });
    }

    if (DOM.modalCancelBtn) DOM.modalCancelBtn.addEventListener('click', () => DOM.addChannelModal.classList.add('hidden'));
    if (DOM.addChannelModal) DOM.addChannelModal.addEventListener('click', (e) => {
        if (e.target === DOM.addChannelModal) DOM.addChannelModal.classList.add('hidden');
    });

    // Video Call Modal & Controls Listeners
    if (DOM.videoCallBtn) DOM.videoCallBtn.addEventListener('click', () => DOM.meetingModal.classList.remove('hidden'));
    if (DOM.closeMeetingModalBtn) DOM.closeMeetingModalBtn.addEventListener('click', () => DOM.meetingModal.classList.add('hidden'));
    if (DOM.meetingModal) DOM.meetingModal.addEventListener('click', (e) => {
        if (e.target === DOM.meetingModal) DOM.meetingModal.classList.add('hidden');
    });

    if (DOM.copyLinkBtn) {
        DOM.copyLinkBtn.addEventListener('click', () => {
            DOM.meetingLinkInput.select();
            document.execCommand('copy');
            DOM.copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                DOM.copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
        });
    }
    
    if (DOM.startCallBtn) DOM.startCallBtn.addEventListener('click', startCall);
    if (DOM.endCallBtn) DOM.endCallBtn.addEventListener('click', endCall);
    if (DOM.recordTranscribeBtn) DOM.recordTranscribeBtn.addEventListener('click', toggleRecording);
    
    // Step Recorder Listeners
    if (DOM.screenShareBtn) DOM.screenShareBtn.addEventListener('click', startStepRecording);
    if (DOM.captureStepBtn) DOM.captureStepBtn.addEventListener('click', captureStep);
    if (DOM.finishRecordingBtn) DOM.finishRecordingBtn.addEventListener('click', finishStepRecording);
    if (DOM.cancelRecordingBtn) DOM.cancelRecordingBtn.addEventListener('click', cancelStepRecording);

    // Documentation Modal Listeners
    if (DOM.helpBtn) DOM.helpBtn.addEventListener('click', () => DOM.docsModal.classList.remove('hidden'));
    if (DOM.closeDocsModalBtn) DOM.closeDocsModalBtn.addEventListener('click', () => DOM.docsModal.classList.add('hidden'));
    if (DOM.docsModal) DOM.docsModal.addEventListener('click', (e) => {
        if (e.target === DOM.docsModal) DOM.docsModal.classList.add('hidden');
    });

    console.log("All event listeners initialized successfully.");
}
