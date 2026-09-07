// The dropdown pages through the result client-side, so fetch a useful window
// rather than a single page's worth — `maxSize=5` meant the Prev/Next controls
// could never move off page 1.
export const fetchNotifications = async (limit = 20) => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(`https://gateway.aajneetiadvertising.com/Notification?maxSize=${limit}&offset=0&orderBy=number&order=desc`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token: token, // ✅ backend expects this
    },
  });

  if (!res.ok) {

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }

    throw new Error("Failed to fetch notifications ");
  }

  return await res.json();
};


// 
export const fetchUnreadCount = async () => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    "https://gateway.aajneetiadvertising.com/Notification/action/notReadCount",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token: token,
      },
    }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch notifications Count");
  }
  const data = await res.json(); // 🔥 FIX HERE

  return data; // ✅ return actual data
};