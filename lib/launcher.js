'use strict';

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { legacyColorFor, nearestConsoleColor, contrastText, rgbToHex } = require('./colors.js');

function powershellRunLine({ name, bg, fg }) {
  const bgC = legacyColorFor(bg.rgb, { explicit: bg.explicit });
  const fgC = nearestConsoleColor(fg.rgb);
  return `powershell.exe -NoLogo -NoProfile -NoExit -Command "` +
    `$Host.UI.RawUI.BackgroundColor = '${bgC.name}'; ` +
    `$Host.UI.RawUI.ForegroundColor = '${fgC.name}'; ` +
    `[Console]::BackgroundColor = '${bgC.name}'; ` +
    `[Console]::ForegroundColor = '${fgC.name}'; ` +
    `$Host.UI.RawUI.WindowTitle = '${name}'; ` +
    `Clear-Host"`;
}

function cmdRunLine({ name, bg, fg }) {
  const bgC = legacyColorFor(bg.rgb, { explicit: bg.explicit });
  
  const fgC = nearestConsoleColor(fg.rgb);
  return `cmd.exe /k "color ${bgC.cmd}${fgC.cmd} & cls & title ${name}"`;
}

function escapeJsString(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function launchAll(terminals) {
  const runLines = terminals.map((t) => {
    const fg = t.fg || { rgb: contrastText(t.bg.rgb), explicit: true };
    const resolved = { ...t, fg };
    
    const line = t.program === 'powershell' ? powershellRunLine(resolved) : cmdRunLine(resolved);
    const hex = rgbToHex(resolved.bg.rgb);
    console.log(`[colterminal] opened "${resolved.name}" (${t.program}) bg=${hex} fg=${rgbToHex(fg.rgb)}`);
    return line;
  });

  const script =
    'var sh = new ActiveXObject("WScript.Shell");\n' +
    runLines.map((l) => `sh.Run("${escapeJsString(l)}", 1, false);`).join('\n');

  const file = path.join(os.tmpdir(), `colterminal_${process.pid}_${Date.now()}.js`);
  fs.writeFileSync(file, script, 'utf8');

  return new Promise((resolve, reject) => {
    const child = spawn('cscript.exe', ['//nologo', '//E:JScript', file], {
      stdio: 'ignore'
    });
    child.on('error', (err) => {
      try {
        fs.unlinkSync(file);
      } catch (e) {}
      reject(err);
    });
    child.on('exit', () => {
      try {
        fs.unlinkSync(file);
      } catch (e) {}
      resolve();
    });
  });
}

module.exports = { launchAll };
