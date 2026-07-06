export const fetchcalenderDetails = async ({ limit, page, filters }) => {
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

            // 🔥 SPECIFIC MONTH (current year) — same between-range pattern as
            // currentMonth/lastMonth. `filters.month` is the 0-based month index.
            case "month": {
                const monthIndex = Number(filters.month);
                if (!Number.isNaN(monthIndex)) {
                    const year = today.getFullYear();

                    const start = new Date(year, monthIndex, 1);
                    start.setHours(0, 0, 0, 0);

                    // For the current month cap at "now" (mirrors currentMonth);
                    // otherwise use the last calendar day of that month.
                    const end =
                        monthIndex === today.getMonth()
                            ? new Date()
                            : new Date(year, monthIndex + 1, 0);
                    end.setHours(23, 59, 59, 999);

                    where.push({
                        type: "between",
                        attribute: "createdAt",
                        value: [toLocalISOString(start), toLocalISOString(end)],
                    });
                }
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
    if (filters.requestType) {
        where.push({
            type: "equals",
            attribute: "requestType",
            value: filters.requestType,
        });
    }

    if (filters.createdById) {
        where.push({
            type: "equals",
            attribute: "createdById",
            value: filters.createdById,
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

    const baseUrl = `https://gateway.aajneetiadvertising.com/CAttendanceRequest?maxSize=${limit}&offset=${offset}&orderBy=createdAt&order=desc`;

    const url = query ? `${baseUrl}&${query}` : baseUrl;
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

        throw new Error("Failed to fetch calender info");
    }

    return await res.json();
};

export const fetchAttendanceById = async (id) => {
    const token = localStorage.getItem("auth_token");
    // console.log("AUTH TOKEN:", token); // 🔍 debug

    const res = await fetch(`https://gateway.aajneetiadvertising.com/CAttendanceRequest/${id}`, {
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

        throw new Error("Failed to fetch attendance");
    }
    return await res.json();
};

export const createNewAttendance = async (payload) => {
    const token = localStorage.getItem("auth_token");
    try {
        const res = await fetch("https://gateway.aajneetiadvertising.com/CAttendanceRequest", {
            method: "POST",
            headers: { "Content-Type": "application/json", token: token },

            body: JSON.stringify(payload),
        });
        const data = await res.json(); // ✅ FIX

        if (!res.ok) {
            throw new Error(data?.message || "Something went wrong");
        }

        return data; // ✅ now frontend gets response
    } catch (err) {
        console.error("Create Attendance API Error:", err);
        throw err;
    }

};


export const updateAttendance = async (id, payload) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(
        `https://gateway.aajneetiadvertising.com/CAttendanceRequest/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                token: token,
            },
            body: JSON.stringify(payload),
        },
    );

    if (!res.ok) {
        throw new Error(text || "Attendance update failed");
    }

    return await res.json();
};

export const deleteAttendance = async (id) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(
        `https://gateway.aajneetiadvertising.com/CAttendanceRequest/${id}`,
        {
            method: "DELETE",
            headers: { "Content-Type": "application/json", token: token },
        },
    );
    return res.json();
};




// --------------Stream-----------
//fetch by Streams
export const fetchAttendStreamById = async (id) => {
    const token = localStorage.getItem("auth_token");
    console.log("AUTH TOKEN:", token); // 🔍 debug
    const res = await fetch(
        `https://gateway.aajneetiadvertising.com/CAttendanceRequest/${id}/stream`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                token: token,
            },
        },
    );
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