module.exports = {
  forbidden: [
    {
      from: { path: '^src/components' },
      to: { path: '^src/lib/database' },
      comment: 'Components should not import database layer'
    },
    {
      from: { path: '^src/lib/ui' },
      to: { path: '^src/pages' },
      comment: 'UI library should not depend on pages'
    }
  ]
};
