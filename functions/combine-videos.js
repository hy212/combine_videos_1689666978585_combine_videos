async function _combineStreams(sources, destination) {
  for (const stream of sources) {
    try {
      await stream.pipeTo(destination, {
        preventClose: true,
      })
    } catch (e) {
      log('excep:', e)
    }
  }

  let writer = destination.getWriter()
  writer.close()
  writer.releaseLock()
}

function combineStreams(streams) {
  const stream = new TransformStream()
  _combineStreams(streams, stream.writable)
  return stream.readable
}

async function handleRequest(event) {
  const urls = [
    'https://laputa-1257579200.cos.ap-guangzhou.myqcloud.com/stream-01.mov',
    'https://laputa-1257579200.cos.ap-guangzhou.myqcloud.com/stream-02.mov',
    'https://laputa-1257579200.cos.ap-guangzhou.myqcloud.com/stream-03.mov',
  ]
  const requests = urls.map((url) => fetch(url))
  const responses = await Promise.all(requests)
  const streams = responses.map((res) => res.body)

  event.respondWith(
    new Response(combineStreams(streams), {
      headers: {
        'content-type': 'video/mp4',
      },
    }),
  )
}

addEventListener('fetch', (event) => {
  log('this is a combine demo')
  handleRequest(event)
})
