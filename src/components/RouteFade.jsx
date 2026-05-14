/**
 * Wraps a full-page route so a short enter animation runs whenever the segment mounts
 * (e.g. landing ↔ sign-in). Does not remount on internal state changes.
 */
export default function RouteFade({ children }) {
  return <div className="dris-route-enter">{children}</div>
}
