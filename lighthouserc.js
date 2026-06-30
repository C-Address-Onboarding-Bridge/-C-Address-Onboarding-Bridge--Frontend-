module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
      url: ['http://localhost:3000/'],
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
