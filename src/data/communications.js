// Communications bulletins and updates
// In production, would integrate with ODPEM, NHC, news feeds, etc.

import { getCurrentEvents } from './weatherFeed'

export const getCommunications = () => {
  const events = getCurrentEvents()
  return events.map((e) => ({
    ...e,
    type: e.type || 'update',
    source: e.source || 'ODPEM'
  }))
}
