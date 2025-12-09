import { currentUser } from "./auth.js";
import{ db } from "./firebaseConfig.js";
import {
      collection,
      addDoc,
      setDoc,
      getDocs,
      deleteDoc,
      updateDoc,
      doc
} from "https://www.gstatic.com/firebasejs/12.5.0/firestore.js";

// Add media
export async function addMediaToFirebase(oneMedia) {
try {   
    const mediaRef = collection(userRef, "media");
    const docRef = await addDoc(mediaRef, oneMedia);
    return { id: docRef.id, ...oneMedia };
  } catch (e) {
    console.error("Error adding media: ", e);
}

export async function getMediaFromFirebase() {
  const media = [];
  try {
    const mediaRef = collection(doc(db, userId), "media");
    const querySnapshot = await getDocs(mediaRef);
    querySnapshot.forEach((doc) => {
      media.push({ id: doc.id, ...doc.data() });
    });
  } catch (e) {
    console.error("Error retrieving media: ", e);
  }
  return media;
}

export async function deleteMediaFromFirebase(id) {
  try {
    const userId = currentUser.uid;
    await deleteDoc(doc(db, "users", userId, "media", id));
  } catch (e) {
    console.error("Error deleting media: ", e);
  }
}

export async function updateMediaInFirebase(id, updatedData) {
  console.log(updatedData, id);
try {
    const userId = currentUser.uid;
    const mediaRef = doc(db, "users", userId, "media", id);
    await updateDoc(mediaRef, updatedData);
  } catch (e) {
    console.error("Error updating task: ", e);
  }
}
}
