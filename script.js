document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.querySelector('.app-container');
    const channelsList = document.getElementById('channels-list');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messagesList = document.getElementById('messages-list');
    const chatHeaderTitle = document.getElementById('chat-header-title');
    const backBtn = document.querySelector('.back-btn');

    // Mock data for demonstration
    const mockMessages = {
        'project-phoenix': [
            { sender: 'Client A', avatar: 'https://i.pravatar.cc/40?u=client-a', text: 'Hey team, any updates on the new designs?', time: '10:30 AM' },
            { sender: 'Service Provider', avatar: 'https://i.pravatar.cc/40?u=user', text: 'Yes! Just pushed them to the staging server. Let me know your thoughts.', time: '10:32 AM' },
        ],
        'acme-corp': [
            { sender: 'Mr. Acme', avatar: 'https://i.pravatar.cc/40?u=acme', text: 'Do we have a timeline for the Q3 feature rollout?', time: '11:00 AM' },
        ],
        'general': [
            { sender: 'Service Provider', avatar: 'https://i.pravatar.cc/40?u=user', text: 'Welcome everyone! This is the general channel for announcements.', time: '9:00 AM' },
        ],
        'internal-dev': [
             { sender: 'Dev Team', avatar: 'https://i.pravatar.cc/40?u=dev', text: 'I think I found the bug in the authentication flow.', time: 'Yesterday' },
        ]
    };
    
    let currentChannel = 'project-phoenix';

    function renderMessages(channel) {
        messagesList.innerHTML = '';
        const channelMessages = mockMessages[channel] || [];
        channelMessages.forEach(msg => {
            const messageEl = createMessageElement(msg.sender, msg.avatar, msg.text, msg.time);
            messagesList.appendChild(messageEl);
        });
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    function createMessageElement(sender, avatar, text, time) {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message');
        messageEl.innerHTML = `
            <img src="${avatar}" alt="${sender}" class="avatar">
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${sender}</span>
                    <span class="message-timestamp">${time}</span>
                </div>
                <p class="message-text">${text}</p>
            </div>
        `;
        return messageEl;
    }

    function switchChannel(e) {
        const targetChannel = e.currentTarget;
        if (targetChannel.dataset.channelName.toLowerCase().replace(/ /g, '-') === currentChannel) {
            // If on mobile and clicking the same channel, still show the chat view
            if (window.innerWidth < 768) {
                appContainer.classList.add('chat-view-active');
            }
            return;
        };

        // Update active class
        document.querySelector('.channel.active').classList.remove('active');
        targetChannel.classList.add('active');

        // Update channel state
        const channelName = targetChannel.dataset.channelName;
        const channelSlug = channelName.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
        currentChannel = channelSlug;

        // Update UI
        const readableChannelName = `# ${channelName}`;
        chatHeaderTitle.textContent = readableChannelName;
        messageInput.placeholder = `Message ${readableChannelName}`;
        renderMessages(currentChannel);
        
        // Show chat view on mobile
        appContainer.classList.add('chat-view-active');
    }
    
    channelsList.querySelectorAll('.channel').forEach(channel => {
        channel.addEventListener('click', switchChannel);
    });

    backBtn.addEventListener('click', () => {
        appContainer.classList.remove('chat-view-active');
    });

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (text) {
            const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const messageEl = createMessageElement('Service Provider', 'https://i.pravatar.cc/40?u=user', text, time);
            messagesList.appendChild(messageEl);
            messagesList.scrollTop = messagesList.scrollHeight;
            messageInput.value = '';
        }
    });

    // Placeholder actions for header buttons
    document.getElementById('video-call-btn').addEventListener('click', () => alert('Video call feature coming soon!'));
    document.getElementById('screen-share-btn').addEventListener('click', () => alert('Screen share feature coming soon!'));
    document.getElementById('record-btn').addEventListener('click', () => alert('Recording feature coming soon!'));
    document.getElementById('file-share-btn').addEventListener('click', () => alert('File sharing feature coming soon! Click to select a file (UI only).'));

    // Initial load
    renderMessages(currentChannel);
});