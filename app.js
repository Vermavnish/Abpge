// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

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
export const storage = getStorage(app);

// --- Firebase Interaction Functions (Auth, Contact, Public Courses - mostly same) ---

/**
 * Handles user signup and adds user data to Firestore.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 */
async function handleSignup(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Add user data to a 'users' collection in Firestore
        await addDoc(collection(db, "users"), {
            uid: user.uid,
            email: user.email,
            createdAt: new Date(),
        });

        console.log('User signed up successfully:', user.email);
        alert('Signup successful! You can now log in.');
        window.location.href = 'login.html';
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
        
        if (userCredential.user && userCredential.user.email === 'admin@abp.com') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
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
        window.location.href = 'index.html';
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
 * Fetches and displays courses for the public courses page.
 * No "Enroll Now" button as enrollment is admin-driven.
 */
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
        querySnapshot.forEach((docSnap) => {
            const course = docSnap.data();
            const courseItem = document.createElement('div');
            courseItem.classList.add('course-item');
            courseItem.innerHTML = `
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <p><strong>Duration:</strong> ${course.duration}</p>
                <button class="learn-more-btn" data-course-id="${docSnap.id}">Learn More</button>
            `;
            courseListDiv.appendChild(courseItem);
        });

        // Add event listeners to "Learn More" buttons
        courseListDiv.querySelectorAll('.learn-more-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                alert('Contact us or the admin to inquire about enrolling in this course.');
            });
        });

    } catch (error) {
        console.error("Error fetching courses: ", error);
        courseListDiv.innerHTML = '<p>Error loading courses. Please try again later.</p>';
    }
}

// --- Helper Functions ---

/**
 * Checks if the current user is an admin based on email.
 * IMPORTANT: This client-side check is NOT sufficient for full security.
 * Firebase Security Rules MUST be used to protect sensitive data on the backend.
 * @param {object} user - The Firebase User object.
 * @returns {boolean} - True if the user's email matches the admin email, false otherwise.
 */
function checkIfUserIsAdmin(user) {
    const ADMIN_EMAIL = 'admin@abp.com';
    return user && user.email === ADMIN_EMAIL;
}

/**
 * Uploads PDF files to Firebase Storage and returns their download URLs.
 * @param {FileList} files - The FileList object from the input.
 * @param {string} pathPrefix - The path in storage, e.g., 'course_pdfs', 'chapter_pdfs'.
 * @returns {Promise<string[]>} - A promise that resolves with an array of download URLs.
 */
