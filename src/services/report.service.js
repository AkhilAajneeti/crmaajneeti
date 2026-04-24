// update for leads filter
export const fetchreportLeads = async ({ limit, page, filters = {} }) => {
  const token = localStorage.getItem("auth_token");
  const offset = (page - 1) * limit;

  let where = [];

  // ✅ DATE FILTER (SAME AS LEADS)
  if (filters.dateType) {
    const type = filters.dateType;

    switch (type) {
      case "today":
      case "lastSevenDays":
      case "currentMonth":
      case "lastMonth":
      case "nextMonth":
      case "currentQuarter":
      case "lastQuarter":
      case "currentYear":
      case "lastYear":
      case "past":
      case "future":
      case "ever":
      case "isEmpty":
        where.push({
          type,
          attribute: "createdAt",
          dateTime: true,
        });
        break;

      case "on":
      case "before":
      case "after":
        if (filters.closeDateFrom) {
          where.push({
            type,
            attribute: "createdAt",
            value: filters.closeDateFrom,
            dateTime: true,
          });
        }
        break;

      case "between":
        if (filters.closeDateFrom && filters.closeDateTo) {
          where.push({
            type,
            attribute: "createdAt",
            value: [filters.closeDateFrom, filters.closeDateTo],
            dateTime: true,
          });
        }
        break;

      case "lastXDays":
      case "afterXDays":
        if (filters.xDays) {
          where.push({
            type,
            value: filters.xDays,
          });
        }
        break;
    }
  }

  // ✅ OTHER FILTERS (SAME)
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

  // ✅ SAME QUERY BUILDER (DON’T TOUCH)
  const query = where
    .map((f, i) => {
      let q = `whereGroup[${i}][type]=${f.type}`;

      const attribute = f.attribute || "createdAt";
      q += `&whereGroup[${i}][attribute]=${attribute}`;

      if (Array.isArray(f.value)) {
        f.value.forEach((v) => {
          q += `&whereGroup[${i}][value][]=${encodeURIComponent(v)}`;
        });
      } else if (f.value !== undefined && f.value !== "") {
        q += `&whereGroup[${i}][value]=${encodeURIComponent(f.value)}`;
      }

      if (
        f.dateTime ||
        [
          "today",
          "lastSevenDays",
          "currentMonth",
          "lastMonth",
          "between",
          "before",
          "after",
        ].includes(f.type)
      ) {
        q += `&whereGroup[${i}][dateTime]=true`;
      }

      return q;
    })
    .join("&");

  const baseUrl = `https://gateway.aajneetiadvertising.com/Lead?maxSize=${limit}&offset=${offset}&orderBy=createdAt&order=desc`;

  const url = query ? `${baseUrl}&${query}` : baseUrl;

  console.log("FINAL REPORT API:", url);

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      token,
    },
  });

  if (!res.ok) {
    console.error("API FAILED:", res.status);
    throw new Error("Failed to fetch report leads");
  }

  return await res.json();
};