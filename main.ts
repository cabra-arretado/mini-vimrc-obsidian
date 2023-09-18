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
	vimrc_path: string = '.vimrc';

	/* PLUGIN LOGIC HERE */
	click_ribbon_icon() {
		if (this.CodeMirrorVimObj) {
			// this.set_vim_keybidding('jk', '<Esc>');
			this.process_vimrc();
		}
		new Notice('Ribbon icon clicked!');
	}
	//TODO: 1: Function for deserialize vimrc file

	get_view(): MarkdownView | null {
		return this.app.workspace.getActiveViewOfType(MarkdownView);
	}

	async process_vimrc() {
		let file = await this.read_file(this.vimrc_path);
		let lines = file.split('\n');
		console.log("Processing vimrc file", lines.length, "lines");
		for (let line of lines) {
			if (line.length == 0) {
				continue;
			}
			console.log("Processing line", line);
			let line_arr = line.split(' ');
			let mapMode = MapMode[line_arr[0] as keyof typeof MapMode];
			let lhs = line_arr[1] as string;
			let rhs = line_arr[2] as string;
			console.log("mapMode", mapMode, "lhs", lhs, "rhs", rhs);
			this.set_vim_keybidding(lhs, rhs, mapMode.toString());
		}
	}

	async read_file(path: string): Promise<string> {
		try {
			let file = await this.app.vault.adapter.read(path);
			console.log(`Read file ${path}`);
			return file;
		}
		catch (err) {
			throw new Error(`Failed to read file ${path}`);
		}
	}

	set_vim_keybidding(lhs: string, rhs: string, mode: string = 'normal') {
		(this.CodeMirrorVimObj as any).map(lhs, rhs, mode);
		console.log(`set_vim_keybidding: ${lhs} -> ${rhs} in ${mode} mode`)
	};

	async initialize() {
		this.CodeMirrorVimObj = (window as any).CodeMirrorAdapter?.Vim;
		if (this.CodeMirrorVimObj) {
			console.log("CodeMirrorVimObj exists");
		}
	}
	/* END PLUGIN LOGIC */

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
