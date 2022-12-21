import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['./index'],
  failOnWarn: false,
  rollup: {
    emitCJS: true,
  },
});
