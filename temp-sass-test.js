const sass = require("sass");
try {
  const src = "@use '@angular/material' as mat; @debug mat.$indigo-palette; .x{color: red;}";
  const r = sass.compileString(src, {loadPaths: ['node_modules']});
  console.log('ok', r.css);
} catch (e) { console.error('err', e); }
