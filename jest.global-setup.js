module.exports = async () => {
  // timezone returned in tests must be always UTC
  process.env.TZ = "UTC";
  process.env.NODE_ENV = "test";
};
