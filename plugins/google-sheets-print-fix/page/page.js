// Google Sheets print fix for Yab.
// Sheets appends <style class="offline-printing-css"> and <div class="printing-canvas-container">
// to <body> when printing starts, and removes both as soon as window.print() returns.
// Yab renders the page for printing a moment later, so the formatted pages are gone by then.
// This puts Sheets' own nodes back until the print is over. Nothing is read, sent or stored.
(() => {
  if (!location.pathname.startsWith('/spreadsheets/')) return

  const KEEP_MS = 5 * 60 * 1000
  let held = null      // { style, cont } that we put back
  let pending = {}     // nodes Sheets just added for the current print
  let printed = false  // Yab's real print pass has finished since we put them back
  let timer = 0

  const drop = () => {
    clearTimeout(timer)
    if (!held) return
    held.cont.remove()
    held.style.remove()
    held = null
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue
        if (held && (node === held.cont || node === held.style)) continue
        if (node.classList.contains('printing-canvas-container')) {
          drop() // a new print replaces the last one
          pending.cont = node
        } else if (node.tagName === 'STYLE' && node.classList.contains('offline-printing-css')) {
          pending.style = node
        }
      }
    }
    // Sheets has taken its pages away again: put them back for the real print pass.
    if (pending.cont && pending.style && !pending.cont.isConnected && !pending.style.isConnected) {
      held = pending
      pending = {}
      printed = false
      document.body.append(held.style, held.cont)
      clearTimeout(timer)
      timer = setTimeout(drop, KEEP_MS)
    }
  })
  observer.observe(document.body, { childList: true })

  const onAfterPrint = () => { if (held) printed = true }
  // The print dialog covers the window, so the first click or key on the page means it is closed.
  const onInput = () => { if (held && printed) drop() }

  window.addEventListener('afterprint', onAfterPrint)
  document.addEventListener('pointerdown', onInput, true)
  document.addEventListener('keydown', onInput, true)

  const cleanup = () => {
    observer.disconnect()
    window.removeEventListener('afterprint', onAfterPrint)
    document.removeEventListener('pointerdown', onInput, true)
    document.removeEventListener('keydown', onInput, true)
    drop()
  }
  if (typeof boost !== 'undefined' && boost.cleanup) boost.cleanup(cleanup)
  return cleanup
})()
