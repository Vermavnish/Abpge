// Firebase configuration (already present, just ensure it's at the top)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0dQtToOsQD6Luv0YOmeethDO5kyimSKA",
  authDomain: "abpclass-7c802.firebaseapp.com",
  projectId: "abpclass-7c802",
  storageBucket: "abpclass-7c802.appspot.com",
  messagingSenderId: "841554153669",
  appId: "1:841554153669:web:6c9d4d84bf521c531b60ac",
  measurementId: "G-Y8HBFK4EV3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- Re-used Firebase Interaction Functions ---

async function handleSignup(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User signed up successfully:', userCredential.user.email);
        alert('Signup successful! You can now log in.');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error signing up:', error.message);
        alert('Error signing up: ' + error.message);
    }
}

async function handleLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in successfully:', userCredential.user.email);
        alert('Login successful!');
        // Check if the logged-in user is the admin
        if (userCredential.user && userCredential.user.email === 'admin@abp.com') {
            window.location.href = 'admin.html'; // Redirect to admin panel if admin
        } else {
            window.location.href = 'index.html'; // Redirect to home page for regular users
        }
    } catch (error) {
        console.error('Error logging in:', error.message);
        alert('Error logging in: ' + error.message);
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        console.log('User logged out successfully.');
        alert('Logged out successfully.');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging out:', error.message);
        alert('Error logging out: ' + error.message);
    }
}

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
            contactForm.reset();
        }
    } catch (e) {
        console.error("Error adding contact message: ", e);
        alert('There was an error sending your message. Please try again.');
    }
}

async function fetchCourses() {
    const courseListDiv = document.querySelector('.course-list');
    if (!courseListDiv) return;

    courseListDiv.innerHTML = '<p>Loading courses...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        if (querySnapshot.empty) {
            courseListDiv.innerHTML = '<p>No courses are available at the moment. Please check back later!</p>';
            return;
        }

        courseListDiv.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const course = doc.data();
            const courseItem = document.createElement('div');
            courseItem.classList.add('course-item');
            courseItem.innerHTML = `
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <p><strong>Duration:</strong> ${course.duration}</p>
                <p><strong>Price:</strong> $${course.price}</p>
                <button>View Details</button>
            `;
            courseListDiv.appendChild(courseItem);
        });
    } catch (error) {
        console.error("Error fetching courses: ", error);
        courseListDiv.innerHTML = '<p>Error loading courses. Please try again later.</p>';
    }
}

// --- Admin Panel Specific Functions ---

/**
 * Checks if the current user is an admin based on email.
 * IMPORTANT: This client-side check is NOT sufficient for full security.
 * Firebase Security Rules MUST be used to protect sensitive data on the backend.
 * @param {object} user - The Firebase User object.
 * @returns {boolean} - True if the user's email matches the admin email, false otherwise.
 */
function checkIfUserIsAdmin(user) {
    // For this demo, we're checking a specific admin email.
    // In a production app, consider Firebase Custom Claims for better security.
    const ADMIN_EMAIL = 'admin@abp.com';
    return user && user.email === ADMIN_EMAIL;
}

