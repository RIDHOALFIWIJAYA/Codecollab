export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function roomJoinUrl(roomId) {
  return `${window.location.origin}/?room=${encodeURIComponent(roomId)}`
}