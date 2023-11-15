# Mini Vim Keymaps Obsidian Plugin
In this repo we look to create a minimal plugin for Obsidian that does only one thing and does it well: *Set Vim basic mappings to Obsidian Vim mode*

## Supported Vim settings
- [x] map
- [x] imap
- [x] nmap
- [x] vmap
- [x] unmap

## Getting started
FIRST OF ALL: Remember to Activate the Vim mode in your Vault. Settings -> Editor -> Vim key biddings

Create a `.vimrc` in the root of your Obsidian vault with the desired commands.

### Example of `.vimrc`
``` vimscript
" Use sequential pressing of keys j and k to escape insert mode (really common config for VIM)
imap jk <Esc>
imap JK <Esc>

" The keys j and k for visual and normal mode go to the visual line instead of the logical one (Really useful for a more organic experience)
map j gj
map k gk

" Uses H and L To navigate between blank lines in Visual and Normal modes.
map H {
map L }

" Uses K and J to scroll back and forth in Visual and Normal modes
map K <C-b>
map J <C-f>

" Uses ; to start commands in Visual and Normal modes
map ; :
```
### Settings
##### Vimrc path
The default path is on the root folder `.vimrc`.
You can change that to a Markdown file or a simple text file.
In any case, they will be treated as a `.vimrc` file, and each line will be read (and comment lines start with `"` as you can see in the example above).

A markdown file is an option in case you want to access and edit the file in Obsidian itself.
** Important: ** If you will use a Markdown file, make sure to add the file extension `.md`, not just the name of the file that you see in the Obsidian file explorer.

Another option is to use `.obsidian/.vimrc` just so that the file is in the same folder as the other Obsidian configurations.

## Motivation
Obsidian offers a Vim mode editor, powered by CodeMirror. Keymaps work in such an environment, but by default, it doesn't allow users to automatically set keymaps as it is initialized. That causes the user to have to manually enter all the desired keymaps every time one opens Obsidian.

This is where this plugin gets in the game: With a `.vimrc` file in the Obsidian vault, we will be able to declare keymaps and set basic options to be automatically initialized every time Obsidian is open.

## Why a plugin that does only keymaps and not only all the other Vim configurations?
We want to create a plugin that is minimal and performs only one function.
With that design, the plugin becomes:
* *Easier to understand*: So even without a lot of context one can check the plugin code before adding to your Obsidian vault.
* *Maintainable*: So that if any API changes Obsidian or its dependencies happen, we can easily update the code and functionality.

If you are looking for a more complete functionality plugin you should check out: [obsidian-vimrc-support](https://github.com/esm7/obsidian-vimrc-support)

## Inspiration
* [obsidian-vimrc-support](https://github.com/esm7/obsidian-vimrc-support)
