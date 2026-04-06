export const fetchcalenderDetails = async ({ limit, page, startDate, endDate }) => {
    const token = localStorage.getItem("auth_token");
    const offset = (page - 1) * limit;
    // console.log("AUTH TOKEN:", token); // 🔍 debug

    const res = await fetch(`https://gateway.aajneetiadvertising.com/CAttendanceRequest?maxSize=${limit}&offset=${offset}&startDate=${startDate}&endDate=${endDate}`, {
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