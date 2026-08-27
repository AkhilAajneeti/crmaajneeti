

export const fetchComplainById = async (id) => {
    const token = localStorage.getItem("auth_token");
    console.log("AUTH TOKEN:", token); // 🔍 debug
    const res = await fetch(`https://gateway.aajneetiadvertising.com/Case/${id}`, {
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

export const createComplaint = async (payload) => {
    console.log(payload);
    const token = localStorage.getItem("auth_token");
    const res = await fetch("https://gateway.aajneetiadvertising.com/Case", {
        method: "POST",
        headers: { "Content-Type": "application/json", token: token },

        body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
        console.error("API ERROR:", text);
        throw new Error("Complaint is not created", text);
    }
    // The body was already consumed by res.text() above — calling res.json()
    // here would throw "body stream already read", so parse the text instead.
    return text ? JSON.parse(text) : null;
};

export const updateComplaint = async (id, payload) => {
    const token = localStorage.getItem("auth_token");
    console.log(id, payload);
    const res = await fetch(
        `https://gateway.aajneetiadvertising.com/Case/${id}`,
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
        throw new Error(text || "Complaint update failed");
    }

    // The body was already consumed by res.text() above — calling res.json()
    // here would throw "body stream already read" even though the PUT
    // succeeded, surfacing a false "Update failed" toast and skipping the
    // cache invalidation that refreshes the list.
    return text ? JSON.parse(text) : null;
};
export const deleteComplaint = async (id) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(
        `https://gateway.aajneetiadvertising.com/Case/${id}`,
        {
            method: "DELETE",
            headers: { "Content-Type": "application/json", token: token },
        },
    );
    if (!res.ok) {
        throw new Error("Delete failed");
    }
    return true;
};
export const fetchComplaints = async ({ limit, page, filters }) => {
    const token = localStorage.getItem("auth_token");
    const offset = (page - 1) * limit;

    // 🔥 DYNAMIC FILTER BUILDER
    const buildWhereFilters = (filters) => {
        const where = [];

        // 🔍 SEARCH
        if (filters.search) {
            where.push({
                type: "like",
                attribute: "name",
                value: `%${filters.search}%`,
            });
        }

        // ✅ STATUS
        if (filters.status) {
            where.push({
                type: "equals",
                attribute: "status",
                value: filters.status,
            });
        }

        // ✅ PRIORITY
        if (filters.priority) {
            where.push({
                type: "equals",
                attribute: "priority",
                value: filters.priority,
            });
        }

        // ✅ ASSIGNED USER
        if (filters.assignUser) {
            where.push({
                type: "equals",
                attribute: "assignedUserId",
                value: filters.assignUser,
            });
        }

        // 🔥 DATE FILTER (NO FRONTEND CALCULATION)
        if (filters.dateType) {
            const base = {
                attribute: "createdAt",
                dateTime: true,
            };

            switch (filters.dateType) {
                case "on":
                    if (filters.closeDateFrom) {
                        where.push({
                            type: "on",
                            ...base,
                            value: filters.closeDateFrom,
                        });
                    }
                    break;

                case "before":
                    if (filters.closeDateFrom) {
                        where.push({
                            type: "before",
                            ...base,
                            value: filters.closeDateFrom,
                        });
                    }
                    break;

                case "after":
                    if (filters.closeDateFrom) {
                        where.push({
                            type: "after",
                            ...base,
                            value: filters.closeDateFrom,
                        });
                    }
                    break;

                case "between":
                    if (filters.closeDateFrom && filters.closeDateTo) {
                        where.push({
                            type: "between",
                            ...base,
                            value: [filters.closeDateFrom, filters.closeDateTo],
                        });
                    }
                    break;

                default:
                    // today, yesterday, lastSevenDays, currentMonth, etc.
                    where.push({
                        type: filters.dateType,
                        ...base,
                    });
            }
        }

        return where;
    };

    const where = buildWhereFilters(filters);

    // 🔥 QUERY BUILDER
    const query = where
        .map((f, i) => {
            let q = `whereGroup[${i}][type]=${f.type}&whereGroup[${i}][attribute]=${f.attribute}`;

            if (Array.isArray(f.value)) {
                f.value.forEach((v) => {
                    q += `&whereGroup[${i}][value][]=${encodeURIComponent(v)}`;
                });
            } else if (f.value !== undefined) {
                q += `&whereGroup[${i}][value]=${encodeURIComponent(f.value)}`;
            }

            if (f.dateTime) {
                q += `&whereGroup[${i}][dateTime]=true`;
            }

            return q;
        })
        .join("&");

    const url = `https://gateway.aajneetiadvertising.com/Case?maxSize=${limit}&offset=${offset}&orderBy=createdAt&order=desc${query ? `&${query}` : ""
        }`;

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
        throw new Error("Failed to fetch complaints");
    }

    return res.json();
};