async function uploadPdfs(files, pathPrefix = 'misc_pdfs') {
    const downloadUrls = [];
    if (!files || files.length === 0) {
        return downloadUrls;
    }

    for (const file of files) {
        const storageRef = ref(storage, `${pathPrefix}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        downloadUrls.push(url);
    }
    return downloadUrls;
}

// --- Admin Panel Functions ---

// Course Management
async function addCourse(title, description, duration, coursePdfs) {
    try {
        const pdf_urls = await uploadPdfs(coursePdfs, 'course_pdfs');

        await addDoc(collection(db, "courses"), {
            title,
            description,
            duration,
            pdf_urls,
            createdAt: new Date()
        });
        alert('Course added successfully!');
        document.getElementById('addCourseForm').reset();
        fetchAndDisplayCoursesForAdmin();
        populateCourseDropdowns(); // Update dropdowns
        populateUserCourseAssignment(); // Update assignment list
    } catch (e) {
        console.error("Error adding course: ", e);
        alert('Error adding course: ' + e.message);
    }
}

async function updateCourse(id, newData, newPdfFiles) {
    try {
        const courseRef = doc(db, "courses", id);
        const currentCourseDoc = await getDoc(courseRef);
        const currentPdfUrls = currentCourseDoc.exists() ? currentCourseDoc.data().pdf_urls || [] : [];

        const uploadedPdfUrls = await uploadPdfs(newPdfFiles, 'course_pdfs');
        const combinedPdfUrls = [...new Set([...currentPdfUrls, ...uploadedPdfUrls])];

        await updateDoc(courseRef, {
            ...newData,
            pdf_urls: combinedPdfUrls
        });
        alert('Course updated successfully!');
        fetchAndDisplayCoursesForAdmin();
        populateCourseDropdowns();
    } catch (e) {
        console.error("Error updating course: ", e);
        alert('Error updating course: ' + e.message);
    }
}

async function deleteCourse(id) {
    if (!confirm('Deleting a course will also delete all its subjects and chapters! Are you sure?')) {
        return;
    }
    try {
        const courseRef = doc(db, "courses", id);
        
        // Delete all subjects, chapters, and associated content
        const subjectsSnapshot = await getDocs(collection(courseRef, "subjects"));
        for (const subjectDoc of subjectsSnapshot.docs) {
            const chaptersSnapshot = await getDocs(collection(subjectDoc.ref, "chapters"));
            for (const chapterDoc of chaptersSnapshot.docs) {
                // Optionally delete PDFs from storage here, but more complex
                await deleteDoc(chapterDoc.ref); // Delete chapter
            }
            await deleteDoc(subjectDoc.ref); // Delete subject
        }

        await deleteDoc(courseRef); // Delete course
        alert('Course and all its content deleted successfully!');
        fetchAndDisplayCoursesForAdmin();
        populateCourseDropdowns();
        populateUserCourseAssignment();
    } catch (e) {
        console.error("Error deleting course: ", e);
        alert('Error deleting course: ' + e.message);
    }
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
            const pdfDisplay = course.pdf_urls && course.pdf_urls.length > 0
                ? course.pdf_urls.map(url => {
                    const fileName = url.substring(url.lastIndexOf('/') + 1, url.indexOf('?'));
                    return `<a href="${url}" target="_blank">${decodeURIComponent(fileName.split('_').slice(1).join('_'))}</a>`;
                }).join(', ')
                : 'N/A';

            const courseItem = document.createElement('div');
            courseItem.classList.add('data-item');
            courseItem.innerHTML = `
                <div>
                    <p><strong>Title:</strong> ${course.title}</p>
                    <p><strong>Description:</strong> ${course.description}</p>
                    <p><strong>Duration:</strong> ${course.duration}</p>
                    <p><strong>Course PDFs:</strong> ${pdfDisplay}</p>
                </div>
                <div class="actions">
                    <button class="edit-course-btn" data-id="${courseId}">Edit</button>
                    <button class="delete-course-btn" data-id="${courseId}">Delete</button>
                    <button class="view-subjects-btn" data-id="${courseId}">View Subjects</button>
                </div>
                <div class="edit-fields" style="display:none; width: 100%;">
                    <input type="text" value="${course.title}" placeholder="Title" data-field="title">
                    <textarea placeholder="Description" data-field="description">${course.description}</textarea>
                    <input type="text" value="${course.duration}" placeholder="Duration" data-field="duration">
                    <input type="file" multiple accept=".pdf" data-field="pdf_files_to_upload">
                    
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
                e.target.style.display = 'none';
                item.querySelector('.delete-course-btn').style.display = 'none';
                item.querySelector('.view-subjects-btn').style.display = 'none';
            });
        });

        courseListAdmin.querySelectorAll('.cancel-edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const item = e.target.closest('.data-item');
                item.querySelector('.edit-fields').style.display = 'none';
                item.querySelector('.edit-course-btn').style.display = 'inline-block';
                item.querySelector('.delete-course-btn').style.display = 'inline-block';
                item.querySelector('.view-subjects-btn').style.display = 'inline-block';
            });
        });

        courseListAdmin.querySelectorAll('.save-edit-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const courseId = e.target.dataset.id;
                const item = e.target.closest('.data-item');
                const newTitle = item.querySelector('[data-field="title"]').value;
                const newDescription = item.querySelector('[data-field="description"]').value;
                const newDuration = item.querySelector('[data-field="duration"]').value;
                const pdfFiles = item.querySelector('[data-field="pdf_files_to_upload"]').files;

                if (confirm('Are you sure you want to update this course?')) {
                    await updateCourse(courseId, {
                        title: newTitle,
                        description: newDescription,
                        duration: newDuration,
                    }, pdfFiles);
                }
            });
        });

        courseListAdmin.querySelectorAll('.delete-course-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const courseId = e.target.dataset.id;
                await deleteCourse(courseId);
            });
        });

        // Event listener for "View Subjects" button
        courseListAdmin.querySelectorAll('.view-subjects-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const courseId = e.target.dataset.id;
                document.getElementById('selectCourseForSubject').value = courseId;
                fetchAndDisplaySubjectsForAdmin(courseId);
                // Optionally scroll to subject section
                document.getElementById('addSubjectForm').scrollIntoView({ behavior: 'smooth' });
            });
        });


    } catch (error) {
        console.error("Error fetching courses for admin: ", error);
        courseListAdmin.innerHTML = '<p>Error loading courses for management.</p>';
    }
}

// Subject Management
async function addSubject(courseId, name, description, order) {
    try {
        const courseRef = doc(db, "courses", courseId);
        await addDoc(collection(courseRef, "subjects"), {
            name,
            description,
            order: parseInt(order),
            createdAt: new Date()
        });
        alert('Subject added successfully!');
        document.getElementById('addSubjectForm').reset();
        document.getElementById('selectCourseForSubject').value = courseId; // Keep course selected
        fetchAndDisplaySubjectsForAdmin(courseId); // Refresh subjects for this course
        populateChapterDropdowns(); // Update chapter dropdowns
    } catch (e) {
        console.error("Error adding subject: ", e);
        alert('Error adding subject: ' + e.message);
    }
}

async function updateSubject(courseId, subjectId, newData) {
    try {
        const subjectRef = doc(db, "courses", courseId, "subjects", subjectId);
        await updateDoc(subjectRef, {
            ...newData,
            order: parseInt(newData.order)
        });
        alert('Subject updated successfully!');
        fetchAndDisplaySubjectsForAdmin(courseId);
    } catch (e) {
        console.error("Error updating subject: ", e);
        alert('Error updating subject: ' + e.message);
    }
}

async function deleteSubject(courseId, subjectId) {
    if (!confirm('Deleting a subject will also delete all its chapters! Are you sure?')) {
        return;
    }
    try {
        const subjectRef = doc(db, "courses", courseId, "subjects", subjectId);
        
        // Delete all chapters within this subject
        const chaptersSnapshot = await getDocs(collection(subjectRef, "chapters"));
        for (const chapterDoc of chaptersSnapshot.docs) {
            // Optionally delete PDFs from storage here, but more complex
            await deleteDoc(chapterDoc.ref); // Delete chapter
        }

        await deleteDoc(subjectRef); // Delete subject
        alert('Subject and all its chapters deleted successfully!');
        fetchAndDisplaySubjectsForAdmin(courseId);
        populateChapterDropdowns();
    } catch (e) {
        console.error("Error deleting subject: ", e);
        alert('Error deleting subject: ' + e.message);
    }
}

