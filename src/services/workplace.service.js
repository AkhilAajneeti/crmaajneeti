export const fetchWorkPlace = async ({ limit, page, filters }) => {
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
    if (filters.noteType) {
        where.push({
            type: "equals",
            attribute: "noteType", // ⚠️ confirm backend field name
            value: filters.noteType,
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
            let q = `where[${i}][type]=${f.type}&where[${i}][attribute]=${f.attribute}`;

            if (Array.isArray(f.value)) {
                f.value.forEach((v) => {
                    q += `&where[${i}][value][]=${encodeURIComponent(v)}`;
                });
            } else if (f.value !== undefined) {
                q += `&where[${i}][value]=${encodeURIComponent(f.value)}`;
            }

            return q;
        })
        .join("&");

    const baseUrl = `https://gateway.aajneetiadvertising.com/CWorkplaceNotes?maxSize=${limit}&offset=${offset}&orderBy=createdAt&order=desc`;

    const url = query ? `${baseUrl}&${query}` : baseUrl;

    console.log("FINAL API:", url);
    // console.log("AUTH TOKEN:", token); // 🔍 debug

    const res = await fetch(url, {
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

        throw new Error("Failed to fetch workplace info");
    }

    return await res.json();
};
export const fetchWorkPlaceById = async ({ id }) => {
    const token = localStorage.getItem("auth_token");
    // console.log("AUTH TOKEN:", token); // 🔍 debug

    const res = await fetch(`https://gateway.aajneetiadvertising.com/CWorkplaceNotes/${id}`, {
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

        throw new Error("Failed to fetch workplace info by id");
    }

    return await res.json();
};
export const workPlaceSubscription = async ({ id }) => {
    const token = localStorage.getItem("auth_token");
    // console.log("AUTH TOKEN:", token); // 🔍 debug

    const res = await fetch(`https://gateway.aajneetiadvertising.com/CWorkplaceNotes/${id}/subscription`, {
        method: "PUT",
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

        throw new Error("Failed to fetch workplace info by id");
    }

    return await res.json();
};
export const workPlaceUnsubscribe = async ({ id }) => {
    const token = localStorage.getItem("auth_token");
    // console.log("AUTH TOKEN:", token); // 🔍 debug

    const res = await fetch(`https://gateway.aajneetiadvertising.com/CWorkplaceNotes/${id}/subscription`, {
        method: "DELETE",
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

        throw new Error("Failed to DELETE workplace info by id");
    }

    return await res.json();
};
// create workplace
export const createWorkplace = async (payload) => {
    const token = localStorage.getItem("auth_token");
    try {
        const res = await fetch("https://gateway.aajneetiadvertising.com/CWorkplaceNotes", {
            method: "POST",
            headers: { "Content-Type": "application/json", token: token },

            body: JSON.stringify(payload),
        });
        const data = await res.json(); // ✅ MUST

        if (!res.ok) {
            throw new Error(data?.message || "Failed to create workplace note");
        }

        return data; // ✅ return response
    } catch (err) {
        console.error("Create Workplace API Error:", err);
        throw err;
    }
};
// update worplace
export const updateWorkplace = async (id, payload) => {
    const token = localStorage.getItem("auth_token");

    try {
        const res = await fetch(
            `https://gateway.aajneetiadvertising.com/CWorkplaceNotes/${id}`,
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

        const data = await res.json().catch(() => null); // ✅ safe

        if (!res.ok) {
            throw new Error(data?.message || "Update failed");
        }

        return data;
    } catch (err) {
        console.error("Update API Error:", err);
        throw err;
    }
};
// --------------Stream-----------
export const workplaceStreamById = async (id) => {
    console.log(id);
    const token = localStorage.getItem("auth_token");
    console.log("AUTH TOKEN:", token); // 🔍 debug
    const res = await fetch(
        `https://gateway.aajneetiadvertising.com/CWorkplaceNotes/${id}/stream`,
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
export const updateworkplaceStream = async (id, payload) => {
    console.log(id);
    const token = localStorage.getItem("auth_token");
    console.log("AUTH TOKEN:", token); // 🔍 debug
    const res = await fetch(
        `https://gateway.aajneetiadvertising.com/CWorkplaceNotes/${id}/stream`,
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


//create activity
export const workplaceActivitesById = async (id) => {

    const token = localStorage.getItem("auth_token");

    const res = await fetch(
        `https://gateway.aajneetiadvertising.com/Activities/CWorkplaceNotes/${id}/activities`,
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
        throw new Error("Failed to fetch User's Activties");
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
// --------------- Workplace note stream posts ---------------
// Self-contained: workplace notes have nothing to do with leads, so these do
// not reuse the Lead stream helpers.
//
// EspoCRM stores every stream comment as a Note record. What ties a comment
// to its parent is the payload's parentType/parentId, not the URL — which is
// why creating one is a plain POST /Note rather than a call to
// /CWorkplaceNotes/{id}/stream (that path is read-only, used by the GET).
export const createWorkplacePost = async ({ noteId, post }) => {
    const token = localStorage.getItem("auth_token");

    const res = await fetch(`https://gateway.aajneetiadvertising.com/Note`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            token: token,
        },
        body: JSON.stringify({
            post,
            parentId: noteId,
            parentType: "CWorkplaceNotes",
            type: "Post",
            isInternal: false,
            attachmentsIds: [],
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        if (res.status === 401 || res.status === 403) {
            localStorage.clear();
            window.location.href = "/login";
        }
        throw new Error(text || "Failed to post comment");
    }

    return res.json();
};

// Editing a comment is a PUT on the Note record itself. Posting to the
// parent's /stream endpoint does nothing.
export const updateWorkplacePost = async ({ postId, post }) => {
    const token = localStorage.getItem("auth_token");

    const res = await fetch(`https://gateway.aajneetiadvertising.com/Note/${postId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            token: token,
        },
        body: JSON.stringify({ post }),
    });

    if (!res.ok) {
        const text = await res.text();
        if (res.status === 401 || res.status === 403) {
            localStorage.clear();
            window.location.href = "/login";
        }
        throw new Error(text || "Failed to update comment");
    }

    return res.json();
};

// Delete the note itself. This lived in the leads service as `deleteLead`,
// which pointed at DELETE /Lead/{id} — the wrong entity, so it always 404'd.
export const deleteWorkplace = async (id) => {
    const token = localStorage.getItem("auth_token");

    const res = await fetch(
        `https://gateway.aajneetiadvertising.com/CWorkplaceNotes/${id}`,
        {
            method: "DELETE",
            headers: { "Content-Type": "application/json", token: token },
        }
    );

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            localStorage.clear();
            window.location.href = "/login";
        }
        throw new Error("Failed to delete workplace note");
    }

    return res.json();
};
