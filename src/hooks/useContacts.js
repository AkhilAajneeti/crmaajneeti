import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchContactById, fetchContactsList } from "services/contact.service";

/**
 * Contacts list. `keepPreviousData` holds the current page on screen while
 * the next one loads, so paging does not flash an empty table.
 */
export const useContactsList = ({ limit, page, filters, sort }) =>
  useQuery({
    queryKey: [
      "contacts",
      limit,
      page,
      JSON.stringify(filters),
      JSON.stringify(sort),
    ],
    queryFn: () => fetchContactsList({ limit, page, filters, sort }),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

/**
 * A single contact by id, for deep links.
 *
 * A pasted /Contact/view/:id URL may land before the list has ever been
 * fetched, so the drawer cannot rely on finding the record in the table.
 */
export const useContactById = (id) =>
  useQuery({
    queryKey: ["contact", id],
    queryFn: () => fetchContactById(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