async function fetchAndDisplaySubjectsForAdmin(courseId) {
    const subjectListAdmin = document.getElementById('subjectListAdmin');
    if (!subjectListAdmin) return;
    if (!courseId) {
        subjectListAdmin.innerHTML = '<p>Select a course to view its subjects.</p>';
        document.getElementById('selectSubjectForChapter').disabled = true; // Disable chapter subject dropdown
        return;
    }

    subjectListAdmin.innerHTML = '<p>Loading subjects...</p>';
    try {
        const subjectsRef = collection(db, "courses", courseId, "subjects");
        const querySnapshot = await getDocs(query(subjectsRef, orderBy("order"))); // Import orderBy
        if (querySnapshot.empty) {
            subjectListAdmin.innerHTML = '<p>No subjects available for this course.</p>';
            document.getElementById('selectSubjectForChapter').disabled = true;
            document.getElementById('selectSubjectForChapter').innerHTML = '<option value="">No subjects available</option>';
            return;
        }

        subjectListAdmin.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const subject = docSnap.data();
            const subjectId = docSnap.id;
            const subjectItem = document.createElement('div');
            subjectItem.classList.add('data-item');
            subjectItem.innerHTML = `
                <div>
                    <p><strong>Name:</strong> ${subject.name}</p>
                    <p><strong>Description:</strong> ${subject.description || 'N/A'}</p>
                    <p><strong>Order:</strong> ${subject.order}</p>
                </div>
                <div class="actions">
                    <button class="edit-subject-btn" data-course-id="${courseId}" data-id="${subjectId}">Edit</button>
                    <button class="delete-subject-btn" data-course-id="${courseId}" data-id="${subjectId}">Delete</button>
                    <button class="view-chapters-btn" data-course-id="${courseId}" data-id="${subjectId}">View Chapters</button>
                </div>
                <div class="edit-fields" style="display:none; width: 100%;">
                    <input type="text" value="${subject.name}" placeholder="Subject Name" data-field="name">
                    <textarea placeholder="Description" data-field="description">${subject.description || ''}</textarea>
                    <input type="number" value="${subject.order}" placeholder="Order" data-field="order">
                    
                    <button class="save-edit-subject-btn" data-course-id="${courseId}" data-id="${subjectId}">Save</button>
                    <button class="cancel-edit-subject-btn" data-id="${subjectId}">Cancel</button>
                </div>
            `;
            subjectListAdmin.appendChild(subjectItem);
        });

        subjectListAdmin.querySelectorAll('.edit-subject-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const item = e.target.closest('.data-item');
                item.querySelector('.edit-fields').style.display = 'block';
                e.target.style.display = 'none';
                item.querySelector('.delete-subject-btn').style.display = 'none';
                item.querySelector('.view-chapters-btn').style.display = 'none';
            });
        });
        subjectListAdmin.querySelectorAll('.cancel-edit-subject-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const item = e.target.closest('.data-item');
                item.querySelector('.edit-fields').style.display = 'none';
                item.querySelector('.edit-subject-btn').style.display = 'inline-block';
                item.querySelector('.delete-subject-btn').style.display = 'inline-block';
                item.querySelector('.view-chapters-btn').style.display = 'inline-block';
            });
        });
        subjectListAdmin.querySelectorAll('.save-edit-subject-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const courseId = e.target.dataset.courseId;
                const subjectId = e.target.dataset.id;
                const item = e.target.closest('.data-item');
                const newName = item.querySelector('[data-field="name"]').value;
                const newDescription = item.querySelector('[data-field="description"]').value;
                const newOrder = item.querySelector('[data-field="order"]').value;
                if (confirm('Are you sure you want to update this subject?')) {
                    await updateSubject(courseId, subjectId, { name: newName, description: newDescription, order: newOrder });
                }
            });
        });
        subjectListAdmin.querySelectorAll('.delete-subject-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const courseId = e.target.dataset.courseId;
                const subjectId = e.target.dataset.id;
                await deleteSubject(courseId, subjectId);
            });
        });

        // Event listener for "View Chapters" button
        subjectListAdmin.querySelectorAll('.view-chapters-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const courseId = e.target.dataset.courseId;
                const subjectId = e.target.dataset.id;
                document.getElementById('selectCourseForChapter').value = courseId;
                document.getElementById('selectSubjectForChapter').value = subjectId;
                fetchAndDisplayChaptersForAdmin(courseId, subjectId);
                // Optionally scroll to chapter section
                document.getElementById('addChapterForm').scrollIntoView({ behavior: 'smooth' });
            });
        });

    } catch (error) {
        console.error("Error fetching subjects for admin: ", error);
        subjectListAdmin.innerHTML = '<p>Error loading subjects for management.</p>';
    }
}

