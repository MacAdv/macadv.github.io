/* dashboard.js */

document.addEventListener('DOMContentLoaded', function() {
  
  // 1. Rename Slate Profile Link (if it exists)
  // Checks if element exists first to prevent console errors on other dashboards
  var profileLink = document.getElementById("part_profile_link");
  if (profileLink) {
    profileLink.textContent = "Slate Profile";
  }

  // 2. Event Delegation for Copy-to-Clipboard
  // Listens for clicks on any element with class 'field-value'
  document.addEventListener('click', function(e) {
    var target = e.target;
    
    if (target.classList.contains('field-value')) {
      var val = target.innerText;
      
      // Create temporary input to select and copy text
      var tempInput = document.createElement('input');
      tempInput.value = val;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy'); // Legacy support for older Slate contexts
      document.body.removeChild(tempInput);
      
      // Visual Feedback (Flash Yellow)
      var originalColor = target.style.backgroundColor;
      target.style.backgroundColor = '#FFB500'; // Brand Yellow
      target.style.transition = 'background-color 0.5s ease';
      
      setTimeout(function(){
        target.style.backgroundColor = originalColor || '';
      }, 500);
    }
  });

});