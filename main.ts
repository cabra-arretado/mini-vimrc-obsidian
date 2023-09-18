import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Workspace, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

enum MapMode {
	'nmap' = 'normal',
	'vmap' = 'visual',
	'imap' = 'insert',
}


export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	private CodeMirrorVimObj: any = null;
	private vimrc_path: string = '.vimrc';
	

	//////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////
	/* PLUGIN LOGIC HERE */

	click_ribbon_icon() {
		// Right now that is just the entrypoint for the plugin
		if (this.CodeMirrorVimObj) {
			this.process_vimrc();
		}
		new Notice('Loaded vimrc');
	}

	get_view(): MarkdownView | null {
		return this.app.workspace.getActiveViewOfType(MarkdownView);
	}

	async process_vimrc(): Promise<void> {
		/* Reads and executes one-by-one lines of the Vimrc file */
		let file = await this.read_file(this.vimrc_path);
		let lines = file.split('\n');
		console.log("Processing vimrc file", lines.length, "lines");
		for (let line of lines) {
			this.process_line(line)
		}
		new Notice('vimrc loaded')
	}

	process_line(line: string): void {
		/* Process a single line and runs the command there */
		this.process_maps(line)
	}

	async read_file(path: string): Promise<string> {
		try {
			let file = await this.app.vault.adapter.read(path);
			console.log(`Read file ${path}`);
			return file;
		}
		catch (err) {
			new Notice(`Could not find the file in ${path}`)
			throw new Error(`Failed to read file ${path}`);
		}
	}

	set_vim_keybidding(lhs: string, rhs: string, mode: string = 'normal') {
		/* Set keybidings of imap, nmap, vmap */
		(this.CodeMirrorVimObj as any).map(lhs, rhs, mode);
		console.log(`set_vim_keybidding: ${lhs} -> ${rhs} in ${mode} mode`)
	};

	async initialize() {
		/* Runs in the onload() */
		this.CodeMirrorVimObj = (window as any).CodeMirrorAdapter?.Vim;
		if (this.CodeMirrorVimObj) {
			// console.log('CMObj Present')
		}
	}

	process_maps(line: string) {
		let map_args = line.trim().split(' ');
		//TODO: Check if it is on the enum
		let mapMode = MapMode[map_args[0] as keyof typeof MapMode].toString();
		if (!mapMode){
			console.log('Could not map line.', line, '. There is no map command')
			return
		}
		let lhs = map_args[1];
		let rhs = map_args[2];
		if (!lhs || !rhs){
			console.log('Could not map line.', line, 'lhs or rhs not present')
			return
		}
		console.log(`Successfully mapped! ${line}`)
		this.set_vim_keybidding(lhs, rhs, mapMode);
	}

	
	/* END PLUGIN LOGIC */
	//////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////

	async onload() {
		await this.initialize();
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			this.click_ribbon_icon();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
