import { describe, expect, it } from 'vitest'
import { Location } from '../location.ts'

function makeLocation() {
  const location = new Location(
    { location_id: 'loc', name: 'Test' } as any,
    [],
    [],
    [],
    { hasHubs: true, hasAlarmBaseStation: true },
    {} as any,
  )
  location.assets = [{ uuid: 'hub-a' }, { uuid: 'hub-b' }] as any
  return location
}

const deviceList = (src: string, zids: string[]) => ({
  msg: 'DeviceInfoDocGetList',
  src,
  body: zids.map((zid) => ({ general: { v2: { zid } } })),
})

describe('Location.onDevices', () => {
  it('emits the first device list when the last hub answers with an empty list', () => {
    const location = makeLocation(),
      emissions: number[] = []
    location.onDevices.subscribe((d) => emissions.push(d.length))

    location.onMessage.next(deviceList('hub-a', ['1']) as any)
    expect(emissions).toEqual([])

    location.onMessage.next(deviceList('hub-b', []) as any)
    expect(emissions).toEqual([1])
  })

  it('still emits when the empty list comes first and the device list last', () => {
    const location = makeLocation(),
      emissions: number[] = []
    location.onDevices.subscribe((d) => emissions.push(d.length))

    location.onMessage.next(deviceList('hub-b', []) as any)
    location.onMessage.next(deviceList('hub-a', ['1']) as any)
    expect(emissions).toEqual([1])
  })

  it('does not re-emit for an unchanged list', () => {
    const location = makeLocation(),
      emissions: number[] = []
    location.onDevices.subscribe((d) => emissions.push(d.length))

    location.onMessage.next(deviceList('hub-a', ['1']) as any)
    location.onMessage.next(deviceList('hub-b', []) as any)
    location.onMessage.next(deviceList('hub-b', []) as any)
    expect(emissions).toEqual([1])
  })
})
