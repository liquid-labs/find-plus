/* global describe expect test */
import { breadthFirstSorter } from '../sorters'

describe('breadthFirstSorter', () => {
  test('orders lower depth first', () => {
    const a = { depth : 1, parentPath : 'z', name : 'z' }
    const b = { depth : 2, parentPath : 'a', name : 'a' }
    expect(breadthFirstSorter(a, b)).toBeLessThan(0)
    expect(breadthFirstSorter(b, a)).toBeGreaterThan(0)
  })

  test('orders same depth, different parents, by parent', () => {
    const a = { depth : 1, parentPath : 'a', name : 'z' }
    const b = { depth : 1, parentPath : 'b', name : 'a' }
    expect(breadthFirstSorter(a, b)).toBeLessThan(0)
    expect(breadthFirstSorter(b, a)).toBeGreaterThan(0)
  })

  test('orders same depth and parent by name', () => {
    const a = { depth : 1, parentPath : 'a', name : 'a' }
    const b = { depth : 1, parentPath : 'a', name : 'b' }
    expect(breadthFirstSorter(a, b)).toBeLessThan(0)
    expect(breadthFirstSorter(b, a)).toBeGreaterThan(0)
    expect(breadthFirstSorter(a, { ...a })).toBe(0)
  })
})