async function fetchAndDisplayCoursesForAdmin() {
    const courseListAdmin = document.getElementById('courseListAdmin');
    if (!courseListAdmin) return;

    courseListAdmin.innerHTML = '<p>Loading courses for admin...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        if (querySnapshot.empty) {
            courseListAdmin.innerHTML = '<p>No courses available to manage.</p>';
            return;
        }

        courseListAdmin.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const course = docSnap.data();
            const courseId = docSnap.id;
            const courseItem = document.createElement('div');
            courseItem.classList.add('data-item');
            courseItem.innerHTML = `
                <div>
                    <p><strong>Title:</strong> ${course.title}</p>
                    <p><strong>Description:</strong> ${course.description}</p>
                    <p><strong>Duration:</strong> ${course.duration}</p>
                    <p><strong>Price:</strong> $${course.price}</p>
                </div>
                <div class="actions">
                    <button class="edit-course-btn" data-id="${courseId}">Edit</button>
                    <button class="delete-course-btn" data-id="${courseId}">Delete</button>
                </div>
                <div class="edit-fields" style="display:none; width: 100%;">
                    <input type="text" value="${course.title}" placeholder="Title" data-field="title">
                    <textarea placeholder="Description" data-field="description">${course.description}</textarea>
                    <input type="text" value="${course.duration}" placeholder="Duration" data-field="duration">
                    <input type="number" value="${course.price}" placeholder="Price" data-field="price">
                    <button class="save-edit-btn" data-id="${courseId}">Save</button>
                    <button class="cancel-edit-btn" data-id="${courseId}">Cancel</button>
                </div>
            `;
            courseListAdmin.appendChild(courseItem);
        });

        // Add event listeners for edit/delete/save/cancel
        courseListAdmin.querySelectorAll('.edit-course-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const item = e.target.closest('.data-item');
                item.querySelector('.edit-fields').style.display = 'block';
                e.target.style.display = 'none'; // Hide edit button
                item.querySelector('.delete-course-btn').style.display = 'none'; // Hide delete button
            });
        });

        courseListAdmin.querySelectorAll('.cancel-edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const item = e.target.closest('.data-item');
                item.querySelector('.edit-fields').style.display = 'none';
                item.querySelector('.edit-course-btn').style.display = 'inline-block';
                item.querySelector('.delete-course-btn').style.display = 'inline-block';
            });
        });

        courseListAdmin.querySelectorAll('.save-edit-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const courseId = e.target.dataset.id;
                const item = e.target.closest('.data-item');
                const newTitle = item.querySelector('[data-field="title"]').value;
                const newDescription = item.querySelector('[data-field="description"]').value;
                const newDuration = item.querySelector('[data-field="duration"]').value;
                const newPrice = item.querySelector('[data-field="price"]').value;

                if (confirm('Are you sure you want to update this course?')) {
                    await updateCourse(courseId, {
                        title: newTitle,
                        description: newDescription,
                        duration: newDuration,
                        price: parseFloat(newPrice)
                    });
                    fetchAndDisplayCoursesForAdmin(); // Re-fetch to update UI
                }
            });
        });

        courseListAdmin.querySelectorAll('.delete-course-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const courseId = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
                    await deleteCourse(courseId);
                    fetchAndDisplayCoursesForAdmin(); // Re-fetch to update UI
                }
            });
        });

    } catch (error) {
        console.error("Error fetching courses for admin: ", error);
        courseListAdmin.innerHTML = '<p>Error loading courses for management.</p>';
    }
}

async function addCourse(title, description, duration, price) {
    try {
        await addDoc(collection(db, "courses"), {
            title,
            description,
            duration,
            price: parseFloat(price) // Ensure price is a number
        });
        alert('Course added successfully!');
        document.getElementById('addCourseForm').reset();
        fetchAndDisplayCoursesForAdmin(); // Refresh the list
    } catch (e) {
        console.error("Error adding course: ", e);
        alert('Error adding course: ' + e.message);
    }
}

async function updateCourse(id, newData) {
    try {
        const courseRef = doc(db, "courses", id);
        await updateDoc(courseRef, newData);
        alert('Course updated successfully!');
    } catch (e) {
        console.error("Error updating course: ", e);
        alert('Error updating course: ' + e.message);
    }
}

async function deleteCourse(id) {
    try {
        const courseRef = doc(db, "courses", id);
        await deleteDoc(courseRef);
        alert('Course deleted successfully!');
    } catch (e) {
        console.error("Error deleting course: ", e);
        alert('Error deleting course: ' + e.message);
    }
}

