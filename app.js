// Firebase configuration from your prompt
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0dQtToOsQD6Luv0YOmeethDO5kyimSKA",
  authDomain: "abpclass-7c802.firebaseapp.com",
  projectId: "abpclass-7c802",
  storageBucket: "abpclass-7c802.appspot.com",
  messagingSenderId: "841554153669",
  appId: "1:841554153669:web:6c9d4d84bf521c531b60ac",
  measurementId: "G-Y8HBFK4EV3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- DOM Elements ---
const loginForm = document.getElementById('loginForm');
const signupButton = document.getElementById('signupButton');
const contactForm = document.getElementById('contactForm');
const courseListDiv = document.querySelector('.course-list');
const enrollNowButton = document.getElementById('enrollNow');

// --- Functions for Firebase Interactions ---

// Function to handle user signup (example)
async function handleSignup(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User signed up:', userCredential.user);
        alert('Signup successful! Please login.');
        // Optionally redirect or show login form
    } catch (error) {
        console.error('Error signing up:', error.message);
        alert('Error signing up: ' + error.message);
    }
}

// Function to handle user login
async function handleLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCredential.user);
        alert('Login successful!');
        // Redirect to a dashboard or show logged-in content
        // Example: hide login section, show a welcome message
        document.querySelector('.login-section').style.display = 'none';
        // You might want to update the navigation bar to show "Logout" instead of "Login"
    } catch (error) {
        console.error('Error logging in:', error.message);
        alert('Error logging in: ' + error.message);
    }
}

// Function to handle user logout
async function handleLogout() {
    try {
        await signOut(auth);
        console.log('User logged out');
        alert('Logged out successfully.');
        // Redirect to home page or show login form
        // Example: show login section
        document.querySelector('.login-section').style.display = 'block';
    } catch (error) {
        console.error('Error logging out:', error.message);
        alert('Error logging out: ' + error.message);
    }
}

// Function to add a contact message to Firestore
async function addContactMessage(name, email, message) {
    try {
        const docRef = await addDoc(collection(db, "contactMessages"), {
            name: name,
            email: email,
            message: message,
            timestamp: new Date()
        });
        console.log("Contact message written with ID: ", docRef.id);
        alert('Your message has been sent!');
        contactForm.reset(); // Clear the form
    } catch (e) {
        console.error("Error adding document: ", e);
        alert('There was an error sending your message. Please try again.');
    }
}

// Function to fetch and display courses from Firestore
async function fetchCourses() {
    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        courseListDiv.innerHTML = ''; // Clear previous courses
        querySnapshot.forEach((doc) => {
            const course = doc.data();
            const courseItem = document.createElement('div');
            courseItem.classList.add('course-item');
            courseItem.innerHTML = `
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <p><strong>Duration:</strong> ${course.duration}</p>
                <p><strong>Price:</strong> ${course.price}</p>
                <button>Learn More</button>
            `;
            courseListDiv.appendChild(courseItem);
        });
    } catch (error) {
        console.error("Error fetching courses: ", error);
        courseListDiv.innerHTML = '<p>Error loading courses. Please try again later.</p>';
    }
}

// --- Event Listeners ---

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.loginEmail.value;
        const password = loginForm.loginPassword.value;
        handleLogin(email, password);
    });
}

// Handle signup button click (redirect or show signup form)
if (signupButton) {
    signupButton.addEventListener('click', () => {
        alert('Signup functionality needs to be implemented. For now, use the login form.');
        // In a real application, you would typically show a signup modal or redirect to a signup page.
        // For example:
        // window.location.href = 'signup.html';
    });
}

// Handle contact form submission
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = contactForm.name.value;
        const email = contactForm.email.value;
        const message = contactForm.message.value;
        addContactMessage(name, email, message);
    });
}

// Handle "Enroll Now" button click
if (enrollNowButton) {
    enrollNowButton.addEventListener('click', () => {
        // Smooth scroll to the courses section
        document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
    });
}

// --- Initial Data Loading ---
document.addEventListener('DOMContentLoaded', () => {
    fetchCourses(); // Load courses when the page loads

    // Check for user authentication status on page load
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User is logged in:', user.email);
            // Update UI to show logged-in state (e.g., "Logout" button)
            // Example:
            // const loginNavLink = document.querySelector('nav ul li a[href="#login"]');
            // if (loginNavLink) {
            //     loginNavLink.textContent = 'Logout';
            //     loginNavLink.id = 'logoutNavLink'; // Add an ID for easy targeting
            //     loginNavLink.removeEventListener('click', /* previous login handler */);
            //     loginNavLink.addEventListener('click', handleLogout);
            // }
            // Hide login section if user is logged in
            document.querySelector('.login-section').style.display = 'none';
        } else {
            console.log('No user is logged in');
            // Update UI to show logged-out state (e.g., "Login" button)
            // Example:
            // const logoutNavLink = document.getElementById('logoutNavLink');
            // if (logoutNavLink) {
            //     logoutNavLink.textContent = 'Login';
            //     logoutNavLink.href = '#login';
            //     logoutNavLink.removeEventListener('click', handleLogout);
            //     logoutNavLink.addEventListener('click', /* add login handler */);
            //     logoutNavLink.removeAttribute('id');
            // }
            document.querySelector('.login-section').style.display = 'block';
        }
    });
});

// Example of how you might add a course directly through the console for testing:
// import { db, auth } from './app.js'; // Import if running this outside of the module
// import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// async function addInitialCourse() {
//     try {
//         await addDoc(collection(db, "courses"), {
//             title: "Web Development Basics",
//             description: "Learn HTML, CSS, JavaScript, and more!",
//             duration: "3 Months",
//             price: "$299"
//         });
//         await addDoc(collection(db, "courses"), {
//             title: "Data Science with Python",
//             description: "Master Python for data analysis and machine learning.",
//             duration: "4 Months",
//             price: "$399"
//         });
//         console.log("Initial courses added!");
//     } catch (e) {
//         console.error("Error adding initial courses: ", e);
//     }
// }
// addInitialCourse();
