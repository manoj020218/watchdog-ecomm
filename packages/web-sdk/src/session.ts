const VISITOR_KEY = "__cw_vid";
const SESSION_KEY = "__cw_sid";

export function getVisitorId(): string {
  let vid = localStorage.getItem(VISITOR_KEY);
  if (!vid) {
    vid = `v_${crypto.randomUUID()}`;
    localStorage.setItem(VISITOR_KEY, vid);
  }
  return vid;
}

export function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `s_${crypto.randomUUID()}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function getBrowserInfo(): string {
  return navigator.userAgent.slice(0, 150);
}

export function getDeviceType(): string {
  return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
}
