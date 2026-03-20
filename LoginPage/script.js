/**
 * Lost and Found Login Page - JavaScript Functionality
 * Handles Sign In, Sign Up, Forgot Password, and Help Links
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  
  // ============================================
  // DOM ELEMENT REFERENCES
  // ============================================
  const signinForm = document.getElementById('signinForm');
  const signUpBtn = document.getElementById('signUpBtn');
  const forgotLink = document.getElementById('forgotPasswordLink');
  const feedbackDiv = document.getElementById('formFeedback');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const helpLinks = document.querySelectorAll('.help-link-item');
  
  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  /**
   * Display a temporary toast message
   * @param {string} text - Message to display
   * @param {boolean} isError - Whether this is an error message (affects styling)
   */
  function showMessage(text, isError = false) {
    feedbackDiv.innerText = text;
    feedbackDiv.classList.add('show');
    
    // Set style based on message type
    if (isError) {
      feedbackDiv.style.backgroundColor = "#bc5a3c";
      feedbackDiv.style.color = "white";
    } else {
      feedbackDiv.style.backgroundColor = "#2c5a70";
      feedbackDiv.style.color = "white";
    }
    
    // Auto-hide after 2.8 seconds
    setTimeout(() => {
      feedbackDiv.classList.remove('show');
      setTimeout(() => {
        feedbackDiv.style.backgroundColor = "#2c5a70";
      }, 300);
    }, 2800);
  }
  
  /**
   * Validate login form inputs
   * @returns {boolean} True if validation passes, false otherwise
   */
  function validateLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (username === "") {
      showMessage("❓ Please enter your username", true);
      usernameInput.focus();
      return false;
    }
    
    if (password === "") {
      showMessage("🔒 Password cannot be empty", true);
      passwordInput.focus();
      return false;
    }
    
    return true;
  }
  
  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  /**
   * Handle Sign In form submission
   * @param {Event} e - Submit event
   */
  function handleSignIn(e) {
    e.preventDefault();
    
    if (validateLogin()) {
      const user = usernameInput.value.trim();
      showMessage(`✨ Welcome back, ${user}! (demo login successful)`);
      // In a real application, you would send credentials to a backend API here
    }
  }
  
  /**
   * Handle Sign Up button click
   */
  function handleSignUp() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (username === "") {
      showMessage("📝 Please enter a username to sign up", true);
      usernameInput.focus();
      return;
    }
    
    if (password === "") {
      showMessage("🔐 Please choose a password to sign up", true);
      passwordInput.focus();
      return;
    }
    
    showMessage(`🎉 Sign up simulation for "${username}". Complete registration form would appear here.`);
    console.log(`Sign up requested with username: ${username}`);
  }
  
  /**
   * Handle Forgot Password link click
   */
  function handleForgot() {
    const userHint = usernameInput.value.trim();
    
    if (userHint !== "") {
      showMessage(`📧 Password reset link sent to email associated with "${userHint}" (demo)`);
    } else {
      showMessage(`🔑 Please enter your username first to reset password`, true);
      usernameInput.focus();
    }
  }
  
  /**
   * Handle Help/Documentation link clicks
   * @param {Event} e - Click event
   */
  function handleHelpLink(e) {
    e.preventDefault();
    const linkText = e.currentTarget.getAttribute('data-help') || e.currentTarget.innerText.trim();
    showMessage(`ℹ️ ${linkText} page — demo information (coming soon)`);
  }
  
  // ============================================
  // EVENT LISTENER ATTACHMENT
  // ============================================
  
  // Sign In form submission
  signinForm.addEventListener('submit', handleSignIn);
  
  // Sign Up button
  signUpBtn.addEventListener('click', handleSignUp);
  
  // Forgot Password link
  forgotLink.addEventListener('click', function(e) {
    e.preventDefault();
    handleForgot();
  });
  
  // Help/Documentation links (Customer Support, Terms & Conditions, Privacy Policy)
  helpLinks.forEach(link => {
    link.addEventListener('click', handleHelpLink);
  });
  
  // Optional: Allow Enter key on username/password fields to submit form
  // This is automatically handled by the form submission
  
  // Console log to confirm initialization
  console.log('Login page initialized — all event handlers attached');
});