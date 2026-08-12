#!/usr/bin/env node
'use strict';

const { parseColor, contrastText, DEFAULT_BG, AUTO_PALETTE,attenuate } = require('./lib/colors.js');
const { launchAll } = require('./lib/launcher.js');

const HELP = `colterminal - open background colored terminals (CMD / POWERSHELL)

Usage:
  colterminal                            Open one terminal with the default color
  colterminal -p cmd                     Open a CMD window
  colterminal -p powershell              Open a PowerShell window
  colterminal -l 2                       Open 2 terminals, each with a different background color
  colterminal -n "custom1,custom2,custom3"        
                                         Open one terminal per name, each with a different background color
  colterminal -c "red,green,blue"        Open one terminal per valid color (background)
  colterminal -t "white,black"           Open one terminal per valid text color (default background)
  colterminal -c "red,green" -t "white,black"
                                         Open one terminal per color pair (bg,text)
  colterminal -h                         Show this help

Options:
  -p, --program <cmd|powershell>  Terminal program (default: cmd)
  -l, --length <number>           How many terminals to open
  -c, --color <list>              Comma separated background colors
  -t, --text <list>               Comma separated text colors
  -h, --help                      Show this help
  -n, --name                      Name each terminal window

Colors accept names (red, green, blue, yellow, cyan, magenta, orange, purple, ...),
RGB rgb(r,g,b) or r,g,b, and hex like #rrggbb. Named colors are attenuated (muted)
so they are easy on the eyes, e.g. red becomes (45,0,0). When no text color is given,
the text color is chosen automatically to contrast with the background.
`;

const PROGRAMS = ['cmd', 'powershell'];

function parseValue(argv, i) {
  if (i + 1 >= argv.length) throw new Error(`missing value for "${argv[i]}"`);
  return argv[i + 1];
}

function splitList(value) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const opts = {
    program: 'cmd',
    length: null,
    colors: [],
    texts: [],
    help: false,
    names: ['colterminal']
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '-h':
      case '--help':
        opts.help = true;
        break;
      case '-n':
      case '--name':
        const arg_validated = parseValue(argv,i).toLowerCase();
        if(arg_validated)
        {
          if(opts.names[0] === 'colterminal') opts.names.shift()
          opts.names.push(...splitList(arg_validated));
        }
        break;
      case '-p':
      case '--program':
        opts.program = parseValue(argv, i).toLowerCase();
        i++;
        break;
      case '-l':
      case '--length':
        opts.length = Number(parseValue(argv, i));
        i++;
        break;
      case '-c':
      case '--color':
        opts.colors.push(...splitList(parseValue(argv, i)));
        i++;
        break;
      case '-t':
      case '--text':
        opts.texts.push(...splitList(parseValue(argv, i)));
        i++;
        break;
      default: {
        const eq = arg.match(/^--(program|length|color|text)=(.*)$/);
        if (eq) {
          const key = eq[1];
          const value = eq[2];
          if (key === 'program') opts.program = value.toLowerCase();
          else if (key === 'length') opts.length = Number(value);
          else if (key === 'color') opts.colors.push(...splitList(value));
          else if (key === 'text') opts.texts.push(...splitList(value));
        } else if (arg.startsWith('-')) {
          throw new Error(`unknown option "${arg}" (use -h for help)`);
        }
      }
    }
  }

  return opts;
}

function validColors(raw, label, { filterFunc = null } = {}) {
  const parsed = [];
  for (const source of raw) {
    const color = parseColor(source, { filterFunc });
    if (color) parsed.push(color);
    else console.warn(`[colterminal] ignoring invalid ${label} color "${source}"`);
  }
  return parsed;
}

function buildPlan(opts) {
  const bgs = validColors(opts.colors, 'background');
  const fgs = validColors(opts.texts, 'text');

  let count;
  if (bgs.length > 0) count = bgs.length;
  else if (fgs.length > 0) count = fgs.length;
  else if (opts.length >= 1) count = opts.length;
  else if(opts.names.length >= 1) count = opts.names.length;
  else count = 1;

  if (count < 1) throw new Error('no terminals to open');

  const plan = [];
  
  //here should be all the future styles of palletes to be applied trough an argument.
  const ATTENUATED_autoPalette = AUTO_PALETTE.map((n) => parseColor(n,{filterFunc: attenuate}));

  for (let i = 0; i < count; i++) {
    let bg;
    if (bgs.length > 0) {
      bg = bgs[i % bgs.length];
      
    } else if (opts.length >= 1 || opts.names.length > 1) {
      
      bg = {...ATTENUATED_autoPalette[i % ATTENUATED_autoPalette.length],explicit:false};
      
    } else {
      bg = { rgb: DEFAULT_BG, explicit: true };
    }

    const fg = fgs.length > 0
      ? fgs[i % fgs.length]
      : { rgb: contrastText(bg.rgb), explicit: true };

    plan.push({ bg, fg });
  }
  return plan;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`[colterminal] ${err.message}`);
    process.exit(1);
  }

  if (opts.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (!PROGRAMS.includes(opts.program)) {
    console.error(`[colterminal] invalid argument "${opts.program}". (use one of the following: ${PROGRAMS.join(', ')}.`);
    process.exit(1);
  }

  if (opts.length !== null && (!Number.isInteger(opts.length) || opts.length < 1)) {
    console.error(`[colterminal] -l/--length must be a positive integer`);
    process.exit(1);
  }

  let plan;
  try {
    plan = buildPlan(opts);
  } catch (err) {
    console.error(`[colterminal] ${err.message}`);
    process.exit(1);
  }

  const terminals = plan.map((entry, index) => {
    const label = `${opts.names[index % opts.names.length]} - ${index + 1}`;
    return { program: opts.program, name: label, bg: entry.bg, fg: entry.fg };
  });

  launchAll(terminals).catch((err) => {
    console.error(`[colterminal] failed to launch terminals: ${err.message}`);
    process.exit(1);
  });
}

main();
