module.exports = {
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  multiRemove: jest.fn(() => Promise.resolve()),
};
