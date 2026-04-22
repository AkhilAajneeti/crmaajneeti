//fech only monthly leads
export const fetchLeads = async () => {
  const token = localStorage.getItem("auth_token");
  const user = JSON.parse(localStorage.getItem("login_object"));

  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(`https://gateway.aajneetiadvertising.com/Lead`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token: token, // ✅ backend expects this
    },
  });
  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch accounts");
  }
  return await res.json();
};

// update for leads filter
export const fetchNewLeads = async ({ limit, page, filters = {} }) => {
  const token = localStorage.getItem("auth_token");
  const offset = (page - 1) * limit;

  let where = [];

  // 🔥 FIX: convert local date → correct ISO for backend
  const toLocalISOString = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date - tzOffset).toISOString().slice(0, -1);
  };

  const today = new Date();

  // ✅ DATE FILTER
  if (filters.dateType) {
    switch (filters.dateType) {

      // 🔥 TODAY (FULL DAY)
      case "today": {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        where.push({
          type: "between",
          attribute: "createdAt",
          value: [toLocalISOString(start), toLocalISOString(end)],
        });
        break;
      }

      // 🔥 YESTERDAY (FULL DAY)
      case "yesterday": {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const start = new Date(yesterday);
        start.setHours(0, 0, 0, 0);

        const end = new Date(yesterday);
        end.setHours(23, 59, 59, 999);

        where.push({
          type: "between",
          attribute: "createdAt",
          value: [toLocalISOString(start), toLocalISOString(end)],
        });
        break;
      }

      // 🔥 LAST 7 DAYS (FULL RANGE)
      case "last7Days": {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        where.push({
          type: "between",
          attribute: "createdAt",
          value: [toLocalISOString(start), toLocalISOString(end)],
        });
        break;
      }

      // 🔥 BETWEEN (USER INPUT)
      case "between": {
        if (filters.closeDateFrom && filters.closeDateTo) {
          const start = new Date(filters.closeDateFrom);
          start.setHours(0, 0, 0, 0);

          const end = new Date(filters.closeDateTo);
          end.setHours(23, 59, 59, 999);

          where.push({
            type: "between",
            attribute: "createdAt",
            value: [toLocalISOString(start), toLocalISOString(end)],
          });
        }
        break;
      }

      // 🔥 BEFORE
      case "before": {
        if (filters.closeDateFrom) {
          const date = new Date(filters.closeDateFrom);
          date.setHours(0, 0, 0, 0);

          where.push({
            type: "lessThan",
            attribute: "createdAt",
            value: toLocalISOString(date),
          });
        }
        break;
      }

      // 🔥 AFTER
      case "after": {
        if (filters.closeDateFrom) {
          const date = new Date(filters.closeDateFrom);
          date.setHours(23, 59, 59, 999);

          where.push({
            type: "greaterThan",
            attribute: "createdAt",
            value: toLocalISOString(date),
          });
        }
        break;
      }
      case "currentMonth": {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        where.push({
          type: "between",
          attribute: "createdAt",
          value: [toLocalISOString(start), toLocalISOString(end)],
        });
        break;
      }
      case "lastMonth": {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);

        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        end.setHours(23, 59, 59, 999);

        where.push({
          type: "between",
          attribute: "createdAt",
          value: [toLocalISOString(start), toLocalISOString(end)],
        });
        break;
      }
    }
  }

  // ✅ OTHER FILTERS
  if (filters.search) {
    where.push({
      type: "like",
      attribute: "name",
      value: `%${filters.search}%`,
    });
  }

  if (filters.status) {
    where.push({
      type: "equals",
      attribute: "status",
      value: filters.status,
    });
  }

  if (filters.source) {
    where.push({
      type: "equals",
      attribute: "source",
      value: filters.source,
    });
  }

  if (filters.assignUser) {
    where.push({
      type: "equals",
      attribute: "assignedUserId",
      value: filters.assignUser,
    });
  }


  // ✅ QUERY BUILDER
  const query = where
    .map((f, i) => {
      let q = `whereGroup[${i}][type]=${f.type}&whereGroup[${i}][attribute]=${f.attribute}`;

      if (Array.isArray(f.value)) {
        f.value.forEach((v) => {
          q += `&whereGroup[${i}][value][]=${encodeURIComponent(v)}`;
        });
      } else if (f.value !== undefined && f.value !== "") {
        q += `&whereGroup[${i}][value]=${encodeURIComponent(f.value)}`;
      }

      // 🔥 date filters need this
      if (
        ["today", "yesterday", "currentMonth", "lastMonth", "last7Days"].includes(
          f.type
        )
      ) {
        q += `&whereGroup[${i}][dateTime]=true`;
      }

      return q;
    })
    .join("&");

  const baseUrl = `https://gateway.aajneetiadvertising.com/Lead?maxSize=${limit}&offset=${offset}&orderBy=createdAt&order=desc`;

  const url = query ? `${baseUrl}&${query}` : baseUrl;

  console.log("FINAL API:", url);

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      token,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch leads");

  return await res.json();
};
export const fetchLeadsById = async (id) => {
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(`https://gateway.aajneetiadvertising.com/Lead/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token: token, // ✅ backend expects this
    },
  });
  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch accounts by id");
  }
  return await res.json();
};

export const createLead = async (payload) => {
  console.log(payload);
  const token = localStorage.getItem("auth_token");
  const res = await fetch("https://gateway.aajneetiadvertising.com/Lead", {
    method: "POST",
    headers: { "Content-Type": "application/json", token: token },

    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("API ERROR:", text);
    throw new Error("Lead is not created", text);
  }
  // EspoCRM returns array
  return text ? JSON.parse(text) : null;
};

export const updateLead = async (id, payload) => {
  const token = localStorage.getItem("auth_token");
  console.log(id, payload);
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Lead/${id}`,
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
  console.log("response from contact.service.js", res);
  if (!res.ok) {
    throw new Error(text || "Lead update failed");
  }

  return text ? JSON.parse(text) : null;
};

export const deleteLead = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Lead/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token: token },
    }
  );
  if (!res.ok) {
    throw new Error("Failed to delete contact");
  }
  return res.json();
};
export const bulkDeleteleads = async (ids = []) => {
  return Promise.all(ids.map((id) => deleteLead(id)));
};

