// Firebase configuration
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

// --- Firebase Interaction Functions ---

/**
 * Handles user signup.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 */
async function handleSignup(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User signed up successfully:', userCredential.user.email);
        alert('Signup successful! You can now log in.');
        window.location.href = 'login.html'; // Redirect to login page
    } catch (error) {
        console.error('Error signing up:', error.message);
        alert('Error signing up: ' + error.message);
    }
}

/**
 * Handles user login.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 */
async function handleLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in successfully:', userCredential.user.email);
        alert('Login successful!');
        window.location.href = 'index.html'; // Redirect to home page after login
    } catch (error) {
        console.error('Error logging in:', error.message);
        alert('Error logging in: ' + error.message);
    }
}

/**
 * Handles user logout.
 */
async function handleLogout() {
    try {
        await signOut(auth);
        console.log('User logged out successfully.');
        alert('Logged out successfully.');
        window.location.href = 'index.html'; // Redirect to home page after logout
    } catch (error) {
        console.error('Error logging out:', error.message);
        alert('Error logging out: ' + error.message);
    }
}

/**
 * Adds a contact message to Firestore.
 * @param {string} name - Sender's name.
 * @param {string} email - Sender's email.
 * @param {string} message - The message content.
 */
async function addContactMessage(name, email, message) {
    try {
        const docRef = await addDoc(collection(db, "contactMessages"), {
            name: name,
            email: email,
            message: message,
            timestamp: new Date()
        });
        console.log("Contact message written with ID: ", docRef.id);
        alert('Your message has been sent successfully!');
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.reset(); // Clear the form
        }
    } catch (e) {
        console.error("Error adding contact message: ", e);
        alert('There was an error sending your message. Please try again.');
    }
}

/**
 * Fetches and displays courses from Firestore on the courses page.
 */
async function fetchCourses() {
    const courseListDiv = document.querySelector('.course-list');
    if (!courseListDiv) return; // Exit if not on the courses page

    courseListDiv.innerHTML = '<p>Loading courses...</p>'; // Show loading message

    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        if (querySnapshot.empty) {
            courseListDiv.innerHTML = '<p>No courses are available at the moment. Please check back later!</p>';
            return;
        }

        courseListDiv.innerHTML = ''; // Clear loading message
        querySnapshot.forEach((doc) => {
            const course = doc.data();
            const courseItem = document.createElement('div');
            courseItem.classList.add('course-item');
            courseItem.innerHTML = `
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <p><strong>Duration:</strong> ${course.duration}</p>
                <p><strong>Price:</strong> ${course.price}</p>
                <button>View Details</button>
            `;
            courseListDiv.appendChild(courseItem);
        });
    } catch (error) {
        console.error("Error fetching courses: ", error);
        courseListDiv.innerHTML = '<p>Error loading courses. Please try again later.</p>';
    }
}

// --- Event Listeners and Page-Specific Logic ---

document.addEventListener('DOMContentLoaded', () => {
    // Universal Authentication State Listener for Navigation Bar
    // This runs on every page load to update the "Login/Logout" link
    onAuthStateChanged(auth, (user) => {
        const loginNavLink = document.querySelector('nav ul li a[href="login.html"], nav ul li a[data-auth="true"]');
        if (loginNavLink) {
            if (user) {
                // User is logged in
                loginNavLink.textContent = 'Logout';
                loginNavLink.href = '#'; // Change href to a dummy value or remove for logout
                loginNavLink.setAttribute('data-auth', 'true'); // Custom attribute to track state
                // Remove existing click listener to avoid duplicates if user logs in/out multiple times on same page
                loginNavLink.removeEventListener('click', handleLogout); // Remove previous logout listener
                loginNavLink.addEventListener('click', handleLogout); // Add logout handler
            } else {
                // No user is logged in
                loginNavLink.textContent = 'Login';
                loginNavLink.href = 'login.html';
                loginNavLink.removeAttribute('data-auth');
                loginNavLink.removeEventListener('click', handleLogout); // Ensure no logout listener if not logged in
            }
        }
    });

    // --- Home Page Logic (index.html) ---
    const enrollNowButton = document.getElementById('enrollNowBtn');
    if (enrollNowButton) {
        enrollNowButton.addEventListener('click', () => {
            window.location.href = 'courses.html'; // Redirect to courses page
        });
    }

    // --- Contact Page Logic (contact.html) ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = contactForm.contactName.value;
            const email = contactForm.contactEmail.value;
            const message = contactForm.contactMessage.value;
            addContactMessage(name, email, message);
        });
    }

    // --- Courses Page Logic (courses.html) ---
    // The fetchCourses() function is called when the DOM is loaded,
    // but only if the '.courses-section' element is present.
    if (document.querySelector('.courses-section')) {
        fetchCourses();
    }

    // --- Login/Sign Up Page Logic (login.html) ---
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const signupRedirectBtn = document.getElementById('signupRedirectBtn');
    const loginRedirectBtn = document.getElementById('loginRedirectBtn');
    const signupSection = document.getElementById('signupSection');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.loginEmail.value;
            const password = loginForm.loginPassword.value;
            handleLogin(email, password);
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = signupForm.signupEmail.value;
            const password = signupForm.signupPassword.value;
            handleSignup(email, password);
        });
    }

    if (signupRedirectBtn) {
        signupRedirectBtn.addEventListener('click', () => {
            if (loginForm) loginForm.style.display = 'none';
            if (signupSection) signupSection.style.display = 'block';
        });
    }

    if (loginRedirectBtn) {
        loginRedirectBtn.addEventListener('click', () => {
            if (signupSection) signupSection.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
        });
    }
});

// --- Example for adding initial courses (run once in Firebase console or locally for testing) ---
// You only need to run this code ONCE to populate your Firestore 'courses' collection.
// You can uncomment it and run it in your browser's console while on any page,
// or create a temporary script to run it. Make sure you have the 'db' import if running separately.
/*
import { db } from './app.js'; // Ensure db is imported if running outside of app.js context
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function addDemoCourses() {
    try {
        await addDoc(collection(db, "courses"), {
            title: "Web Development Fundamentals",
            description: "Learn the basics of HTML, CSS, and JavaScript to build responsive websites.",
            duration: "3 Months",
            price: "$299"
        });
        await addDoc(collection(db, "courses"), {
            title: "Data Science with Python",
            description: "Master data analysis, visualization, and machine learning using Python.",
            duration: "4 Months",
            price: "$399"
        });
        await addDoc(collection(db, "courses"), {
            title: "Advanced Java Programming",
            description: "Dive deep into Java concepts, object-oriented programming, and enterprise applications.",
            duration: "5 Months",
            price: "$499"
        });
        await addDoc(collection(db, "courses"), {
            title: "Competitive Programming",
            description: "Enhance your problem-solving and algorithmic skills for coding contests.",
            duration: "2 Months",
            price: "$199"
        });
        console.log("Demo courses added to Firestore!");
    } catch (e) {
        console.error("Error adding demo courses: ", e);
    }
}
// Call this function once if you want to add demo data
// addDemoCourses();
*/
