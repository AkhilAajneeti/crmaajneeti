
const toLocalISOString = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date - tzOffset).toISOString().slice(0, -1);
};
const getDateRange = (type) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (type) {
        case "today":
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;

        case "yesterday":
            start.setDate(start.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setHours(23, 59, 59, 999);
            break;

        case "last7Days":
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            break;

        case "currentMonth":
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end.setHours(23, 59, 59, 999);
            break;

        case "lastMonth":
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;

        default:
            return null;
    }

    return {
        start: toLocalISOString(start),
        end: toLocalISOString(end),
    };
};
// 🚀 MAIN API
export const fetchKnowledge = async ({ limit, page, filters = {} }) => {
    const token = localStorage.getItem("auth_token");
    const offset = (page - 1) * limit;

    const where = [];

    // 🔍 SEARCH
    if (filters.search?.trim()) {
        where.push({
            type: "like",
            attribute: "name",
            value: `%${filters.search.trim()}%`,
        });
    }

    // ✅ TYPE
    if (filters.type) {
        where.push({
            type: "in",
            attribute: "type",
            value: [filters.type],
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

    // ✅ LANGUAGE
    if (filters.language && filters.language !== "Any") {
        where.push({
            type: "equals",
            attribute: "language",
            value: filters.language,
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

    // 🔥 DATE FILTER (100% BACKEND DRIVEN)
    if (filters.dateType) {
        const base = {
            attribute: "createdAt",
            dateTime: true,
        };

        switch (filters.dateType) {
            case "on":
            case "before":
            case "after":
                if (filters.closeDateFrom) {
                    where.push({
                        type: filters.dateType,
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
                // today, lastSevenDays, currentMonth, lastMonth
                where.push({
                    type: filters.dateType,
                    ...base,
                });
        }
    }

    // 🔥 BUILD QUERY
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

    const url = `https://gateway.aajneetiadvertising.com/KnowledgeBaseArticle?maxSize=${limit}&offset=${offset}&orderBy=createdAt&order=desc${query ? `&${query}` : ""
        }`;

    console.log("🔥 FINAL API URL:", url);

    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            token,
        },
    });

    if (!res.ok) {
        console.error("API ERROR:", res.status);
        throw new Error("Failed to fetch articles");
    }

    return res.json();
};
export const fetchKnowledgeById = async (id) => {
    const token = localStorage.getItem("auth_token");
    // console.log("AUTH TOKEN:", token); // 🔍 debug

    const res = await fetch(`https://gateway.aajneetiadvertising.com/KnowledgeBaseArticle/${id}`, {
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

/* CREATE */
export const createArticle = async (payload) => {
    const token = localStorage.getItem("auth_token");
    try {
        const res = await fetch("https://gateway.aajneetiadvertising.com/KnowledgeBaseArticle", {
            method: "POST",
            headers: { "Content-Type": "application/json", token: token },

            body: JSON.stringify(payload),
        });
    } catch (err) {
        console.error("Create KnowledgeBaseArticle service.js Error:", err?.response || err);
        throw err; // 🔥 ORIGINAL error rethrow
    }

    return res.json();
};

/* UPDATE */
export const updateArticle = async (id, payload, versionNumber) => {
    const token = localStorage.getItem("auth_token");
    console.log(id, payload, versionNumber);
    const res = await fetch(
        `https://gateway.aajneetiadvertising.com/KnowledgeBaseArticle/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                // "X-Version-Number": String(versionNumber||1),
                token: token,
            },
            body: JSON.stringify(payload),
        },
    );

    const text = await res.text();
    console.log("response front servicejs", res);
    if (!res.ok) {
        throw new Error(text || "Account update failed");
    }

    return text ? JSON.parse(text) : null;
};

/* DELETE */
export const deleteArticle = async (id) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(
        `https://gateway.aajneetiadvertising.com/KnowledgeBaseArticle/${id}`,
        {
            method: "DELETE",
            headers: { "Content-Type": "application/json", token: token },
        },
    );
    return res.json();
};