async function fetchAndDisplayMessages() {
    const messageListAdmin = document.getElementById('messageListAdmin');
    if (!messageListAdmin) return;

    messageListAdmin.innerHTML = '<p>Loading messages...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "contactMessages"));
        if (querySnapshot.empty) {
            messageListAdmin.innerHTML = '<p>No contact messages received yet.</p>';
            return;
        }

        messageListAdmin.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const message = docSnap.data();
            const timestamp = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleString() : 'N/A';
            const messageItem = document.createElement('div');
            messageItem.classList.add('message-item');
            messageItem.innerHTML = `
                <p><strong>From:</strong> ${message.name} (${message.email})</p>
                <p><strong>Message:</strong> ${message.message}</p>
                <small>Received: ${timestamp}</small>
                `;
            messageListAdmin.appendChild(messageItem);
        });
    } catch (error) {
        console.error("Error fetching messages: ", error);
        messageListAdmin.innerHTML = '<p>Error loading messages.</p>';
    }
}

async function fetchAndDisplayUsers() {
    const userListAdmin = document.getElementById('userListAdmin');
    if (!userListAdmin) return;

    userListAdmin.innerHTML = '<p>Fetching user data...</p>';
    // Note: To list all users securely, you would typically use the Firebase Admin SDK
    // on a backend server, as direct client-side access to all user UIDs is not permitted for security.
    // This example will just show the currently logged-in admin user.
    onAuthStateChanged(auth, (user) => {
        if (user && checkIfUserIsAdmin(user)) {
            userListAdmin.innerHTML = `
                <div class="data-item">
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>UID:</strong> ${user.uid}</p>
                    <p><strong>Verified:</strong> ${user.emailVerified ? 'Yes' : 'No'}</p>
                </div>
            `;
        } else {
            userListAdmin.innerHTML = '<p>No admin user is currently logged in or user data cannot be fetched.</p>';
        }
    });
}


// --- Main DOM Content Loaded Event Listener ---
document.addEventListener('DOMContentLoaded', () => {
    // Universal Authentication State Listener for Navigation Bar
    onAuthStateChanged(auth, (user) => {
        const loginNavLink = document.querySelector('nav ul li a[href="login.html"], nav ul li a[data-auth="true"]');
        if (loginNavLink) {
            if (user) {
                loginNavLink.textContent = 'Logout';
                loginNavLink.href = '#';
                loginNavLink.setAttribute('data-auth', 'true');
                loginNavLink.removeEventListener('click', handleLogout);
                loginNavLink.addEventListener('click', handleLogout);
            } else {
                loginNavLink.textContent = 'Login';
                loginNavLink.href = 'login.html';
                loginNavLink.removeAttribute('data-auth');
                loginNavLink.removeEventListener('click', handleLogout);
            }
        }

        // Admin Panel Specific Redirect (Protect admin.html)
        if (window.location.pathname.includes('admin.html')) {
            const adminWelcomeMessage = document.getElementById('adminWelcomeMessage');
            if (!user) { // If no user is logged in
                alert('You must be logged in to access the admin panel.');
                window.location.href = 'login.html'; // Redirect to login page
            } else if (!checkIfUserIsAdmin(user)) { // If logged in, but not admin@abp.com
                alert('You do not have administrative privileges to access this page.');
                window.location.href = 'index.html'; // Redirect away if not admin
            } else {
                // User is the admin, load admin content
                if (adminWelcomeMessage) {
                    adminWelcomeMessage.textContent = `Welcome, Admin (${user.email})!`;
                }
                fetchAndDisplayCoursesForAdmin();
                fetchAndDisplayMessages();
                fetchAndDisplayUsers();

                const adminLogoutBtn = document.getElementById('adminLogoutBtn');
                if (adminLogoutBtn) {
                    adminLogoutBtn.addEventListener('click', handleLogout);
                }
            }
        }
    });

    // --- Home Page Logic (index.html) ---
    const enrollNowButton = document.getElementById('enrollNowBtn');
    if (enrollNowButton) {
        enrollNowButton.addEventListener('click', () => {
            window.location.href = 'courses.html';
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

    // --- Admin Panel Form Submissions (admin.html) ---
    const addCourseForm = document.getElementById('addCourseForm');
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = addCourseForm.courseTitle.value;
            const description = addCourseForm.courseDescription.value;
            const duration = addCourseForm.courseDuration.value;
            const price = addCourseForm.coursePrice.value;
            addCourse(title, description, duration, price);
        });
    }
});

