import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

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
			new Notice('Loaded vimrc');
		}
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
		if (this.CodeMirrorVimObj) {
			this.process_vimrc();
			new Notice('Loaded vimrc');
		}
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

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

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;
	//TODO: Add .vimrc path here

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