// Chapter Management
async function addChapter(courseId, subjectId, name, description, order, videoIds, chapterPdfs) {
    try {
        const subjectRef = doc(db, "courses", courseId, "subjects", subjectId);
        const video_urls = videoIds.split(',').map(id => id.trim()).filter(id => id);
        const pdf_urls = await uploadPdfs(chapterPdfs, `chapter_pdfs/${courseId}/${subjectId}`);

        await addDoc(collection(subjectRef, "chapters"), {
            name,
            description,
            order: parseInt(order),
            video_urls,
            chapter_pdfs: pdf_urls,
            createdAt: new Date()
        });
        alert('Chapter added successfully!');
        document.getElementById('addChapterForm').reset();
        document.getElementById('selectCourseForChapter').value = courseId;
        document.getElementById('selectSubjectForChapter').value = subjectId;
        fetchAndDisplayChaptersForAdmin(courseId, subjectId);
    } catch (e) {
        console.error("Error adding chapter: ", e);
        alert('Error adding chapter: ' + e.message);
    }
}

async function updateChapter(courseId, subjectId, chapterId, newData, newPdfFiles) {
    try {
        const chapterRef = doc(db, "courses", courseId, "subjects", subjectId, "chapters", chapterId);
        const currentChapterDoc = await getDoc(chapterRef);
        const currentPdfUrls = currentChapterDoc.exists() ? currentChapterDoc.data().chapter_pdfs || [] : [];

        const uploadedPdfUrls = await uploadPdfs(newPdfFiles, `chapter_pdfs/${courseId}/${subjectId}`);
        const combinedPdfUrls = [...new Set([...currentPdfUrls, ...uploadedPdfUrls])];

        await updateDoc(chapterRef, {
            ...newData,
            order: parseInt(newData.order),
            video_urls: newData.video_urls.split(',').map(id => id.trim()).filter(id => id),
            chapter_pdfs: combinedPdfUrls
        });
        alert('Chapter updated successfully!');
        fetchAndDisplayChaptersForAdmin(courseId, subjectId);
    } catch (e) {
        console.error("Error updating chapter: ", e);
        alert('Error updating chapter: ' + e.message);
    }
}

async function deleteChapter(courseId, subjectId, chapterId) {
    if (!confirm('Are you sure you want to delete this chapter?')) {
        return;
    }
    try {
        const chapterRef = doc(db, "courses", courseId, "subjects", subjectId, "chapters", chapterId);
        // Optionally delete PDFs from storage here, but more complex
        await deleteDoc(chapterRef);
        alert('Chapter deleted successfully!');
        fetchAndDisplayChaptersForAdmin(courseId, subjectId);
    } catch (e) {
        console.error("Error deleting chapter: ", e);
        alert('Error deleting chapter: ' + e.message);
    }
}

async function fetchAndDisplayChaptersForAdmin(courseId, subjectId) {
    const chapterListAdmin = document.getElementById('chapterListAdmin');
    if (!chapterListAdmin) return;
    if (!courseId || !subjectId) {
        chapterListAdmin.innerHTML = '<p>Select a course and subject to view its chapters.</p>';
        return;
    }

    chapterListAdmin.innerHTML = '<p>Loading chapters...</p>';
    try {
        const chaptersRef = collection(db, "courses", courseId, "subjects", subjectId, "chapters");
        const querySnapshot = await getDocs(query(chaptersRef, orderBy("order")));
        if (querySnapshot.empty) {
            chapterListAdmin.innerHTML = '<p>No chapters available for this subject.</p>';
            return;
        }

        chapterListAdmin.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const chapter = docSnap.data();
            const chapterId = docSnap.id;
            const videoDisplay = chapter.video_urls && chapter.video_urls.length > 0
                ? chapter.video_urls.map(id => `<a href="https://www.youtube.com/watch?v=${id}" target="_blank">${id}</a>`).join(', ')
                : 'N/A';
            const pdfDisplay = chapter.chapter_pdfs && chapter.chapter_pdfs.length > 0
                ? chapter.chapter_pdfs.map(url => {
                    const fileName = url.substring(url.lastIndexOf('/') + 1, url.indexOf('?'));
                    return `<a href="${url}" target="_blank">${decodeURIComponent(fileName.split('_').slice(1).join('_'))}</a>`;
                }).join(', ')
                : 'N/A';

            const chapterItem = document.createElement('div');
            chapterItem.classList.add('data-item');
            chapterItem.innerHTML = `
                <div>
                    <p><strong>Name:</strong> ${chapter.name}</p>
                    <p><strong>Description:</strong> ${chapter.description || 'N/A'}</p>
                    <p><strong>Order:</strong> ${chapter.order}</p>
                    <p><strong>Videos:</strong> ${videoDisplay}</p>
                    <p><strong>PDFs:</strong> ${pdfDisplay}</p>
                </div>
                <div class="actions">
                    <button class="edit-chapter-btn" data-course-id="${courseId}" data-subject-id="${subjectId}" data-id="${chapterId}">Edit</button>
                    <button class="delete-chapter-btn" data-course-id="${courseId}" data-subject-id="${subjectId}" data-id="${chapterId}">Delete</button>
                </div>
                <div class="edit-fields" style="display:none; width: 100%;">
                    <input type="text" value="${chapter.name}" placeholder="Chapter Name" data-field="name">
                    <textarea placeholder="Description" data-field="description">${chapter.description || ''}</textarea>
                    <input type="number" value="${chapter.order}" placeholder="Order" data-field="order">
                    <input type="text" value="${(chapter.video_urls || []).join(',')}" placeholder="YouTube Video IDs (comma-separated)" data-field="video_urls">
                    <input type="file" multiple accept=".pdf" data-field="pdf_files_to_upload">
                    
                    <button class="save-edit-chapter-btn" data-course-id="${courseId}" data-subject-id="${subjectId}" data-id="${chapterId}">Save</button>
                    <button class="cancel-edit-chapter-btn" data-id="${chapterId}">Cancel</button>
                </div>
            `;
            chapterListAdmin.appendChild(chapterItem);
        });

        chapterListAdmin.querySelectorAll('.edit-chapter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const item = e.target.closest('.data-item');
                item.querySelector('.edit-fields').style.display = 'block';
                e.target.style.display = 'none';
                item.querySelector('.delete-chapter-btn').style.display = 'none';
            });
        });
        chapterListAdmin.querySelectorAll('.cancel-edit-chapter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const item = e.target.closest('.data-item');
                item.querySelector('.edit-fields').style.display = 'none';
                e.target.closest('.actions').querySelector('.edit-chapter-btn').style.display = 'inline-block';
                e.target.closest('.actions').querySelector('.delete-chapter-btn').style.display = 'inline-block';
            });
        });
        chapterListAdmin.querySelectorAll('.save-edit-chapter-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const courseId = e.target.dataset.courseId;
                const subjectId = e.target.dataset.subjectId;
                const chapterId = e.target.dataset.id;
                const item = e.target.closest('.data-item');
                const newName = item.querySelector('[data-field="name"]').value;
                const newDescription = item.querySelector('[data-field="description"]').value;
                const newOrder = item.querySelector('[data-field="order"]').value;
                const newVideoIds = item.querySelector('[data-field="video_urls"]').value;
                const pdfFiles = item.querySelector('[data-field="pdf_files_to_upload"]').files;

                if (confirm('Are you sure you want to update this chapter?')) {
                    await updateChapter(courseId, subjectId, chapterId, {
                        name: newName,
                        description: newDescription,
                        order: newOrder,
                        video_urls: newVideoIds
                    }, pdfFiles);
                }
            });
        });
        chapterListAdmin.querySelectorAll('.delete-chapter-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const courseId = e.target.dataset.courseId;
                const subjectId = e.target.dataset.subjectId;
                const chapterId = e.target.dataset.id;
                await deleteChapter(courseId, subjectId, chapterId);
            });
        });

    } catch (error) {
        console.error("Error fetching chapters for admin: ", error);
        chapterListAdmin.innerHTML = '<p>Error loading chapters for management.</p>';
    }
}


