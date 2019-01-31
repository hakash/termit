# Termit - The TERMinal edITor

Termit is a simple terminal editor somewhat inspired by Nano. It delivers the most basic text editing features like writing (obviously), cutting lines and uncutting or pasting lines.

Navigation includes arrow keys, page up and down, home and end on each line as well as start of document and end of document.

Running it from the terminal allows you to pass in a filepath argument which it will try to open. If it does not exist, it will try to create it on first save.

You can _Save_, _Save As_, _Open_, _Exit & Save_ and _Exit_ using keyboard shortcuts.

## Keymap


| Key    | Action       |
|--------|--------------|
| Ctrl+S |  Save        |
| Ctrl+A |  Save As     |
| Ctrl+O |  Open        |
| Ctrl+X |  Save & Exit |
| Ctrl+C |  Exit        |

## Embedding

The biggest feature of Termit is it's ability to be embedded inside your own terminal application