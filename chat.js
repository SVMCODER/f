var firebaseConfig = {
    apiKey: "AIzaSyCOA_2bf_b1o1nXSHZO5Re5DjSD66Pa6MY",
    authDomain: "https://raona0-default-rtdb.firebaseio.com",
    projectId: "raona0",
    storageBucket: "raona0.appspot.com",
    messagingSenderId: "797719983777",
    appId: "1:797719983777:web:d7ffca1316891b51ec62e0"
  };
// Initialize Firebase
// Your firebaseConfig here
firebase.initializeApp(firebaseConfig);

// Function to format the timestamp into a relative time difference
function formatTimestamp(timestamp) {
  const messageDate = new Date(timestamp);
  const currentDate = new Date();

  const timeDifference = currentDate.getTime() - messageDate.getTime();
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return 'Just now';
  } else if (minutes === 1) {
    return '1 minute ago';
  } else if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (hours === 1) {
    return '1 hour ago';
  } else if (hours < 24) {
    return `${hours} hours ago`;
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else if (weeks === 1) {
    return '1 week ago';
  } else if (weeks < 4) {
    return `${weeks} weeks ago`;
  } else if (months === 1) {
    return '1 month ago';
  } else if (months < 12) {
    return `${months} months ago`;
  } else if (years === 1) {
    return '1 year ago';
  } else {
    return `${years} years ago`;
  }
}
const roomList = document.getElementById('rooms');
const createRoomBtn = document.getElementById('createRoomBtn');


// Function to fetch and build the room list
function buildRoomList(userId) {
  firebase.database().ref('chatrooms').on('value', (snapshot) => {
    roomList.innerHTML = '';

    const chatrooms = snapshot.val();
    if (chatrooms) {
      Object.entries(chatrooms).forEach(([roomId, roomData]) => {
        // Check if the current user is a member of the room
        if (roomData.members && roomData.members[userId]) {
          addRoomToList(roomId, roomData.name);
        }
      });
    }
  });
}

// Fetch and build the room list when the page loads
window.addEventListener('load', () => {
  // Check if the user is logged in
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is logged in, build the room list
      const userId = user.uid;
      buildRoomList(userId);
    } else {
      // User is not logged in, show the login prompt
      roomList.innerHTML = '<p>Please log in to view rooms.</p>';
    }
  });
});

 // Function to check if a group with the same name already exists
 function checkGroupNameExists(groupName) {
  const chatroomsRef = firebase.database().ref('chatrooms');
  return chatroomsRef
    .orderByChild('name')
    .equalTo(groupName)
    .once('value')
    .then((snapshot) => snapshot.exists());
}


  // Function to generate a random 6-digit number as group code
  function generateGroupCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Function to show a SweetAlert input prompt to create a new room
  function createRoom() {
    Swal.fire({
      title: 'Create Group',
      input: 'text',
      inputLabel: 'Group Title:',
      inputValidator: async (groupName) => {
        if (!groupName) {
          return 'Please enter group title';
        } else {
          const groupExists = await checkGroupNameExists(groupName);
          if (groupExists) {
            return 'Group name already exists';
          }

          // Generate a random 6-digit number as the group code
          const groupCode = generateGroupCode();

          // Save the room data to Firebase
          firebase.database().ref('chatrooms/' + groupCode).set({
            name: groupName,
            code: groupCode, // Store the group code in the 'code' field
            members: {
              [firebase.auth().currentUser.uid]: true
            }
          })
          .then(() => {
            Swal.fire({
              title: 'Group Created!',
              text: 'Invite your friends',
              inputValue: `Group Code: ${groupCode}`, // Show the group code in the alert
              showCancelButton: true,
              confirmButtonText: 'Copy Invite Code',
            }).then((result) => {
              if (result.isConfirmed) {
                const input = document.createElement('input');
                document.body.appendChild(input);
                input.value = `Group Code: ${groupCode}`; // Show the group code in the copied text
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
              }
            });

            // Add the created room to the list with group code
            addRoomToList(groupCode, groupName);
          })
          .catch((error) => {
            console.error('Error creating chatroom:', error);
            Swal.fire('Error', 'Failed to create group', 'error');
          });
        }
      }
    });
  }
  // Function to add the created room to the list with group code and delete button
  function addRoomToList(groupCode, groupName) {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.href = `${window.location.href}/chatroom.html?roomId=${groupCode}`;
    link.textContent = groupName;

    const groupCodeText = document.createElement('span');
    groupCodeText.textContent = `‎  ( Code: ${groupCode} )`; // Show the group code in the list

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="bx bx-trash"></i>';
    deleteButton.addEventListener('click', () => deleteGroup(groupCode, groupName));

    const avatar = document.createElement('img');
    // Replace 'path/to/default/avatar.png' with the URL of the default avatar image
    avatar.src = 'https://img.icons8.com/color/48/filled-chat.png';

    listItem.appendChild(avatar);
    listItem.appendChild(link);
    listItem.appendChild(groupCodeText);
    listItem.appendChild(deleteButton);
    roomList.appendChild(listItem);
  }

  // Function to delete the group
  function deleteGroup(groupCode, groupName) {
    Swal.fire({
      title: 'Delete Group',
      text: `Are you sure you want to delete the group "${groupName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove the group from the database
        firebase.database().ref('chatrooms').child(groupCode).remove()
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Group Deleted',
              text: 'The group has been deleted successfully!'
            });
          })
          .catch((error) => {
            console.error('Error deleting group:', error);
            Swal.fire('Error', 'Failed to delete group', 'error');
          });
      }
    });
  }
// Function to send a message in the group
function sendMessageToGroup(roomId, username, message, timestamp) {
  const messagesRef = firebase.database().ref('chatrooms/' + roomId + '/messages');
  messagesRef.push({
    username: username,
    text: message,
    timestamp: timestamp
  });
}


// Function to join a room using an invite code
function joinRoomWithInviteCode() {
  Swal.fire({
    title: 'Join Group with Invite Code',
    input: 'text',
    inputLabel: 'Invite Code:',
    inputValidator: (value) => {
      if (!value) {
        return 'Please enter the invite code';
      } else {
        // Check if the invite code is valid and the room exists
        const chatroomsRef = firebase.database().ref('chatrooms');
        chatroomsRef.once('value', (snapshot) => {
          const chatrooms = snapshot.val();
          if (chatrooms && chatrooms[value]) {
            // The room exists, add the user to the members list
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
              const userId = currentUser.uid;
              chatroomsRef.child(value).child('members').child(userId).set(true)
                .then(() => {
                  Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'You have joined the group successfully!'
                  });
                  // Refresh the room list after joining
                  buildRoomList(userId);
                })
                .catch((error) => {
                  console.error('Error joining group:', error);
                  Swal.fire('Error', 'Failed to join group', 'error');
                });
            } else {
              Swal.fire('Error', 'Please log in to join the group', 'error');
            }
          } else {
            Swal.fire('Error', 'Invalid invite code or room does not exist', 'error');
          }
        });
      }
    }
  });
}

// Attach event listeners
createRoomBtn.addEventListener('click', createRoom);