// Dropdown population for Admin panel
async function populateCourseDropdowns() {
    const selectCourseForSubject = document.getElementById('selectCourseForSubject');
    const selectCourseForChapter = document.getElementById('selectCourseForChapter');

    if (!selectCourseForSubject || !selectCourseForChapter) return;

    // Clear existing options
    selectCourseForSubject.innerHTML = '<option value="">Select a Course</option>';
    selectCourseForChapter.innerHTML = '<option value="">Select a Course</option>';

    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        querySnapshot.forEach((docSnap) => {
            const course = docSnap.data();
            const optionSubject = document.createElement('option');
            optionSubject.value = docSnap.id;
            optionSubject.textContent = course.title;
            selectCourseForSubject.appendChild(optionSubject);

            const optionChapter = document.createElement('option');
            optionChapter.value = docSnap.id;
            optionChapter.textContent = course.title;
            selectCourseForChapter.appendChild(optionChapter);
        });
    } catch (error) {
        console.error("Error populating course dropdowns: ", error);
    }
}

async function populateSubjectDropdownForChapter(courseId) {
    const selectSubjectForChapter = document.getElementById('selectSubjectForChapter');
    if (!selectSubjectForChapter) return;

    selectSubjectForChapter.innerHTML = '<option value="">Select a Subject</option>'; // Reset
    selectSubjectForChapter.disabled = true; // Disable until subjects are loaded

    if (!courseId) return;

    try {
        const subjectsRef = collection(db, "courses", courseId, "subjects");
        const querySnapshot = await getDocs(query(subjectsRef, orderBy("order")));
        if (!querySnapshot.empty) {
            querySnapshot.forEach((docSnap) => {
                const subject = docSnap.data();
                const option = document.createElement('option');
                option.value = docSnap.id;
                option.textContent = subject.name;
                selectSubjectForChapter.appendChild(option);
            });
            selectSubjectForChapter.disabled = false;
        } else {
            selectSubjectForChapter.innerHTML = '<option value="">No subjects available</option>';
        }
    } catch (error) {
        console.error("Error populating subject dropdown for chapter: ", error);
        selectSubjectForChapter.innerHTML = '<option value="">Error loading subjects</option>';
    }
}

// User Assignment
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

/**
 * Fetches all registered users (from Firestore 'users' collection) and courses,
 * then displays options to assign courses to users.
 */
