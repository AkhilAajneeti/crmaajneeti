import { useAccounts } from "hooks/useAccounts";
import { useNewLeads } from "hooks/useLeads";
import { useState } from "react";
import Input from "./ui/Input";
import Button from "./ui/Button";

export const ParentSelectorModal = ({
  open,
  onClose,
  type, // Account / Lead
  onSelect
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data } = type === "Account"
    ? useAccounts({ page, limit: 20, filters: { search } })
    : useNewLeads({ page, limit: 20, filters: { search } });

  const list = data?.list || [];

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white w-full max-w-lg p-4 rounded-lg">
            
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="mt-4 max-h-80 overflow-y-auto">
            {list.map(item => (
              <div
                key={item.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                {item.name}
              </div>
            ))}
          </div>

          <Button onClick={() => setPage(p => p + 1)}>
            Load More
          </Button>
        </div>
      </div>
    </>
  );
};