// --------------Stream-----------
//fetch by Streams
export const leadStreamById = async (id) => {
  console.log(id);
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Lead/${id}/stream`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
    }
  );

  console.log(res);
  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch User's stream");
  }
  return await res.json();
};
export const updateStream = async (id, payload) => {
  console.log(id);
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Lead/${id}/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
    }
  );

  console.log(res);
  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch User's stream");
  }
  return await res.json();
};

//delete activity with notes api
export const deleteActivity = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Note/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token: token },
    }
  );
  if (!res.ok) {
    throw new Error("Failed to delete Activity");
  }
  return res.json();
};

//create strean
export const createLeadActivity = async (payload) => {
  console.log(payload);
  const token = localStorage.getItem("auth_token");
  const res = await fetch("https://gateway.aajneetiadvertising.com/Note", {
    method: "POST",
    headers: { "Content-Type": "application/json", token: token },

    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("API ERROR:", text);
    throw new Error("Activity is not created", text);
  }
  // EspoCRM returns array
  return text ? JSON.parse(text) : null;
};

// Meet call related Activities

export const leadActivitesById = async (id) => {
  console.log(id);
  const token = localStorage.getItem("auth_token");
  console.log("AUTH TOKEN:", token); // 🔍 debug
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Activities/Lead/${id}/activities`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
    }
  );

  console.log(res);
  if (!res.ok) {
    console.log("STATUS:", res.status);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch User's Activties");
  }
  return await res.json();
};


// for dashboard
// 🔥 GLOBAL CACHE (top of file)
const leadsCountCache = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const fetchLeadsCount = async (filters = []) => {
  const cacheKey = JSON.stringify(filters);
  const cached = leadsCountCache.get(cacheKey);

  // ✅ Return cached if valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  const token = localStorage.getItem("auth_token");

  const query = filters
    .map((f, i) => {
      let q = `whereGroup[${i}][type]=${f.type}&whereGroup[${i}][attribute]=${f.attribute}`;

      if (Array.isArray(f.value)) {
        f.value.forEach((v) => {
          q += `&whereGroup[${i}][value][]=${encodeURIComponent(v)}`;
        });
      } else if (f.value !== undefined && f.value !== "") {
        q += `&whereGroup[${i}][value]=${encodeURIComponent(f.value)}`;
      }

      if (
        [
          "today",
          "yesterday",
          "currentMonth",
          "lastMonth",
          "last7Days",
          "between",
          "before",
          "after",
          "lessThan",
          "greaterThan"
        ].includes(f.type)
      ) {
        q += `&whereGroup[${i}][dateTime]=true`;
      }

      return q;
    })
    .join("&");

  const url = `https://gateway.aajneetiadvertising.com/Lead?${query}&maxSize=1`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token,
    },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch leads count");
  }

  const data = await res.json();
  const total = data.total || 0;

  // ✅ Save to cache
  leadsCountCache.set(cacheKey, {
    value: total,
    timestamp: Date.now(),
  });

  return total;
};

export const fetchThisMonthLeadsCount = async () => {
  const token = localStorage.getItem("auth_token");

  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  const endOfMonth = new Date().toISOString();

  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Lead?where[0][type]=between&where[0][attribute]=createdAt&where[0][value][]=${startOfMonth}&where[0][value][]=${endOfMonth}&maxSize=1`,
    {
      headers: {
        "Content-Type": "application/json",
        token,
      },
    }
  );

  const data = await res.json();

  return data.total; // 🔥 ONLY COUNT
};