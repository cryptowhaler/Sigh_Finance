import camelCase from 'lodash/camelCase';

// Read all files present in modules folder (current folder)
const requireModule = require.context('.', false, /\.ts$/);
const modules = {};

// All files (except index.ts (current file) are added as modules )
requireModule.keys().forEach(fileName => {
  if (fileName === './index.ts') 
    return;
  const moduleName = camelCase(fileName.replace(/(\.\/|\.ts)/g, ''));
  modules[moduleName] = requireModule(fileName).default;
});

export default modules;
