var firebaseConfig = {
    apiKey: "AIzaSyCOA_2bf_b1o1nXSHZO5Re5DjSD66Pa6MY",
    authDomain: "https://raona0-default-rtdb.firebaseio.com",
    projectId: "raona0",
    storageBucket: "raona0.appspot.com",
    messagingSenderId: "797719983777",
    appId: "1:797719983777:web:d7ffca1316891b51ec62e0"
  };
  firebase.initializeApp(firebaseConfig);
// Check if the user is signed in
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
      // User is signed in
      console.log('User signed in:', user.displayName);
      // You can update UI or perform additional tasks for a signed-in user here
  } else {
      // User is signed out or not signed in
      console.log('User signed out or not signed in.');
      // Redirect the user to index.html
      window.location.href = 'index.html';
  }
});

// Get form element
var form = document.getElementById('blogForm');

// Listen for form submission
form.addEventListener('submit', function(e) {
  e.preventDefault();

  // Get input values
  var title = document.getElementById('titleInput').value;
  var content = document.getElementById('contentInput').value;
  var image = document.getElementById('imageInput').files[0];

  // Get the currently signed-in user
  var user = firebase.auth().currentUser;

  // Proceed only if the user is signed in
  if (user) {
      // Create a Firebase storage reference
      var storageRef = firebase.storage().ref();

      // Create a child reference with a unique name
      var imageName = 'blog_' + Date.now() + '_' + image.name;
      var imageRef = storageRef.child(imageName);

      // Upload the image to Firebase storage
      var uploadTask = imageRef.put(image);

      // Listen for upload completion
      uploadTask.on('state_changed',
          function(snapshot) {
              // Show upload progress if desired
          },
          function(error) {
              console.log('Image upload failed:', error);
          },
          function() {
              // Get the download URL of the uploaded image
              uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
                  // Save blog data (including the download URL) to the Firestore database
                  saveBlogToDatabase(user.uid, user.displayName, user.photoURL, title, content, downloadURL);
              });
          }
      );
  } else {
      console.log('User is not signed in.');
  }
});


function saveBlogToDatabase(uid, displayName, photoURL, title, content, imageURL) {
  // Show a SweetAlert pop-up indicating the upload is in progress
  Swal.fire({
      title: 'Uploading Post',
      text: 'Please wait...',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
          Swal.showLoading();
      }
  });

  // Get a reference to the Firebase Realtime Database
  var database = firebase.database();

  // Define a reference for storing blogs
  var blogsRef = database.ref('blogs');

  // Create a new blog entry with auto-generated ID
  var newBlogRef = blogsRef.push();

  // Create a data object to be saved in the Realtime Database
  var blogData = {
    uid: uid,
    displayName: displayName,
    photoURL: photoURL,
    title: title,
    content: content,
    imageURL: imageURL,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    likes: 0, // Initial value for likes
    views: 0 // Initial value for views
};

  // Save the blog data to the Realtime Database
  newBlogRef.set(blogData)
      .then(function() {
          // Close the loading pop-up
          Swal.close();

          // Show a success pop-up
          Swal.fire({
              title: 'Success',
              text: 'Post uploaded successfully!',
              icon: 'success'
          });

          // Clear form inputs after successful upload
          document.getElementById('titleInput').value = '';
          document.getElementById('contentInput').value = '';
          document.getElementById('imageInput').value = '';
      })
      .catch(function(error) {
          // Close the loading pop-up
          Swal.close();

          // Show an error pop-up
          Swal.fire({
              title: 'Error',
              text: 'Failed to upload post. Please try again.',
              icon: 'error'
          });

          console.error('Error saving blog:', error);
      });
}

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
      // User is signed in
      console.log('User signed in:', user.displayName);
      // You can update UI or perform additional tasks for a signed-in user here
  } else {
      // User is signed out
      console.log('User signed out.');
      // You can update UI or perform additional tasks for a signed-out user here
  }
});

// Updated logout function with confirmation
function logout() {
    Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, Log out',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        firebase.auth().signOut()
          .then(() => {
            console.log("User logged out");
            Swal.fire({
              icon: "success",
              title: "Success",
              text: "User logged out successfully!"
            });
            window.location.href = "login.html"; // Redirect the user to the login page after logout
          })
          .catch((error) => {
            console.error("Logout error:", error);
            Swal.fire({
              icon: "error",
              title: "Logout Error",
              text: "An error occurred while logging out."
            });
          });
      }
    });
  }
  
  