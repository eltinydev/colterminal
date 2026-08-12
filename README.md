# colterminal

Open background colored terminals (CMD / PowerShell) right from your command line.

## Install

```bash
npm install -g .
# or, from this folder:
npm link
```

Then the `colterminal` command is available anywhere.

## Usage

```bash
colterminal                              Open one terminal with the default color
colterminal -p cmd                       Open a CMD window
colterminal -p powershell                Open a PowerShell window
colterminal -l 2                         Open 2 terminals, each with a different background color
colterminal -c "red,green,blue"          Open one terminal per valid color (background)
colterminal -t "white,black"             Open one terminal per valid text color (default background)
colterminal -c "red,green" -t "white,black"
                                         Open one terminal per color pair (background, text)
colterminal -n                            Name each terminal window to distinguish them
colterminal -h                           Show help
```

## Options

| Option | Alias | Description |
| --- | --- | --- |
| `-p`, `--program` | | Terminal program: `cmd` or `powershell` (default: `cmd`) |
| `-l`, `--length` | | Number of terminals to open; each gets a different background color |
| `-c`, `--color` | | Comma separated background colors |
| `-t`, `--text` | | Comma separated text colors |
| `-h`, `--help` | | Show all commands and usage |
| `-n`,  `--name` | | Name each terminal window so they can be told apart |

## Colors

Colors accept:

- names: `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`, `orange`, `purple`, ...
- RGB: `rgb(255, 0, 0)` or `255,0,0`
- hex: `#ff0000`

Named colors are attenuated (muted) so backgrounds stay easy on the eyes — for
example `red` becomes roughly `(45, 0, 0)` in RGB. Explicit RGB/hex values are
used as given.

When no text color is specified, the terminal text is set automatically to the
color that contrasts best with the selected background so it stays readable.

## Examples

```bash
# three terminals, one red/green/blue background each
colterminal -c "red,green,blue"

# three terminals, each named by arguments, all of them in different colors.
colterminal -n "custom,custom2,custo3"

# two PowerShell terminals with paired background and text colors
colterminal -p powershell -c "red,green" -t "white,black"

# four terminals with distinct automatic backgrounds, named by index
colterminal -l 4 -
```

## How it works

Each terminal window is launched through `WScript.Shell.Run` (via a temporary
`cscript` script) so every window gets its own console and stays open
independently. CMD windows use the classic 16-color `color` command; PowerShell
windows are colored through the console host (`$Host.UI.RawUI` / `[Console]`).
