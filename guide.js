import { state } from './state.js';
import { DOM, addMessage } from './ui.js';
import { generateGuideFromSteps } from './api.js';

// --- Scribe-like Step Recorder Functions ---

function cleanupRecording() {
    state.isRecordingSteps = false;
    state.screenStream?.getTracks().forEach(track => track.stop());
    state.screenStream = null;
    state.capturedSteps = [];
    DOM.stepRecorderControls.classList.add('hidden');
    DOM.screenShareBtn.disabled = false;
    DOM.finishRecordingBtn.disabled = false;
    
    const finishBtnIcon = DOM.finishRecordingBtn.querySelector('i');
    if(finishBtnIcon) finishBtnIcon.className = 'fas fa-check-circle';
    const finishBtnSpan = DOM.finishRecordingBtn.querySelector('span');
    if (finishBtnSpan) finishBtnSpan.textContent = ' Finish & Generate';
}

export async function startStepRecording() {
    if (state.isRecordingSteps) return;

    try {
        state.screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: "screen" },
        });

        state.isRecordingSteps = true;
        state.capturedSteps = [];
        DOM.screenShareBtn.disabled = true;
        DOM.stepRecorderControls.classList.remove('hidden');

        // Listen for user stopping the share via browser UI
        state.screenStream.getVideoTracks()[0].onended = () => {
            if (state.isRecordingSteps) {
                finishStepRecording();
            }
        };

    } catch (error) {
        console.error("Error starting screen share:", error);
        cleanupRecording();
    }
}

export async function captureStep() {
    if (!state.screenStream) return;
    
    const videoTrack = state.screenStream.getVideoTracks()[0];
    const imageCapture = new window.ImageCapture(videoTrack);
    
    try {
        const frame = await imageCapture.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = frame.width;
        canvas.height = frame.height;
        const context = canvas.getContext('2d');
        context?.drawImage(frame, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        state.capturedSteps.push({ imageData });

        // Visual feedback
        DOM.captureStepBtn.style.transform = 'scale(1.1)';
        setTimeout(() => DOM.captureStepBtn.style.transform = 'scale(1)', 150);

    } catch (error) {
        console.error("Error capturing step:", error);
    }
}

export async function finishStepRecording() {
    if (!state.isRecordingSteps || state.capturedSteps.length === 0) {
        cleanupRecording();
        return;
    }

    DOM.finishRecordingBtn.disabled = true;
    const finishBtnIcon = DOM.finishRecordingBtn.querySelector('i');
    if(finishBtnIcon) finishBtnIcon.className = 'fas fa-spinner fa-spin';
    const finishBtnSpan = DOM.finishRecordingBtn.querySelector('span');
    if (finishBtnSpan) finishBtnSpan.textContent = ' Generating...';


    const messageEl = addMessage(state.activeChannel, 'user', '');
    messageEl.querySelector('.message-text').innerHTML = `
        <div class="placeholder" style="display: flex; align-items: center; gap: 10px;">
            <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
            <p>Generating step-by-step guide from ${state.capturedSteps.length} steps...</p>
        </div>
    `;

    try {
        const guide = await generateGuideFromSteps(state.capturedSteps);
        renderGuideInChat(guide, messageEl);
    } catch (error) {
        console.error("Failed to generate guide:", error);
        messageEl.querySelector('.message-text').textContent = 'An error occurred while generating the guide.';
    } finally {
        cleanupRecording();
    }
}

export function cancelStepRecording() {
    cleanupRecording();
}

function renderGuideInChat(guide, messageElToUpdate) {
    let stepsHtml = guide.map((step, index) => `
        <div class="guide-step">
            <div class="step-number">${index + 1}</div>
            <div class="step-details">
                <p class="step-description">${step.description}</p>
                <img src="${step.imageData}" alt="Step ${index + 1} Screenshot" class="step-screenshot"/>
            </div>
        </div>
    `).join('');

    const guideHtml = `
        <div class="how-to-guide-wrapper">
            <div class="how-to-guide-content">
                <h4 class="guide-title"><i class="fas fa-list-ol"></i> How-To Guide</h4>
                ${stepsHtml}
            </div>
        </div>
    `;
    
    messageElToUpdate.querySelector('.message-text').innerHTML = guideHtml;
    DOM.messagesList.scrollTop = DOM.messagesList.scrollHeight;
}
