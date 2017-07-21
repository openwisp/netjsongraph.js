import EventController from '../src/events_controller.js';

describe('EventController API', () => {
  test('API exists', () => {
    const ec = new EventController();

    expect(ec.set).toBeInstanceOf(Function);
    expect(ec.init).toBeInstanceOf(Function);
    expect(ec.disableContextMenu).toBeInstanceOf(Function);
    expect(ec.removeAll).toBeInstanceOf(Function);
  });
});
