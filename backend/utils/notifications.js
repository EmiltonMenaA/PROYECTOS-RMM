const subscribers = new Set();

function subscribe(listener) {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

function notify(eventName, payload) {
  subscribers.forEach(listener => {
    try {
      listener(eventName, payload);
    } catch (_err) {
      // Keep broadcasting even if one subscriber fails.
    }
  });
}

module.exports = {
  subscribe,
  notify
};
