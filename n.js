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
var database = firebase.database();
function displayMessages() {
    var messagesList = document.getElementById('messagesList');
  
    // Clear previous messages
    messagesList.innerHTML = '';
  
    // Listen for changes in the user authentication state
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is logged in, proceed to fetch messages
        // Get a reference to the messages collection
        var messagesRef = database.ref('messages');
  
        // Query the messages collection for messages sent to the current user
        messagesRef.orderByChild('recipientUid').equalTo(user.uid).on('value', function(snapshot) {
          var messages = snapshot.val();
          if (messages) {
            Object.entries(messages).forEach(([messageId, messageData]) => {
              // Check if the senderUid property exists before accessing it
              if (messageData.senderUid) {
                // Create a new message item
                var messageItem = document.createElement('li');
                messageItem.textContent = messageData.message;
  
                // Append the message item to the messages list
                messagesList.appendChild(messageItem);
              }
            });
          }
        });
      } else {
        // User is not logged in
        console.log('User is not logged in');
      }
    });
  }
  
  // Call the displayMessages function to initialize the messages display
  displayMessages();
  