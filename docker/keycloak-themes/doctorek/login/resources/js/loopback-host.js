/**
 * In local Windows development, WSL can own localhost (::1) while Docker publishes Keycloak on
 * IPv4. Keycloak must keep localhost as its canonical issuer, so rewrite only browser-facing
 * Keycloak links/actions to the IPv4 host that served the current page.
 */
(() => {
  if (window.location.hostname !== '127.0.0.1') return

  const rewrite = (value) => {
    if (!value) return value
    try {
      const url = new URL(value, window.location.href)
      if (url.hostname === 'localhost' && url.port === window.location.port) {
        url.hostname = window.location.hostname
        return url.toString()
      }
    } catch {
      // Leave malformed or non-URL attributes untouched.
    }
    return value
  }

  document.querySelectorAll('form[action]').forEach((form) => {
    form.action = rewrite(form.action)
  })

  document.querySelectorAll('[formaction]').forEach((element) => {
    element.setAttribute('formaction', rewrite(element.getAttribute('formaction')))
  })

  document.querySelectorAll('a[href]').forEach((link) => {
    link.href = rewrite(link.href)
  })
})()
