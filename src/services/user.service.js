export const fetchUser = async () => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch("https://gateway.aajneetiadvertising.com/User", {
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
    throw new Error("Failed to fetch User's");
  }
  return await res.json();
}
export const fetchUserById = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`https://gateway.aajneetiadvertising.com/User/${id}`, {
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
    throw new Error("Failed to fetch User's by id");
  }
  return await res.json();
}


export const updateUser = async (id, payload) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/User/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
      body: JSON.stringify(payload),
    }
  );

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || "User update failed");
  }

  return text ? JSON.parse(text) : null;
};


export const deleteUser = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/User/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token: token },
    }
  );
  if (!res.ok) {
    throw new Error("Failed to delete User");
  }
  return res.json();
};

// upload attachment
export const attachment = async (payload) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/User/Attachment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
      body: JSON.stringify(payload),
    }
  );

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || "User update failed");
  }

  // The body was already consumed by res.text() above — calling res.json()
  // here would throw "body has already been read" even on a successful POST.
  return text ? JSON.parse(text) : null;
};

// profiles data
//
// The staff directory is a bounded list, so the page pulls the whole set once
// and filters/paginates client-side. Without an explicit maxSize EspoCRM caps
// the response at recordsPerPage (20), which silently hid members from the
// table once the team grew past that.
export const fetchProfiles = async (limit = 200) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/CProfileDetails?maxSize=${limit}&offset=0&orderBy=name&order=asc`,
    {
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
    throw new Error("Failed to fetch Profiles");
  }
  return await res.json();
}

export const fetchProfileDetail = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`https://gateway.aajneetiadvertising.com/CProfileDetails/${id}`, {
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
    throw new Error("Failed to fetch User's by id");
  }
  return await res.json();
}

export const updateprofile = async (id, payload) => {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/CProfileDetails/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
      body: JSON.stringify(payload),
    }
  );

  const text = await res.text();

  if (!res.ok) {
    console.error("API ERROR:", text);
    throw new Error(text || "Profile update failed");
  }

  return text ? JSON.parse(text) : null;
};