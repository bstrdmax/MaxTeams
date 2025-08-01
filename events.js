import { DOM, switchChannel, addMessage, createNewChannel } from './ui.js';
import { state } from './state.js';
import { startCall, endCall, toggleRecording } from './video.js';
import { startStepRecording, captureStep, finishStepRecording, cancelStepRecording } from './guide.js';

export function initializeEventListeners() {
    DOM.channelsList.addEventListener('click', (e) => {
        const channelItem = e.target.closest('.channel');
        if (channelItem) {
            switchChannel(channelItem);
        }
    });

    DOM.backBtn.addEventListener('click', () => {
        DOM.appContainer.classList.remove('chat-view-active');
    });

    DOM.messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = DOM.messageInput.value.trim();
        if (text) {
            addMessage(state.activeChannel, 'user', text);
            DOM.messageInput.value = '';
        }
    });

    // Transcription Pane Listeners
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

    DOM.closeTranscriptionBtn.addEventListener('click', () => {
        DOM.mainContent.classList.remove('transcription-visible');
    });

    messagesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-transcription-btn')) {
            DOM.transcriptionBtn.click();
        }
    });

    // Add Channel Modal Listeners
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

    // Video Call Modal & Controls Listeners
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
    
    // Step Recorder Listeners
    DOM.screenShareBtn.addEventListener('click', startStepRecording);
    DOM.captureStepBtn.addEventListener('click', captureStep);
    DOM.finishRecordingBtn.addEventListener('click', finishStepRecording);
    DOM.cancelRecordingBtn.addEventListener('click', cancelStepRecording);

    // Documentation Modal Listeners
    DOM.helpBtn.addEventListener('click', () => DOM.docsModal.classList.remove('hidden'));
    DOM.closeDocsModalBtn.addEventListener('click', () => DOM.docsModal.classList.add('hidden'));
    DOM.docsModal.addEventListener('click', (e) => {
        if (e.target === DOM.docsModal) DOM.docsModal.classList.add('hidden');
    });
}