async function populateUserCourseAssignment() {
    const userCourseAssignmentList = document.getElementById('userCourseAssignmentList');
    if (!userCourseAssignmentList) return;

    userCourseAssignmentList.innerHTML = '<p>Loading users and courses for assignment...</p>';

    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const coursesSnapshot = await getDocs(collection(db, "courses"));
        const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (users.length === 0) {
            userCourseAssignmentList.innerHTML = '<p>No registered users found.</p>';
            return;
        }
        if (courses.length === 0) {
            userCourseAssignmentList.innerHTML = '<p>No courses available to assign.</p>';
            return;
        }

        userCourseAssignmentList.innerHTML = '';

        for (const user of users) {
            const userAssignItem = document.createElement('div');
            userAssignItem.classList.add('user-assign-item');

            const userEmailSpan = document.createElement('span');
            userEmailSpan.classList.add('user-email');
            userEmailSpan.textContent = user.email;
            userAssignItem.appendChild(userEmailSpan);

            const selectCourse = document.createElement('select');
            selectCourse.innerHTML = '<option value="">Select a Course</option>';
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.title;
                selectCourse.appendChild(option);
            });
            userAssignItem.appendChild(selectCourse);

            const assignButton = document.createElement('button');
            assignButton.textContent = 'Assign Course';
            assignButton.addEventListener('click', async () => {
                const selectedCourseId = selectCourse.value;
                if (selectedCourseId) {
                    await assignCourseToUser(user.uid, selectedCourseId);
                } else {
                    alert('Please select a course to assign.');
                }
            });
            userAssignItem.appendChild(assignButton);

            userCourseAssignmentList.appendChild(userAssignItem);
        }

    } catch (error) {
        console.error("Error fetching users/courses for assignment: ", error);
        userCourseAssignmentList.innerHTML = '<p>Error loading users or courses for assignment.</p>';
    }
}

/**
 * Assigns a course to a specific user (creates an enrollment).
 * @param {string} userId - The UID of the user.
 * @param {string} courseId - The ID of the course.
 */
async function assignCourseToUser(userId, courseId) {
    try {
        const enrollmentRef = collection(db, "enrollments");
        const q = query(enrollmentRef, where("userId", "==", userId), where("courseId", "==", courseId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            alert('User is already enrolled in this course!');
            return;
        }

        await addDoc(enrollmentRef, {
            userId: userId,
            courseId: courseId,
            enrollmentDate: new Date()
        });
        alert('Course successfully assigned to user!');
    } catch (error) {
        console.error("Error assigning course: ", error);
        alert('Failed to assign course: ' + error.message);
    }
}

async function fetchAndDisplayUsersForAdmin() {
    const userListAdmin = document.getElementById('userListAdmin');
    if (!userListAdmin) return;

    userListAdmin.innerHTML = '<p>Loading registered users...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        if (querySnapshot.empty) {
            userListAdmin.innerHTML = '<p>No registered users found.</p>';
            return;
        }

        userListAdmin.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const userData = docSnap.data();
            const userItem = document.createElement('div');
            userItem.classList.add('data-item');
            userItem.innerHTML = `
                <p><strong>Email:</strong> ${userData.email}</p>
                <p><strong>UID:</strong> ${userData.uid}</p>
                <p><strong>Registered:</strong> ${userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleString() : 'N/A'}</p>
            `;
            userListAdmin.appendChild(userItem);
        });
    } catch (error) {
        console.error("Error fetching users for admin: ", error);
        userListAdmin.innerHTML = '<p>Error loading users.</p>';
    }
}


// --- My Enrolled Courses Functions (for my-courses.html) ---

/**
 * Fetches and displays courses the current user is enrolled in.
 */
async function fetchAndDisplayEnrolledCourses() {
    const user = auth.currentUser;
    const enrolledCourseList = document.getElementById('enrolledCourseList');
    if (!user || !enrolledCourseList) {
        if (enrolledCourseList) enrolledCourseList.innerHTML = '<p>Please log in to view your enrolled courses.</p>';
        return;
    }

    enrolledCourseList.innerHTML = '<p>Loading your enrolled courses...</p>';
    try {
        const enrollmentsRef = collection(db, "enrollments");
        const q = query(enrollmentsRef, where("userId", "==", user.uid));
        const enrollmentSnapshot = await getDocs(q);

        if (enrollmentSnapshot.empty) {
            enrolledCourseList.innerHTML = '<p>You are not enrolled in any courses yet.</p>';
            return;
        }

        enrolledCourseList.innerHTML = '';
        
        for (const enrollDoc of enrollmentSnapshot.docs) {
            const courseId = enrollDoc.data().courseId;
            const courseDoc = await getDoc(doc(db, "courses", courseId));
            if (courseDoc.exists()) {
                const course = courseDoc.data();
                const courseItem = document.createElement('div');
                courseItem.classList.add('course-item');
                courseItem.innerHTML = `
                    <h3>${course.title}</h3>
                    <p>${course.description}</p>
                    <p><strong>Duration:</strong> ${course.duration}</p>
                    <button class="view-content-btn" data-course-id="${courseId}">View Course Content</button>
                `;
                enrolledCourseList.appendChild(courseItem);
            }
        }

        enrolledCourseList.querySelectorAll('.view-content-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const courseId = e.target.dataset.courseId;
                displayCourseContent(courseId);
            });
        });

    } catch (error) {
        console.error("Error fetching enrolled courses: ", error);
        enrolledCourseList.innerHTML = '<p>Error loading your courses. Please try again.</p>';
    }
}

/**
 * Displays the full course content (subjects, chapters, videos, PDFs) for an enrolled course.
 * Uses an accordion-like structure for subjects and chapters.
 * @param {string} courseId - The ID of the course to display.
 */
