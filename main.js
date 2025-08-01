import { initializeEventListeners } from './events.js';
import { initializeUI } from './ui.js';

/**
 * Main entry point for the application.
 * This runs after the DOM is fully loaded, ensuring all elements are available.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Set up the initial state of the user interface
    initializeUI();
    // Attach all necessary event listeners to make the UI interactive
    initializeEventListeners();
});
