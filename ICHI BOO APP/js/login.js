// js/login.js
function login() {
  const enteredPin = document.getElementById("adminPassword").value.trim();
  
  // Find user by PIN from the employees array in database.js
  const user = employees.find(e => e.pin === enteredPin);
  
  if (user) {
    sessionStorage.setItem("userLogged", "yes");
    sessionStorage.setItem("userRole", user.role.toLowerCase()); 
    sessionStorage.setItem("userName", user.name);
    
    window.location.href = "dashboard.html";
  } else {
    alert("Incorrect PIN. Please try again.");
  }
}