async function displayCourseContent(courseId) {
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to view course content.');
        window.location.href = 'login.html';
        return;
    }

    const courseContentSection = document.getElementById('courseContentSection');
    const courseContentTitle = document.getElementById('courseContentTitle');
    const courseContentDescription = document.getElementById('courseContentDescription');
    const courseLevelPdfsDiv = document.getElementById('courseLevelPdfs');
    const subjectsSection = document.getElementById('subjectsSection');
    const enrolledCourseListSection = document.querySelector('.my-courses-section');

    if (!courseContentSection || !courseContentTitle || !courseContentDescription || !courseLevelPdfsDiv || !subjectsSection || !enrolledCourseListSection) {
        console.error("Missing course content display elements.");
        return;
    }

    // Client-side Security Check: Verify if the user is enrolled in this course
    try {
        const enrollmentRef = collection(db, "enrollments");
        const q = query(enrollmentRef, where("userId", "==", user.uid), where("courseId", "==", courseId));
        const enrollmentSnapshot = await getDocs(q);

        if (enrollmentSnapshot.empty) {
            alert('You are not enrolled in this course. Access Denied.');
            enrolledCourseListSection.style.display = 'block';
            courseContentSection.style.display = 'none';
            return;
        }
    } catch (error) {
        console.error("Error during enrollment check:", error);
        alert('An error occurred during enrollment verification. Please try again.');
        enrolledCourseListSection.style.display = 'block';
        courseContentSection.style.display = 'none';
        return;
    }

    // Hide course list, show content section
    enrolledCourseListSection.style.display = 'none';
    courseContentSection.style.display = 'block';
    
    courseContentTitle.textContent = 'Loading Course Content...';
    courseContentDescription.textContent = '';
    courseLevelPdfsDiv.innerHTML = '<h3>Course Resources (PDFs)</h3><p>Loading course PDFs...</p>';
    subjectsSection.innerHTML = '<h3>Subjects in this Course</h3><p>Loading subjects...</p>';

    try {
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (!courseDoc.exists()) {
            alert('Course not found.');
            enrolledCourseListSection.style.display = 'block';
            courseContentSection.style.display = 'none';
            return;
        }

        const course = courseDoc.data();
        courseContentTitle.textContent = `Course: ${course.title}`;
        courseContentDescription.textContent = course.description;

        // Display Course-level PDFs
        courseLevelPdfsDiv.innerHTML = '<h3>Course Resources (PDFs)</h3>';
        if (course.pdf_urls && course.pdf_urls.length > 0) {
            course.pdf_urls.forEach(pdfUrl => {
                const pdfLink = document.createElement('a');
                const fileName = pdfUrl.substring(pdfUrl.lastIndexOf('/') + 1, pdfUrl.indexOf('?'));
                pdfLink.href = pdfUrl;
                pdfLink.target = "_blank";
                pdfLink.textContent = `Download: ${decodeURIComponent(fileName.split('_').slice(1).join('_'))}`;
                pdfLink.classList.add('pdf-link');
                courseLevelPdfsDiv.appendChild(pdfLink);
                courseLevelPdfsDiv.appendChild(document.createElement('br'));
            });
        } else {
            courseLevelPdfsDiv.innerHTML += '<p>No course-level PDFs available.</p>';
        }

        // Display Subjects and Chapters
        subjectsSection.innerHTML = '<h3>Subjects in this Course</h3>';
        const subjectsRef = collection(db, "courses", courseId, "subjects");
        const subjectsSnapshot = await getDocs(query(subjectsRef, orderBy("order")));

        if (subjectsSnapshot.empty) {
            subjectsSection.innerHTML += '<p>No subjects available for this course yet.</p>';
            return;
        }

        for (const subjectDoc of subjectsSnapshot.docs) {
            const subject = subjectDoc.data();
            const subjectId = subjectDoc.id;

            const subjectHeader = document.createElement('div');
            subjectHeader.classList.add('section-header');
            subjectHeader.innerHTML = `
                <span>${subject.order}. ${subject.name}</span>
                <span class="arrow">></span>
            `;
            subjectsSection.appendChild(subjectHeader);

            const subjectContentDiv = document.createElement('div');
            subjectContentDiv.classList.add('section-content');
            subjectContentDiv.innerHTML = `<p>${subject.description || ''}</p><h4>Chapters:</h4>`;

            const chaptersRef = collection(db, "courses", courseId, "subjects", subjectId, "chapters");
            const chaptersSnapshot = await getDocs(query(chaptersRef, orderBy("order")));

            if (chaptersSnapshot.empty) {
                subjectContentDiv.innerHTML += '<p>No chapters available for this subject yet.</p>';
            } else {
                for (const chapterDoc of chaptersSnapshot.docs) {
                    const chapter = chapterDoc.data();
                    const chapterId = chapterDoc.id;

                    const chapterHeader = document.createElement('div');
                    chapterHeader.classList.add('section-header');
                    chapterHeader.innerHTML = `
                        <span>${chapter.order}. ${chapter.name}</span>
                        <span class="arrow">></span>
                    `;
                    subjectContentDiv.appendChild(chapterHeader);

                    const chapterContentDiv = document.createElement('div');
                    chapterContentDiv.classList.add('section-content');
                    chapterContentDiv.innerHTML = `<p>${chapter.description || ''}</p>`;

                    // Videos for this chapter
                    chapterContentDiv.innerHTML += '<h5>Videos:</h5><div class="video-container">';
                    if (chapter.video_urls && chapter.video_urls.length > 0) {
                        chapter.video_urls.forEach(videoId => {
                            const iframe = document.createElement('iframe');
                            iframe.src = `https://www.youtube.com/embed/${videoId}`;
                            iframe.setAttribute('frameborder', '0');
                            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                            iframe.setAttribute('allowfullscreen', '');
                            iframe.classList.add('youtube-video');
                            chapterContentDiv.querySelector('.video-container').appendChild(iframe);
                        });
                    } else {
                        chapterContentDiv.querySelector('.video-container').innerHTML = '<p>No videos available for this chapter yet.</p>';
                    }
                    chapterContentDiv.innerHTML += '</div>';

                    // PDFs for this chapter
                    chapterContentDiv.innerHTML += '<h5>PDFs:</h5><div class="pdf-container">';
                    if (chapter.chapter_pdfs && chapter.chapter_pdfs.length > 0) {
                        chapter.chapter_pdfs.forEach(pdfUrl => {
                            const pdfLink = document.createElement('a');
                            const fileName = pdfUrl.substring(pdfUrl.lastIndexOf('/') + 1, pdfUrl.indexOf('?'));
                            pdfLink.href = pdfUrl;
                            pdfLink.target = "_blank";
                            pdfLink.textContent = `Download: ${decodeURIComponent(fileName.split('_').slice(1).join('_'))}`;
                            pdfLink.classList.add('pdf-link');
                            chapterContentDiv.querySelector('.pdf-container').appendChild(pdfLink);
                            chapterContentDiv.querySelector('.pdf-container').appendChild(document.createElement('br'));
                        });
                    } else {
                        chapterContentDiv.querySelector('.pdf-container').innerHTML = '<p>No PDFs available for this chapter yet.</p>';
                    }
                    chapterContentDiv.innerHTML += '</div>';

                    subjectContentDiv.appendChild(chapterContentDiv);

                    // Chapter accordion functionality
                    chapterHeader.addEventListener('click', () => {
                        chapterContentDiv.classList.toggle('expanded');
                        chapterHeader.classList.toggle('expanded');
                    });
                }
            }
            subjectsSection.appendChild(subjectContentDiv);

            // Subject accordion functionality
            subjectHeader.addEventListener('click', () => {
                subjectContentDiv.classList.toggle('expanded');
                subjectHeader.classList.toggle('expanded');
            });
        }
    } catch (error) {
        console.error("Error displaying course content: ", error);
        alert('Could not load course content. Please try again.');
        enrolledCourseListSection.style.display = 'block';
        courseContentSection.style.display = 'none';
    }
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
                populateCourseDropdowns(); // Populate course dropdowns for subject/chapter forms
                populateUserCourseAssignment(); // Populate user-course assignment section
                fetchAndDisplayMessages();
                fetchAndDisplayUsersForAdmin(); // Display registered users in admin panel

                const adminLogoutBtn = document.getElementById('adminLogoutBtn');
                if (adminLogoutBtn) {
                    adminLogoutBtn.addEventListener('click', handleLogout);
                }
            }
        }
    });

    // --- Home Page Logic (index.html) ---
    const exploreCoursesBtn = document.getElementById('enrollNowBtn');
    if (exploreCoursesBtn) {
        exploreCoursesBtn.addEventListener('click', () => {
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

    // --- My Enrolled Courses Page Logic (my-courses.html) ---
    if (window.location.pathname.includes('my-courses.html')) {
        fetchAndDisplayEnrolledCourses();
        // Add listener for "Back to My Courses" button
        document.getElementById('backToMyCourses')?.addEventListener('click', () => {
            document.querySelector('.my-courses-section').style.display = 'block';
            document.getElementById('courseContentSection').style.display = 'none';
        });
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
            const coursePdfs = addCourseForm.coursePdfs.files;

            addCourse(title, description, duration, coursePdfs);
        });
    }

    const addSubjectForm = document.getElementById('addSubjectForm');
    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const courseId = addSubjectForm.selectCourseForSubject.value;
            const name = addSubjectForm.subjectName.value;
            const description = addSubjectForm.subjectDescription.value;
            const order = addSubjectForm.subjectOrder.value;
            if (courseId) {
                addSubject(courseId, name, description, order);
            } else {
                alert('Please select a course first.');
            }
        });

        // Listener to populate subjects when course is selected
        document.getElementById('selectCourseForSubject')?.addEventListener('change', (e) => {
            fetchAndDisplaySubjectsForAdmin(e.target.value);
        });
    }

    const addChapterForm = document.getElementById('addChapterForm');
    if (addChapterForm) {
        addChapterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const courseId = addChapterForm.selectCourseForChapter.value;
            const subjectId = addChapterForm.selectSubjectForChapter.value;
            const name = addChapterForm.chapterName.value;
            const description = addChapterForm.chapterDescription.value;
            const order = addChapterForm.chapterOrder.value;
            const videoUrls = addChapterForm.chapterVideoUrls.value;
            const chapterPdfs = addChapterForm.chapterPdfs.files;

            if (courseId && subjectId) {
                addChapter(courseId, subjectId, name, description, order, videoUrls, chapterPdfs);
            } else {
                alert('Please select a course and subject first.');
            }
        });

        // Listeners to populate chapter subject dropdown based on selected course
        document.getElementById('selectCourseForChapter')?.addEventListener('change', (e) => {
            populateSubjectDropdownForChapter(e.target.value);
            // Clear chapters list when course changes
            document.getElementById('chapterListAdmin').innerHTML = '<p>Select a subject above to view its chapters.</p>';
        });
        
        // Listener to display chapters when subject is selected
        document.getElementById('selectSubjectForChapter')?.addEventListener('change', (e) => {
            const courseId = document.getElementById('selectCourseForChapter').value;
            fetchAndDisplayChaptersForAdmin(courseId, e.target.value);
        });
    }
});
