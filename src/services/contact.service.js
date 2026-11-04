export const fetchContacts = async () => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch("https://gateway.aajneetiadvertising.com/Contact", {
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
    throw new Error("Failed to fetch accounts");
  }
  return await res.json();
};

export const fetchContactById = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`https://gateway.aajneetiadvertising.com/Contact/${id}`, {
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
    throw new Error("Failed to fetch Contacts By ID's");
  }
  return await res.json();
};

export const createContact = async (payload) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch("https://gateway.aajneetiadvertising.com/Contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", token: token },

    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error("Contact is not created");
  }
  // EspoCRM returns array
  return text ? JSON.parse(text) : null;
};

export const deleteContact = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Contact/${id}`,
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
export const bulkDeleteContacts = async (ids = []) => {
  return Promise.all(ids.map((id) => deleteContact(id)));
};

export const updateContact = async (id, payload) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Contact/${id}`,
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
    throw new Error(text || "Contact update failed");
  }

  return text ? JSON.parse(text) : null;
};

// --------------Stream-----------
//fetch by Streams
export const fetchContactStreamById = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Contact/${id}/stream`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
    }
  );

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch User's stream");
  }
  return await res.json();
};

//delete stream with notes api
export const deleteContactStream = async (id) => {
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
export const createContactStream = async (payload) => {
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

export const contactActivitesById = async (id) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(
    `https://gateway.aajneetiadvertising.com/Activities/Contact/${id}/activities`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: token,
      },
    }
  );

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch Accounts Activties");
  }
  return await res.json();
};

// ---------------------------------------------------------------------------
// Paginated / filtered list
//
// `fetchContacts` above pulls the whole Contact table in one go. That is fine
// for the dropdowns that use it, but a list page needs paging, sorting and
// server-side filters — so this mirrors the shape `fetchNewLeads` uses
// (whereGroup + maxSize/offset + orderBy/order), which is the query format
// this gateway accepts.
// ---------------------------------------------------------------------------

const CONTACT_API = "https://gateway.aajneetiadvertising.com/Contact";

const CONTACT_DATE_TYPES = [
  "today",
  "yesterday",
  "lastSevenDays",
  "currentMonth",
  "lastMonth",
  "currentQuarter",
  "lastQuarter",
  "currentYear",
  "lastYear",
  "past",
  "future",
  "ever",
  "isEmpty",
  "on",
  "before",
  "after",
  "between",
];

const buildContactWhere = (clauses) =>
  clauses
    .map((clause, i) => {
      let q = `whereGroup[${i}][type]=${clause.type}`;
      q += `&whereGroup[${i}][attribute]=${clause.attribute || "createdAt"}`;

      if (Array.isArray(clause.value)) {
        clause.value.forEach((v) => {
          q += `&whereGroup[${i}][value][]=${encodeURIComponent(v)}`;
        });
      } else if (clause.value !== undefined && clause.value !== "") {
        q += `&whereGroup[${i}][value]=${encodeURIComponent(clause.value)}`;
      }

      if (clause.dateTime || CONTACT_DATE_TYPES.includes(clause.type)) {
        q += `&whereGroup[${i}][dateTime]=true`;
      }
      return q;
    })
    .join("&");

export const fetchContactsList = async ({
  limit = 20,
  page = 1,
  filters = {},
  sort,
} = {}) => {
  const token = localStorage.getItem("auth_token");
  const offset = (page - 1) * limit;
  const orderBy = sort?.key || "createdAt";
  const order = sort?.direction === "asc" ? "asc" : "desc";

  const where = [];

  if (filters.search) {
    where.push({ type: "like", attribute: "name", value: `%${filters.search}%` });
  }
  if (filters.accountId) {
    where.push({ type: "equals", attribute: "accountId", value: filters.accountId });
  }
  if (filters.city) {
    where.push({ type: "like", attribute: "addressCity", value: `%${filters.city}%` });
  }
  if (filters.assignUser) {
    where.push({
      type: "equals",
      attribute: "assignedUserId",
      value: filters.assignUser,
    });
  }

  // Created-date filter, same option set the leads page offers.
  if (filters.dateType) {
    const type = filters.dateType;
    if (["on", "before", "after"].includes(type)) {
      if (filters.dateFrom) {
        where.push({ type, attribute: "createdAt", value: filters.dateFrom, dateTime: true });
      }
    } else if (type === "between") {
      if (filters.dateFrom && filters.dateTo) {
        where.push({
          type,
          attribute: "createdAt",
          value: [filters.dateFrom, filters.dateTo],
          dateTime: true,
        });
      }
    } else {
      where.push({ type, attribute: "createdAt", dateTime: true });
    }
  }

  const query = buildContactWhere(where);
  const url =
    `${CONTACT_API}?maxSize=${limit}&offset=${offset}&orderBy=${orderBy}&order=${order}` +
    (query ? `&${query}` : "");

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", token },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error("Failed to fetch contacts");
  }

  const data = await res.json();
  return { list: data?.list || [], total: Number(data?.total) || 0 };
};

// ---------------------------------------------------------------------------
// Follow / unfollow
//
// EspoCRM models this as a subscription on the record: PUT to follow, DELETE
// to unfollow. Same endpoint shape `workplace.service.js` already uses, so
// this is the proven call rather than a guess.
// ---------------------------------------------------------------------------

const contactSubscription = async (id, method) => {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${CONTACT_API}/${id}/subscription`, {
    method,
    headers: { "Content-Type": "application/json", token },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error(
      method === "PUT" ? "Could not follow this contact" : "Could not unfollow this contact"
    );
  }
  return true;
};

export const followContact = (id) => contactSubscription(id, "PUT");
export const unfollowContact = (id) => contactSubscription(id, "DELETE");
