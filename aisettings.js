// Dark Mode functionality
function initDarkMode() {
  // Check for saved user preference or system preference
  const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
                   (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && 
                    localStorage.getItem('darkMode') !== 'false');
  
  // Set initial state
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  }
  
  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'dark-mode-toggle';
  toggleBtn.innerHTML = isDarkMode ? 
    '<i class="fas fa-lightbulb"></i>' : 
    '<i class="fas fa-moon"></i>';
  toggleBtn.setAttribute('aria-label', isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  toggleBtn.title = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  
  // Add toggle functionality
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    toggleBtn.innerHTML = isDark ? 
      '<i class="fas fa-lightbulb"></i>' : 
      '<i class="fas fa-moon"></i>';
    toggleBtn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    toggleBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  });
  
  // Add button to the DOM
  document.body.appendChild(toggleBtn);
  
  // Listen for system preference changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (localStorage.getItem('darkMode') === null) {
        if (e.matches) {
          document.body.classList.add('dark-mode');
          toggleBtn.innerHTML = '<i class="fas fa-lightbulb"></i>';
          toggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
          toggleBtn.title = 'Switch to Light Mode';
        } else {
          document.body.classList.remove('dark-mode');
          toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
          toggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
          toggleBtn.title = 'Switch to Dark Mode';
        }
      }
    });
  }
}

// Initialize dark mode on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initDarkMode); 