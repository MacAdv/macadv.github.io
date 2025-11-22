/* dashboard.js */

(function() {
  // 1. Prevent Duplicate Listeners
  // If this script runs multiple times (e.g., you click between different dashboards),
  // this flag prevents us from attaching the click event twice.
  if (window.slateDashboardScriptLoaded) return; 
  window.slateDashboardScriptLoaded = true;

  // 2. Event Delegation for Click-to-Copy
  // We listen on the 'document' because the table cells don't exist yet 
  // when this script first executes.
  document.addEventListener('click', function(e) {
    
    // Use .closest() to handle cases where user clicks a <span> or <b> inside the cell
    var target = e.target.closest('.field-value');
    
    if (target) {
      var val = target.innerText.trim();
      
      // Create temporary input to select and copy text
      var tempInput = document.createElement('input');
      tempInput.value = val;
      document.body.appendChild(tempInput);
      tempInput.select();
      
      try {
        document.execCommand('copy');
        
        // Visual Feedback (Flash Yellow)
        // Save original color to restore it later
        var originalColor = target.style.backgroundColor; 
        target.style.backgroundColor = '#FFB500'; // Brand Yellow
        target.style.transition = 'background-color 0.3s ease';
        
        setTimeout(function(){
          target.style.backgroundColor = originalColor || '';
        }, 300);
        
      } catch (err) {
        console.error('Copy failed:', err);
      }
      
      document.body.removeChild(tempInput);
    }
  });

  // 3. Rename Slate Profile Link (Async Safe)
  // Since the link might appear AFTER this script runs, we check for it repeatedly
  // for a short duration (2 seconds) to catch the async load.
  var attempts = 0;
  var renameInterval = setInterval(function() {
    var profileLink = document.getElementById("part_profile_link");
    if (profileLink) {
      profileLink.textContent = "Slate Profile";
      clearInterval(renameInterval); // Stop checking once found
    }
    
    attempts++;
    if (attempts > 20) clearInterval(renameInterval); // Stop checking after 2 seconds
  }, 100);

})();