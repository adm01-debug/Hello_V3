self.onmessage = (e) => {
  const { audio } = e.data
  // Process audio
  self.postMessage({ processed: true })
}
