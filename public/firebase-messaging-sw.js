importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyDM5UiCyouW7L8iIlz5dtmUTprHA199l4A",
  messagingSenderId: "394612122452",
  appId: "1:394612122452:web:19c968632d0a1a46afdec1",
  projectId: "tbd-used-car",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "storage/images/logo-toyota.png", // Thay bằng logo Toyota của Nghĩa
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
