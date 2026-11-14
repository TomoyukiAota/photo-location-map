interface NodeRequireFunction {
  // Add overloads here in order to add return types of the main process's global.require function.
  (id: 'child_process'): typeof import('child_process');
  (id: 'fs'): typeof import('fs');
  (id: 'os'): typeof import('os');
  (id: 'path'): typeof import('path');
}
