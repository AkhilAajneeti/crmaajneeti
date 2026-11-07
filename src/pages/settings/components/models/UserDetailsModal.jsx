import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Avatar from "react-avatar";
import Icon from "../../../../components/AppIcon";

/**
 * User detail popup.
 *
 * Light glass panel rather than a heavy card: ivory surface, a faint festive
 * wash and mandala, pink-tinted icon wells, maroon only on the small accents.
 * It springs in on open and its content fades up in sequence, so the eye lands
 * on the person first and on the metadata after.
 *
 * `open` drives an internal AnimatePresence — that is what lets the exit
 * animation play, so the caller keeps the component mounted and flips the flag.
 * Omitting `open` behaves like the old always-visible modal.
 */

// Orchestration labels, inherited by the whole tree: each motion child only
// describes its own hidden / show / exit state.
const shell = { hidden: {}, show: {}, exit: {} };

const backdrop = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: "easeIn" } },
};

const panel = {
  hidden: { opacity: 0, scale: 0.95, y: 26 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 26, mass: 0.9 },
  },
  exit: { opacity: 0, scale: 0.97, y: 14, transition: { duration: 0.16 } },
};

const body = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.1 } },
  exit: {},
};

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: 6, transition: { duration: 0.12 } },
};

const pop = {
  hidden: { opacity: 0, scale: 0.82 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 320, damping: 20 },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.12 } },
};

const titleCase = (value) =>
  String(value || "")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

// One metadata row, on a soft white tile.
const Tile = ({ icon, label, value, mono }) => (
  <motion.div
    variants={rise}
    className="flex items-start gap-3 rounded-2xl bg-white/75 px-3.5 py-3 ring-1 ring-[#C9A227]/20 shadow-[0_1px_2px_rgba(42,26,20,0.04)]"
  >
    <span className="mt-px flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mahroon-400 text-mahroon">
      <Icon name={icon} size={15} />
    </span>
    <div className="min-w-0">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 break-words leading-snug text-foreground ${
          mono ? "font-mono text-[12px] font-medium" : "text-[13.5px] font-semibold"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  </motion.div>
);

const Chip = ({ icon, tone = "sand", children }) => (
  <motion.span
    variants={rise}
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
      tone === "maroon"
        ? "bg-mahroon-400 text-mahroon ring-1 ring-[#AC2334]/15"
        : "bg-accent text-accent-foreground ring-1 ring-[#C9A227]/25"
    }`}
  >
    {icon && <Icon name={icon} size={12} />}
    {children}
  </motion.span>
);

const UserDetailsModal = ({ open = true, user, onClose, getStatusBadge }) => {
  // `onClose` is usually an inline arrow, so keep the latest one in a ref and
  // bind the listeners once per open instead of on every parent render.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // Esc to dismiss, plus a scroll lock so the table behind stays put.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current?.();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const displayName = user?.name || user?.userName || "Unnamed user";
  const roles = user?.rolesNames
    ? Object.values(user.rolesNames).filter(Boolean).join(", ")
    : "";

  const fields = [
    { icon: "AtSign", label: "User Name", value: user?.userName },
    { icon: "UserRound", label: "Full Name", value: user?.name },
    { icon: "Phone", label: "Phone", value: user?.phoneNumber },
    { icon: "Building2", label: "Team", value: user?.defaultTeamName },
    { icon: "ShieldCheck", label: "Type", value: user?.type },
    { icon: "KeyRound", label: "Role", value: roles },
    { icon: "Fingerprint", label: "Created By", value: user?.createdByName },
    { icon: "CalendarDays", label: "Created At", value: user?.createdAt, mono: true },
    { icon: "CalendarClock", label: "Modified At", value: user?.modifiedAt, mono: true },
    { icon: "Activity", label: "Last Access", value: user?.lastAccess, mono: true },
  ];

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="user-details"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-details-title"
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-3 sm:p-6"
          initial="hidden"
          animate="show"
          exit="exit"
          variants={shell}
        >
          <motion.div
            variants={backdrop}
            onClick={() => onClose?.()}
            className="fixed inset-0 bg-[#2A1A14]/25 backdrop-blur-[3px]"
          />

          <motion.div
            variants={panel}
            className="relative my-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px]"
            style={{
              backgroundColor: "rgba(255,253,248,0.96)",
              boxShadow:
                "0 34px 80px -34px rgba(42,26,20,0.42), 0 0 0 1px rgba(201,162,39,0.22), inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
          >
            {/* Festive wash + mandala, kept faint so the panel still reads light */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#fee0df]/80 via-[#FDF3E4]/60 to-transparent"
            />
            <img
              src="/assets/festival/festive-mandala-full.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-12 w-[190px] select-none opacity-[0.22]"
            />

            {/* Header */}
            <div className="relative flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mahroon-400 text-mahroon ring-1 ring-[#AC2334]/15">
                  <Icon name="IdCard" size={17} />
                </span>
                <div>
                  <h3
                    id="user-details-title"
                    className="text-[15px] font-semibold text-foreground"
                  >
                    User Details
                  </h3>
                  <p className="text-[11.5px] text-muted-foreground">
                    Profile and activity
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onClose?.()}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#6B5340] ring-1 ring-[#C9A227]/25 transition-colors hover:bg-white hover:text-foreground"
              >
                <Icon name="X" size={17} />
              </button>
            </div>

            {/* Identity */}
            <div className="relative flex flex-wrap items-center gap-4 px-5 pb-5 pt-5 sm:px-6">
              <motion.div
                variants={pop}
                className="rounded-full bg-white p-1 ring-1 ring-[#C9A227]/30 shadow-[0_12px_26px_-16px_rgba(42,26,20,0.55)]"
              >
                <Avatar name={displayName} size="60" round />
              </motion.div>

              <div className="min-w-0 flex-1">
                <motion.h4
                  variants={rise}
                  className="truncate text-[19px] font-semibold leading-tight text-foreground"
                >
                  {displayName}
                </motion.h4>
                <motion.p
                  variants={rise}
                  className="mt-1 flex items-center gap-1.5 truncate text-[12.5px] text-muted-foreground"
                >
                  <Icon name="Mail" size={13} className="shrink-0" />
                  {user?.emailAddress || "—"}
                </motion.p>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {user?.type && (
                    <Chip icon="ShieldCheck" tone="maroon">
                      {titleCase(user.type)}
                    </Chip>
                  )}
                  {user?.defaultTeamName && (
                    <Chip icon="Users">{user.defaultTeamName}</Chip>
                  )}
                  {getStatusBadge?.(user?.isActive ? "Active" : "Inactive")}
                </div>
              </div>
            </div>

            {/* Gold hairline, then the metadata grid — scrolls if it overflows */}
            <div
              aria-hidden="true"
              className="relative mx-5 h-px bg-gradient-to-r from-transparent via-[#C9A227]/40 to-transparent sm:mx-6"
            />

            <motion.div
              variants={body}
              className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6"
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {fields.map((field) => (
                  <Tile key={field.label} {...field} />
                ))}
              </div>
            </motion.div>

            {/* Footer */}
            <div className="relative flex items-center justify-between gap-3 border-t border-[#C9A227]/25 bg-white/50 px-5 py-3 sm:px-6">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Icon name="Info" size={13} />
                Read-only view
              </p>
              <button
                type="button"
                onClick={() => onClose?.()}
                className="rounded-full bg-[#fee0df] px-4 py-1.5 text-[11.5px] font-semibold text-[#8C1226] ring-1 ring-[#AC2334]/20 transition-colors hover:bg-[#fcd6d4]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default UserDetailsModal;
