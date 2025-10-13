// Basic test to verify Jest setup is working
describe('Test Setup', () => {
  it('should run tests correctly', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to Jest globals', () => {
    expect(jest).toBeDefined()
    expect(describe).toBeDefined()
    expect(it).toBeDefined()
    expect(expect).toBeDefined()
  })

  it('should support async tests', async () => {
    const result = await Promise.resolve(42)
    expect(result).toBe(42)
  })

  it('should support TypeScript', () => {
    const testObj: { name: string; value: number } = {
      name: 'test',
      value: 123,
    }
    expect(testObj.name).toBe('test')
    expect(testObj.value).toBe(123)
  })
})