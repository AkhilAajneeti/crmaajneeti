import React, { useState } from "react";
import toast from "react-hot-toast";
import Avatar from "react-avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import {
  createContactStream,
  deleteContactStream,
  fetchContactStreamById,
} from "services/contact.service";

/**
 * The contact's feedback stream.
 *
 * Deliberately the same construction as the Stream tab on the leads and
 * complaints drawers — toggled composer, `bg-muted/30` rows with a react-avatar,
 * the shared comment.png empty state — so the section does not read as a
 * different product when someone moves between the two pages.
 */

const getActivityIcon = (type) => {
  switch (type) {
    case "Post":
      return "MessageSquare";
    case "Update":
      return "RefreshCcw";
    case "Assign":
      return "UserPlus";
    case "Create":
      return "PlusCircle";
    default:
      return "Activity";
  }
};

const getActivityIconColor = (type) => {
  switch (type) {
    case "Post":
      return "text-indigo-600";
    case "Update":
      return "text-blue-600";
    case "Assign":
      return "text-purple-600";
    case "Create":
      return "text-green-600";
    default:
      return "text-gray-500";
  }
};

const getActivityMessage = (activity) => {
  const { type, post, data } = activity;

  if (type === "Post") {
    // `post` can be a non-string (an empty object) on some legacy stream
    // entries — coerce so it never crashes the render.
    return typeof post === "string" ? post : "";
  }
  if (type === "Assign") return `Assigned to ${data?.assignedUserName ?? ""}`;
  if (type === "Create") return "Contact was created";
  if (type === "Update") {
    const value = data?.value;
    if (value != null && typeof value !== "object") {
      return `Status updated to ${value}`;
    }
    return "Contact updated";
  }
  return "Activity updated";
};

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(String(date).replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const ContactStream = ({ contactId }) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const { data } = useQuery({
    queryKey: ["contact-stream", contactId],
    queryFn: () => fetchContactStreamById(contactId),
    enabled: Boolean(contactId),
    staleTime: 30 * 1000,
  });

  const streams = data?.list || [];

  const handlePost = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;

    setPosting(true);
    try {
      await createContactStream({
        post: body,
        parentId: contactId,
        parentType: "Contact",
        type: "Post",
      });
      setText("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["contact-stream", contactId] });
      toast.success("Feedback posted");
    } catch (err) {
      toast.error(err?.message || "Could not post the feedback");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (e, activity) => {
    e.stopPropagation();
    if (!window.confirm(`Delete feedback by ${activity?.createdByName || "System"}?`)) {
      return;
    }
    try {
      await deleteContactStream(activity.id);
      queryClient.invalidateQueries({ queryKey: ["contact-stream", contactId] });
      toast.success("Feedback deleted");
    } catch (err) {
      toast.error(err?.message || "Could not delete the feedback");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-medium text-foreground">
          <Icon name="Megaphone" size={18} className="text-primary" />
          Recent Feedback
        </h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Icon name="Plus" size={16} className="mr-1" />
          Add Feedback
        </Button>
      </div>

      <div className="space-y-4">
        {showForm && (
          <form onSubmit={handlePost}>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Write Your Comment Here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setText("");
                }}
              >
                Cancel
                <Icon name="XCircle" size={16} className="mr-1" />
              </Button>

              <Button type="submit" size="sm" disabled={posting}>
                Post
                <Icon name="Send" size={16} className="mr-1" />
              </Button>
            </div>
          </form>
        )}

        {streams.length > 0 ? (
          streams.map((activity) => (
            <div
              key={activity.id}
              className="flex space-x-3 p-4 bg-muted/30 rounded-lg"
            >
              <Avatar
                name={activity.createdByName || "System"}
                size="36"
                round
                textSizeRatio={2}
                color={activity.createdById === "system" ? "#9CA3AF" : undefined}
              />

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-foreground">
                      {activity.createdByName || "System"}
                    </h4>

                    <Icon
                      name={getActivityIcon(activity.type)}
                      size={14}
                      className={getActivityIconColor(activity.type)}
                    />

                    <span className="text-xs text-muted-foreground">
                      {activity.type}
                    </span>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {formatDate(activity.createdAt)}
                  </span>

                  <div className="flex items-center space-x-1 transition-opacity">
                    {/* Only hand-written posts can be removed; the rest of the
                        stream is the record's audit trail. */}
                    {activity.type === "Post" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, activity)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mt-1">
                  {getActivityMessage(activity)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <img
              src="/assets/images/comment.png"
              alt="No Activities"
              className="w-40 opacity-80"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              Currently you don't have any comments
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactStream;
