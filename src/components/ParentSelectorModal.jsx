import { useAccounts } from "hooks/useAccounts";
import { useNewLeads } from "hooks/useLeads";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Icon from "./AppIcon";

export const ParentSelectorModal = ({
  open,
  onClose,
  type,
  onSelect
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // ✅ filters state (IMPORTANT)
  const [filters, setFilters] = useState({});

  // 🔥 reset on open/type change
  useEffect(() => {
    if (open) {
      setSearch("");
      setFilters({});
      setPage(1);
    }
  }, [open, type]);

  // 🔥 debounce search → update filters
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters({
        search: search || undefined, // empty remove
      });
      setPage(1);
    }, 400);

    return () => clearTimeout(t);
  }, [search]);

  // ✅ API hooks (dynamic)
  const { data, isLoading } =
    type === "Account"
      ? useAccounts({ page, limit, filters })
      : useNewLeads({ page, limit, filters });

  const list = data?.list || [];
  const hasMore = data?.total > page * limit;

  // 🔥 ESC close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center px-4"
          >
            <div
              className="
                w-full max-w-lg rounded-2xl p-5
                bg-white/30 backdrop-blur-xl
                border border-white/40
                shadow-2xl
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Select {type}
                </h2>

                <button variant="ghost" size="icon"
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-200 transition"
                >
                  <Icon name="X" size={18} />
                </button>
              </div>

              {/* Search */}
              <Input
                placeholder={`Search ${type}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* List */}
              <div className="mt-4 max-h-80 overflow-y-auto space-y-1">
                {isLoading && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Loading...
                  </p>
                )}

                {!isLoading && list.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No results found
                  </p>
                )}

                {list.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg cursor-pointer text-gray-800 hover:bg-gray-100 transition"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    {item.name}
                  </div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <Button
                  className="w-full mt-4"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Load More
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};