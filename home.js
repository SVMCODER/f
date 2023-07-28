var firebaseConfig = {
    apiKey: "AIzaSyCOA_2bf_b1o1nXSHZO5Re5DjSD66Pa6MY",
    authDomain: "https://raona0-default-rtdb.firebaseio.com",
    projectId: "raona0",
    storageBucket: "raona0.appspot.com",
    messagingSenderId: "797719983777",
    appId: "1:797719983777:web:d7ffca1316891b51ec62e0"
  };
  firebase.initializeApp(firebaseConfig);
// Get a reference to the Firebase Realtime Database
var database = firebase.database();

// Define a reference for the "blogs" collection
var blogsRef = database.ref('blogs');

// Format the count to display in abbreviated form
function formatCount(count) {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return (count / 1000).toFixed(1) + 'K';
  } else if (count < 1000000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else {
    return (count / 1000000000).toFixed(1) + 'B';
  }
}

// Function to update views count in real-time
function updateViews(blogId) {
  var blogRef = blogsRef.child(blogId);

  // Listen for changes on the "views" data and update the viewsCount accordingly
  blogRef.child('views').on('value', function(snapshot) {
    var viewsCount = snapshot.val() || 0;
    var viewsElement = document.getElementById('viewsCount_' + blogId);

    // Check if the viewsElement exists before updating its content
    if (viewsElement) {
      viewsElement.textContent = formatCount(viewsCount);
    }
  });
}

// Function to check if the current user is the author of a blog post
function isCurrentUserAuthor(blogData) {
  var userId = firebase.auth().currentUser.uid;
  return blogData.uid === userId;
}

// Function to delete a blog post with a confirmation dialog
function deletePost(blogId) {
  Swal.fire({
    title: 'Are you sure?',
    text: 'You will not be able to recover this post!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      var user = firebase.auth().currentUser;
      if (!user) {
        console.log('User is not logged in');
        return;
      }

      var userId = user.uid;
      var blogRef = blogsRef.child(blogId);
      blogRef.remove()
        .then(function () {
          console.log('Post deleted successfully.');
        })
        .catch(function (error) {
          console.error('Error deleting post:', error);
        });
    }
  });
}

// Function to make a blog post public with a confirmation dialog
function makePublic(blogId) {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This will make the post public for everyone to see.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, make it public!',
    cancelButtonText: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      var user = firebase.auth().currentUser;
      if (!user) {
        console.log('User is not logged in');
        return;
      }

      var userId = user.uid;
      var blogRef = blogsRef.child(blogId);
      blogRef.update({
        private: false,
        editedBy: userId, // Save the user ID of the editor to track who made the post public
      });
    }
  });
}

// Function to increment views count when a blog post is clicked
function incrementViewsOnClick(blogId) {
  var userId = firebase.auth().currentUser.uid;
  var blogRef = blogsRef.child(blogId);

  blogRef.once('value').then(function(snapshot) {
    var blogData = snapshot.val();
    if (blogData && !blogData.viewedByUsers) {
      blogData.viewedByUsers = {}; // Initialize an empty object if viewedByUsers doesn't exist
    }
    if (blogData && !blogData.viewedByUsers[userId]) {
      blogRef.update({
        views: (blogData.views || 0) + 1,
        viewedByUsers: {
          ...blogData.viewedByUsers,
          [userId]: true
        }
      });
    }
  });
}

