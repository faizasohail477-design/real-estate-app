// Admin Login Form
document.getElementById("adminLoginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");

    message.style.color = "black";
    message.innerText = "Logging in...";

    try {
        const res = await fetch(API_BASE + "/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("adminUser", data.user);
            message.style.color = "green";
            message.innerText = "Login successful!";
            window.location.href = "dashboard.html";
        } else {
            message.style.color = "red";
            message.innerText = data.message || "Username ya password galat hai.";
        }
    } catch (error) {
        message.style.color = "red";
        message.innerText = "Server error. Try again.";
        console.error(error);
    }
});

// Password Show/Hide Toggle
const togglePassword = document.querySelector('#togglePassword');
const passwordField = document.querySelector('#password');

if (togglePassword && passwordField) {
    togglePassword.addEventListener('click', function() {
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}
