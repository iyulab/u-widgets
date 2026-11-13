/**
 * Custom Elements Manifest — reads each element's attributes, properties, events, slots, CSS custom properties and
 * parts from the source and writes `dist/custom-elements.json` (`npm run analyze`, part of the build). The body of the
 * configuration is the shared helper that `@iyulab/components` publishes.
 */
import { cemConfig } from '@iyulab/components/plugins/cem-config.js';

export default cemConfig();