// Function to send a like message
function sendLikeMessage(blogId, blogData) {
  var user = firebase.auth().currentUser;
  if (!user) {
    console.log('User is not logged in');
    return;
  }

  var currentUserUid = user.uid;
  var authorUid = blogData.uid;
  var authorName = blogData.authorName;

  // Check if the current user is not the author of the blog post
  if (currentUserUid !== authorUid) {
    var likeMessage = `${user.displayName} liked your post.`;

    // Create a new message reference in the database
    var messagesRef = database.ref('messages');
    var newMessageRef = messagesRef.push();

    // Set the message data
    var messageData = {
      senderUid: currentUserUid,
      recipientUid: authorUid,
      message: likeMessage,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    // Save the message data to the database
    newMessageRef.set(messageData)
      .then(function () {
        console.log('Like message sent successfully.');
      })
      .catch(function (error) {
        console.error('Error sending like message:', error);
      });
  }
}

// Function to handle the like functionality of a blog post
function handleLike(blogId, blogDataString) {
  var userId = firebase.auth().currentUser.uid;

  var blogData = JSON.parse(blogDataString.replace(/\\'/g, "'"));

  var blogRef = blogsRef.child(blogId);

  blogRef.transaction(function (blog) {
    if (blog) {
      if (!blog.likes) {
        blog.likes = {};
      }

      if (blog.likes[userId]) {
        // User already liked the post, so remove the like
        blog.likes[userId] = null;
      } else {
        // User hasn't liked the post, so add the like
        blog.likes[userId] = true;

        // Send a like message to the blog author
        sendLikeMessage(blogId, blogData);
      }
    }
    return blog;
  });
}


function displayBlogs() {
  var blogContainer = document.getElementById('blogContainer');

  blogsRef.orderByChild('timestamp').on('value', function (snapshot) {
    blogContainer.innerHTML = '';

    var blogs = snapshot.val();

    if (blogs) {
      var sortedBlogs = Object.keys(blogs)
        .map(function (key) {
          return { blogId: key, data: blogs[key] };
        })
        .sort(function (a, b) {
          return b.data.timestamp - a.data.timestamp;
        });

      sortedBlogs.forEach(function (blogDataObj) {
        var blogId = blogDataObj.blogId;
        var blogData = blogDataObj.data;
        var authorId = blogData.uid;

        var blogElement = document.createElement('div');
        blogElement.classList.add('blog', 'container');

        var blogHeader = document.createElement('div');
        blogHeader.classList.add('blog-header');

        var authorIconContainer = document.createElement('div');
        authorIconContainer.classList.add('author-icon');
        var authorIcon = document.createElement('img');
        var authorNameLink = document.createElement('a');
        authorNameLink.href = '/profile.html?uid=' + authorId;
        authorNameLink.textContent = blogData.authorName;
        authorIcon.src = blogData.authorProfilePic || 'https://cdn-icons-png.flaticon.com/512/7153/7153150.png';
        authorIcon.alt = 'Author Icon';
        authorIconContainer.appendChild(authorIcon);
        authorIconContainer.addEventListener('click', function () {
          window.location.href = '/profile.html?uid=' + authorId;
        });
        authorNameLink.addEventListener('click', function (event) {
          event.stopPropagation();
          window.location.href = '/profile.html?uid=' + authorId;
        });
        
        // Display the author's name in the blog header
        var authorNameHeader = document.createElement('h3');
        authorNameHeader.textContent = "Author: " + blogData.authorName;
        blogHeader.appendChild(authorNameHeader);

        blogHeader.appendChild(authorIconContainer);

        // Add the delete option (trash icon) for the author
        if (isCurrentUserAuthor(blogData)) {
          var deleteIcon = document.createElement('i');
          deleteIcon.classList.add('fas', 'fa-trash', 'delete-icon');
          deleteIcon.addEventListener('click', function (event) {
            event.stopPropagation();
            deletePost(blogId);
          });
          blogHeader.appendChild(deleteIcon);
        }

        var timestamp = document.createElement('p');
        timestamp.classList.add('timestamp');
        timestamp.textContent = formatDate(blogData.timestamp);

        authorNameHeader.appendChild(timestamp);
        blogElement.appendChild(blogHeader);

        var blogContent = document.createElement('div');
        blogContent.classList.add('blog-content');

        var title = document.createElement('h2');
        title.textContent = blogData.title;
        var content = document.createElement('p');
        content.textContent = blogData.content;

        // Add the image tag for displaying the uploaded image
        if (blogData.imageURL) {
          var image = document.createElement('img');
          image.src = blogData.imageURL;
          image.alt = 'Blog Image';
          image.classList.add('blog-image');
          blogContent.appendChild(image);
        }

        blogContent.appendChild(title);
        blogContent.appendChild(content);
        blogElement.appendChild(blogContent);

        var interactionContainer = document.createElement('div');
        interactionContainer.classList.add('interaction-container');

        var viewsContainer = document.createElement('div');
        viewsContainer.classList.add('views-container');

        var viewsIcon = document.createElement('i');
        viewsIcon.classList.add('fas', 'fa-eye');
        viewsContainer.appendChild(viewsIcon);

        var viewsCount = document.createElement('span');
        viewsCount.id = 'viewsCount_' + blogId;
        viewsCount.textContent = formatCount(blogData.views || 0);
        viewsContainer.appendChild(viewsCount);

        blogElement.addEventListener('click', function () {
          incrementViewsOnClick(blogId);
        });

        var likeContainer = document.createElement('div');
        likeContainer.classList.add('like-container');

        var likeIcon = document.createElement('i');
        likeIcon.id = 'likeIcon_' + blogId;
        likeIcon.classList.add('fas', 'fa-heart');
        likeIcon.setAttribute('onclick', `handleLike('${blogId}', '${JSON.stringify(blogData).replace(/'/g, "\\'")}')`);
        likeContainer.appendChild(likeIcon);

        var likesCount = document.createElement('span');
        likesCount.textContent = Object.keys(blogData.likes || {}).length;
        likeContainer.appendChild(likesCount);

        interactionContainer.appendChild(viewsContainer);
        interactionContainer.appendChild(likeContainer);

        blogElement.appendChild(interactionContainer);

        likeIcon.addEventListener('click', function () {
          handleLike(blogId);
        });
        var userId = firebase.auth().currentUser.uid;
        if (blogData.likes && blogData.likes[userId]) {
          likeIcon.classList.add('liked');
        } else {
          likeIcon.classList.remove('liked');
        }

        blogContainer.appendChild(blogElement);

        updateViews(blogId);
      });
    } else {
      blogContainer.innerHTML = '<p>No Posts found.</p>';
    }
  });
}




// Function to calculate "time ago" from a given date
function formatDate(date) {
  var seconds = Math.floor((new Date() - date) / 1000);
  var interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + ' years ago';
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + ' months ago';
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + ' days ago';
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + ' hours ago';
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + ' minutes ago';
  }
  return Math.floor(seconds) + ' seconds ago';
}

// Call the displayBlogs function to initialize the blog display
displayBlogs();
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
