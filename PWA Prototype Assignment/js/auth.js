import { auth } from "./firebaseConfig.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { loadMedia, syncMedia } from "./ui.js";

export let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logout-btn");

    onAuthStateChanged(auth, (user) => {
        if(user){
            currentUser = user;
            console.log("User ID: ", user.uid);
            console.log("Email: ", user.email);
            console.log("Name: ", user.name);

            if(logoutBtn){
                logoutBtn.style.display = "block";
            }
            loadMedia();
            syncMedia();
        } else {
            console.log("User undetected. Please sign in.");
            window.location.href = "/pages/auth.html";
        }
    });

    if(logoutBtn){
        logoutBtn.addEventListener("click", async () => {
            try {
                await signOut(auth);
                M.toast({ html: "Logout successful"});
                logoutBtn.style.display = "none";
                window.location.href = "/pages/auth.html";
            } catch (error) {
                M.toast({html: error.message});
            }
        });
    }
})