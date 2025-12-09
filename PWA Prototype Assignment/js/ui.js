import { openDB } from "https://unpkg.com/idb?module";
import {
  addMediaToFirebase,
  getMediaFromFirebase,
  deleteMediaFromFirebase,
  updateMediaInFirebase,
} from "./firebaseDB.js";

// --- Constants ---
const STORAGE_THRESHOLD = 0.8;

// Event Listeners and Initialization 
document.addEventListener("DOMContentLoaded", function () {
  //Sidenav Initialization
  const menus = document.querySelector(".sidenav");
  M.Sidenav.init(menus, { edge: "right" });
  //Side Form
  const forms = document.querySelector(".side-form");
  M.Sidenav.init(forms, { edge: "left" });
  checkStorageUsage();
  requestPersistenStorage();
});

// Checking/Registering Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/serviceworker.js")
    .then((req) => console.log("Service Worker Registered!", req))
    .catch((err) => console.log("Service Worker registration failed", err));
}

// Create/Get IndexedDB database instance
let dbPromise;
async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB("homeMediaTracker", 1, {
      upgrade(db) {
        const store = db.createObjectStore("media", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("status", "status");
        store.createIndex("synced", "synced");
      },
    });
  }
  return dbPromise;
}

// Sync media from IndexedDB to Firebase
export async function syncMedia() {
  const db = await getDB();
  const tx = db.transaction("media", "readonly");
  const store = tx.objectStore("media");
  const tasks = await store.getAll();
  await tx.done;

  for (const oneMedia of media) {
    if (!oneMedia.synced && isOnline()) {
      try {
        const mediaToSync = {
          title: media.title,
          description: task.description,
          status: task.status,
        };
        const savedMedia = await addMediaToFirebase(mediaToSync);
        const medUpdate = db.transaction("media", "readwrite");
        const storeUpdate = medUpdate.objectStore("media");
        await storeUpdate.delete(task.id);
        await storeUpdate.put({ ...media, id: savedMedia.id, synced: true });
        await medUpdate.done;
      } catch (error) {
        console.error("Error syncing media:", error);
      }
    }
  }
}

// Check if app is online
function isOnline() {
  return navigator.onLine;
}

// Add Media (either to Firebase or IndexedDB)
async function addMedia(media) {
  const db = await getDB();
  let mediaId;

  if (isOnline()) {
    try {
      const savedTask = await addMediaToFirebase(media);
      mediaId = savedMedia.id;
      const med = db.transaction("media", "readwrite");
      const store = med.objectStore("media");
      await store.put({ ...media, id: mediaId, synced: true });
      await med.done;
    } catch (error) {
      console.error("Error adding media to Firebase:", error);
    }
  } else {
    mediaId = `temp-${Date.now()}`;
    const mediaToStore = { ...media, id: mediaId, synced: false };
    const med = db.transaction("media", "readwrite");
    const store = med.objectStore("media");
    await store.put(mediaToStore);
    await med.done;
  }
    checkStorageUsage();
  return { ...media, id: mediaId };
}

// Edit Media 
async function editMedia(id, updatedData) {
  const db = await getDB();

  if (isOnline()) {
    try {
      await updateMeidaInFirebase(id, updatedData);
      // Updating in IndexedDB
      const med = db.transaction("media", "readwrite");
      const store = med.objectStore("media");
      await store.put({ ...updatedData, id: id, synced: true });
      await med.done;

      // Reload list after update
      loadMedia(); //Refresh/Reload
    } catch (error) {
      console.error("Error updating media in Firebase:", error);
    }
  } else {
    // If offline, use IndexedDB
    const med = db.transaction("media", "readwrite");
    const store = media.objectStore("media");
    await store.put({ ...updatedData, id: id, synced: false });
    await med.done;
    loadTasks(); //Refresh/Reload
  }
}

// Delete media
async function deleteMedia(id) {
   const db = await getDB();
  if (isOnline()) {
    try {
      await deleteMediaFromFirebase(id);
    } catch (error) {
      console.error("Error deleting media from Firebase:", error);
    }
  }

    const med = db.transaction("media", "readwrite");
  const store = med.objectStore("media");
  try {
    await store.delete(id);
  } catch (e) {
    console.error("Error deleting media from IndexedDB:", e);
  }
  await med.done;

  const mediaCard = document.querySelector(`[data-id="${id}"]`);
  if (mediaCard) {
    mediaCard.remove();
  }
  checkStorageUsage();
}

//UI Functions
//Loading media and sync with Firebase when online
export async function loadMedia() {
  const db = await getDB();
  const mediaContainer = document.querySelector(".media");
  mediaContainer.innerHTML = "";

  if (isOnline()) {
    const firebaseMedia = await getMediaFromFirebase();
    const med = db.transaction("media", "readwrite");
    const store = med.objectStore("media");

    for (const oneMedia of firebaseMedia) {
      await store.put({ ...oneMedia, synced: true });
      displayMedia(media);
    }
    await med.done;
  } else {
    const med = db.transaction("media", "readonly");
    const store = med.objectStore("media");
    const media = await store.getAll();
    media.forEach((oneMedia) => {
      displayMedia(oneMedia);
    });
    await med.done;
  }
}

