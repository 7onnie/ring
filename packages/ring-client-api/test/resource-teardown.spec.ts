import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReplaySubject, Subject } from 'rxjs'

const mocks = vi.hoisted(() => ({
  receivers: [] as any[],
  splitters: [] as any[],
  ffmpegs: [] as any[],
}))

vi.mock('@eneris/push-receiver', () => {
  class PushReceiver {
    destroy = vi.fn()
    connect = vi.fn(async () => {})
    on = vi.fn()
    onNotification = vi.fn()
    onCredentialsChanged = vi.fn()
    whenReady = Promise.resolve()
    constructor() {
      mocks.receivers.push(this)
    }
  }
  return { PushReceiver }
})

vi.mock('@homebridge/camera-utils', () => {
  class RtpSplitter {
    close = vi.fn()
    portPromise = Promise.resolve(12345)
    constructor() {
      mocks.splitters.push(this)
    }
  }
  class FfmpegProcess {
    stop = vi.fn()
    constructor() {
      mocks.ffmpegs.push(this)
    }
  }
  return { RtpSplitter, FfmpegProcess, reservePorts: vi.fn() }
})

import { RingApi } from '../api.ts'
import { StreamingSession } from '../streaming/streaming-session.ts'

beforeEach(() => {
  mocks.receivers.length = 0
  mocks.splitters.length = 0
  mocks.ffmpegs.length = 0
})

describe('RingApi.disconnect (ring#3)', () => {
  it('destroys the push receiver', async () => {
    const api = new RingApi({ refreshToken: 'x' })
    await (api as any).registerPushReceiver([], [])
    expect(mocks.receivers).toHaveLength(1)
    expect(mocks.receivers[0].destroy).not.toHaveBeenCalled()

    api.disconnect()

    expect(mocks.receivers[0].destroy).toHaveBeenCalledTimes(1)
  })

  it('destroys the receiver if disconnect happens while connecting', async () => {
    const api = new RingApi({ refreshToken: 'x' })
    const registering = (api as any).registerPushReceiver([], [])
    api.disconnect()
    await registering

    expect(mocks.receivers[0].destroy).toHaveBeenCalled()
  })
})

describe('StreamingSession return audio (ring#4)', () => {
  function makeSession() {
    const connection = {
      onAudioRtp: new Subject(),
      onVideoRtp: new Subject(),
      onCallAnswered: new ReplaySubject<string>(1),
      onCallEnded: new Subject<void>(),
      onError: new Subject<Error>(),
      stop: vi.fn(),
      sendAudioPacket: vi.fn(),
    }
    const session = new StreamingSession(
      { name: 'cam' } as any,
      connection as any,
    )
    return { session, connection }
  }

  it('closes the UDP forwarder when the session ends', async () => {
    const { session, connection } = makeSession()
    connection.onCallAnswered.next('m=audio 1 RTP/AVP 111\na=rtpmap:111 opus/48000')

    await session.transcodeReturnAudio({ input: ['x'] })
    const forwarder = mocks.splitters.at(-1)
    expect(forwarder.close).not.toHaveBeenCalled()

    session.stop()

    expect(forwarder.close).toHaveBeenCalled()
  })

  it('closes the UDP forwarder when setup fails', async () => {
    const { session, connection } = makeSession()
    const pending = session.transcodeReturnAudio({ input: ['x'] })
    connection.onError.next(new Error('boom'))

    await expect(pending).rejects.toThrow('boom')
    expect(mocks.splitters.at(-1).close).toHaveBeenCalled()
  })
})
