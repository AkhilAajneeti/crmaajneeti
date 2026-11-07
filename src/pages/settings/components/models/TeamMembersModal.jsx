import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Avatar from "react-avatar";
import Icon from "../../../../components/AppIcon";

/**
 * Team members popup.
 *
 * Same treatment as the User Details popup: an ivory glass panel with a faint
 * festive wash and mandala, pink-tinted icon wells, maroon kept to the small
 * accents, and a soft white list of members. It springs in on open and the
 * rows cascade after the team header.
 *
 * `open` drives an internal AnimatePresence, so the caller keeps the component
 * mounted and just flips the flag — that is what lets the exit animation play.
 */

const EASE = [0.22, 1, 0.36, 1];

// Orchestration labels, inherited by the whole tree.
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

const pop = {
  hidden: { opacity: 0, scale: 0.82 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 320, damping: 20 },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.12 } },
};

// `custom` is the element's position in the cascade. Delays are computed per
// element instead of `staggerChildren`, so a 60-person team still opens fast.
const rise = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.36, ease: EASE, delay: 0.06 + i * 0.05 },
  }),
  exit: { opacity: 0, y: 6, transition: { duration: 0.12 } },
};

const row = {
  hidden: { opacity: 0, y: 10 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE, delay: Math.min(0.14 + i * 0.035, 0.6) },
  }),
  exit: { opacity: 0, y: 4, transition: { duration: 0.1 } },
};

const TeamMembersModal = ({
  open = true,
  team,
  members = [],
  loading = false,
  onClose,
  getStatusBadge,
}) => {
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

  if (!team) return null;

  const teamName = team?.name || "Team";
  const count = members.length;
  const countLabel = `${count} ${count === 1 ? "member" : "members"}`;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="team-members"
          role="dialog"
          aria-modal="true"
          aria-labelledby="team-members-title"
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-3 sm:p-6"
          initial="hidden"
          animate="show"
          exit="exit"
          variants={shell}
        >
          <motion.div
            variants={backdrop}
            onClick={() => closeRef.current?.()}
            className="fixed inset-0 bg-[#2A1A14]/25 backdrop-blur-[3px]"
          />

          <motion.div
            variants={panel}
            className="relative my-auto flex max-h-[86vh] w-full max-w-xl flex-col overflow-hidden rounded-[26px]"
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
                  <Icon name="Users" size={17} />
                </span>
                <div>
                  <h3
                    id="team-members-title"
                    className="text-[15px] font-semibold text-foreground"
                  >
                    Team Details
                  </h3>
                  <p className="text-[11.5px] text-muted-foreground">
                    Members and their access
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => closeRef.current?.()}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#6B5340] ring-1 ring-[#C9A227]/25 transition-colors hover:bg-white hover:text-foreground"
              >
                <Icon name="X" size={17} />
              </button>
            </div>

            {/* Team identity */}
            <div className="relative flex flex-wrap items-center gap-4 px-5 pb-5 pt-5 sm:px-6">
              <motion.div
                variants={pop}
                className="rounded-full bg-white p-1 ring-1 ring-[#C9A227]/30 shadow-[0_12px_26px_-16px_rgba(42,26,20,0.55)]"
              >
                <Avatar name={teamName} size="60" round />
              </motion.div>

              <div className="min-w-0 flex-1">
                <motion.h4
                  custom={0}
                  variants={rise}
                  className="truncate text-[19px] font-semibold leading-tight text-foreground"
                >
                  {teamName}
                </motion.h4>

                <motion.p
                  custom={1}
                  variants={rise}
                  className="mt-1 flex items-center gap-2.5 text-[12.5px] text-muted-foreground"
                >
                  <span className="flex items-center gap-1.5">
                    <Icon name="Users" size={13} className="shrink-0" />
                    {countLabel}
                  </span>
                  {team?.createdAt && (
                    <>
                      <span
                        aria-hidden="true"
                        className="h-3 w-px shrink-0 bg-[#C9A227]/45"
                      />
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Icon name="CalendarDays" size={13} className="shrink-0" />
                        <span className="truncate">{team.createdAt}</span>
                      </span>
                    </>
                  )}
                </motion.p>

                {team?.description && (
                  <motion.div
                    custom={2}
                    variants={rise}
                    className="mt-2.5 flex flex-wrap items-center gap-2"
                  >
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground ring-1 ring-[#C9A227]/25">
                      <Icon name="Info" size={12} className="shrink-0" />
                      <span className="truncate">{team.description}</span>
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Gold hairline, then the member list — scrolls if it overflows */}
            <div
              aria-hidden="true"
              className="relative mx-5 h-px bg-gradient-to-r from-transparent via-[#C9A227]/40 to-transparent sm:mx-6"
            />

            <div className="relative min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2.5 ring-1 ring-[#C9A227]/15"
                    >
                      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-mahroon-400" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-[#E7DCCB]" />
                        <div className="h-2 w-1/2 animate-pulse rounded-full bg-[#EFE7DA]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !count ? (
                <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mahroon-400 text-mahroon ring-1 ring-[#AC2334]/15">
                    <Icon name="Users" size={19} />
                  </span>
                  <p className="mt-1 text-[13px] font-semibold text-foreground">
                    No members yet
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">
                    Users added to this team will appear here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {members.map((member, index) => (
                    <motion.li
                      key={member?.id ?? index}
                      custom={index}
                      variants={row}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white/75 px-3 py-2.5 ring-1 ring-[#C9A227]/20 shadow-[0_1px_2px_rgba(42,26,20,0.04)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="shrink-0 rounded-full bg-white p-0.5 ring-1 ring-[#C9A227]/30">
                          <Avatar
                            name={
                              member?.name ||
                              member?.userName ||
                              member?.email ||
                              "User"
                            }
                            size="34"
                            round
                            textSizeRatio={2}
                            className="font-medium"
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-semibold leading-snug text-foreground">
                            {member?.name || member?.userName || "Unnamed user"}
                          </p>
                          {member?.email && (
                            <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted-foreground">
                              <Icon name="Mail" size={11} className="shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {member?.status ? (
                        <div className="shrink-0">
                          {getStatusBadge?.(member.status)}
                        </div>
                      ) : null}
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="relative flex items-center justify-between gap-3 border-t border-[#C9A227]/25 bg-white/50 px-5 py-3 sm:px-6">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Icon name="Info" size={13} />
                Read-only view
              </p>
              <button
                type="button"
                onClick={() => closeRef.current?.()}
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

export default TeamMembersModal;