//Display 
function displayMedia(oneMedia) {
  const mediaContainer = document.querySelector(".media");

  // Check if media already exists and remove it
  const existingMedia = mediaContainer.querySelector(`[data-id="${media.id}"]`);
  if (existingMedia) {
    existingMedia.remove();
  }

  // Create new media card HTML and add it to the container
  const html = `
    <div class="card" data-id="${media.id}">
      <div class="col s2 m2">
        <h5 class="task-title green-text">${media.title}</h5>
        <div class="task-note">${media.note}</div>
      </div>
      <div class="col s2 right-align">
        <button class="task-delete btn-flat" aria-label="Delete media">
          <i class="material-icons black-text text-darken-1" style="font-size: 30px">delete</i>
        </button>
        <button class="task-edit btn-flat" data-target="side-form" aria-label="Edit media">
          <i class="material-icons black-text text-darken-2" style="font-size: 30px">edit</i>
        </button>
      </div>
    </div>
  `;
  mediaContainer.insertAdjacentHTML("beforeend", html);

  const deleteButton = mediaContainer.querySelector(
    `[data-id="${media.id}"] .media-delete`
  );
  deleteButton.addEventListener("click", () => deleteMedia(task.id));

  const editButton = mediaContainer.querySelector(
    `[data-id="${media.id}"] .media-edit`
  );
  editButton.addEventListener("click", () =>
    openEditForm(media.id, media.title, media.note)
  );
}

// Add/Edit Media Button
const addMediaButton = document.querySelector("#form-action-btn");
addTaskButton.addEventListener("click", async () => {
  const titleInput = document.querySelector("#title");
  const noteInput = document.querySelector("#note");
  const mediaIdInput = document.querySelector("#media-id");
  const formActionButton = document.querySelector("#form-action-btn");
  // Prepare the task data
  const mediaId = mediaIdInput.value; 
  const mediaData = {
    title: titleInput.value,
    note: noteInput.value,
  };
  if (!mediaId) {
    // Adding media if one does not exist
    const savedMedia = await addMedia(taskMedia);
    displayMedia(savedMedia); // Display media
  } else {
    // Edits specifc media if it exists
    await editMedia(mediaId, mediaData); // Edits in Firebase and IndexedDB
    loadMedia(); // Refresh
  }
  formActionButton.textContent = "Add";
  closeForm();
});

// Open Edit Form including data
function openEditForm(id, title, note) {
  const titleInput = document.querySelector("#title");
  const noteInput = document.querySelector("#note");
  const noteIdInput = document.querySelector("#note-id");
  const formActionButton = document.querySelector("#form-action-btn");

  // Fills form 
  titleInput.value = title;
  noteInput.value = note;
  mediaIdInput.value = id;
  formActionButton.textContent = "Edit"; 

  M.updateTextFields(); 

  // Opens form
  const forms = document.querySelector(".side-form");
  const instance = M.Sidenav.getInstance(forms);
  instance.open();
}

// Resets after use
function closeForm() {
  const titleInput = document.querySelector("#title");
  const noteInput = document.querySelector("#note");
  const mediaIdInput = document.querySelector("#media-id");
  const formActionButton = document.querySelector("#form-action-btn");
  titleInput.value = "";
  noteInput.value = "";
  mediaIdInput.value = "";
  formActionButton.textContent = "Add";
  const forms = document.querySelector(".side-form");
  const instance = M.Sidenav.getInstance(forms);
  instance.close();
}

// Check storage usage and display warnings
async function checkStorageUsage() {
  if (navigator.storage && navigator.storage.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    const usageInMB = (usage / (1024 * 1024)).toFixed(2);
    const quotaInMB = (quota / (1024 * 1024)).toFixed(2);
    console.log(`Storage used: ${usageInMB} MB of ${quotaInMB} MB`);

    const storageInfo = document.querySelector("#storage-info");
    if (storageInfo) {
      storageInfo.textContent = `Storage used: ${usageInMB} MB of ${quotaInMB} MB`;
    }

    const storageWarning = document.querySelector("#storage-warning");
    if (usage / quota > STORAGE_THRESHOLD) {
      if (storageWarning) {
        storageWarning.textContent = "Warning: Running low on storage space.";
        storageWarning.style.display = "block";
      }
    } else if (storageWarning) {
      storageWarning.textContent = "";
      storageWarning.style.display = "none";
    }
  }
}

// Request persistent storage
async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersistent = await navigator.storage.persist();
    console.log(`Persistent storage granted: ${isPersistent}`);

    const storageMessage = document.querySelector("#persistent-storage-info");
    if (storageMessage) {
      storageMessage.textContent = isPersistent
        ? "Persistent storage granted!"
        : "Data might be cleared under storage pressure.";
      storageMessage.classList.toggle("green-text", isPersistent);
      storageMessage.classList.toggle("red-text", !isPersistent);
    }
  }
}

// Event listener to detect online status and sync
window.addEventListener("online", syncMedia);
window.addEventListener("online", loadMedia);