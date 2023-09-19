# Mini Vim Keymaps Obsidian Plugin
In this repo we look for creating a minimal plugin for Obsidian that does only one thing and does it well: *Set Vim basic settings to Obsidian Vim mode*

## Supported Vim settings
- [x] imap
- [x] nmap
- [x] vmap
- [ ] iunmap
- [ ] vunmap
- [ ] nunmap
- [ ] map

## Getting started
Create an `.vimrc` in the root of your Obsidian vault with the desired commands.


### Motivation
Obsidian offeers a Vim mode editor, powered by CodeMirror. Keymaps work in such envirironment, but by default it doesn't allow users to automatically set keymaps as it is initiazated. That causes the user to have to manually enter all the desired keymaps every time one opens Obsidian.

There is where this plugin gets in the game: With an `.vimrc` file in the Obsidian vault, we will be able to declare keymaps and set basic optiosn to be automatically initialized everytime Obisian is open.

### Why a plugin that do only keymaps and not only all the other Vim configurations?
We want to create a plugin that is minimal and perform only one function.
With that design the plugin becomes:
* *Easier to understand*: So even without a lot of context one can checkout the plugin code before adding to your Obisidian vault.
* *Maintainable*: So that if any API changes Obisidan or its depedencies happens, we can easily update the code and functionality.

If you are looking for a more complete functionality plugin you should check out: [obsidian-vimrc-support](https://github.com/esm7/obsidian-vimrc-support)

### Inspiration
* obsidian-vimrc-support (https://github.com/esm7/obsidian-vimrc-support)
