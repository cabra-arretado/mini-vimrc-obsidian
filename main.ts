import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MiniVimrcSettings {
	vimrcPath: string;
}

const DEFAULT_SETTINGS: MiniVimrcSettings = {
	vimrcPath: '.vimrc'
}

const MapMode = {
	'nmap': 'normal',
	'vmap': 'visual',
	'imap': 'insert',
	'map': 'map',
	'unmap': 'unmap',
} as const

export default class MiniVimrc extends Plugin {
	settings: MiniVimrcSettings;
	private CodeMirrorVimObj: any = null;
	private vimrcPath: string;

	private async process_vimrc(): Promise<void> {
		if (this.vimrcPath) {
			/* Reads and executes one-by-one lines of the Vimrc file */
			const file = await this.read_file(this.vimrcPath);
			const lines = file.split('\n');
			this.logger(`Processing vimrc file ${lines.length.toString()} lines`);
			for (const line of lines) {
				this.process_line(line);
			}
			new Notice('Vimrc loaded!')
		}
	}

	private is_map(first_token: string): boolean {
		/* Checks if the line is a map command */
		return first_token in MapMode;
	}

	private process_line(line: string): void {
		/* Process a single line and runs the command there */
		const trimmed_line = line.trim();
		// Ignore comments and empty lines
		if (trimmed_line.startsWith('"') || trimmed_line.length == 0) {
			return
		}
		const line_tokens = trimmed_line.split(' ');
		if (this.is_map(line_tokens[0])) {
			this.process_maps(line_tokens);
		}
		else {
			this.logger(`Could not process line "${line_tokens.join(" ")}". ${line_tokens[0]} is not a map or unmap command`);
		}
	}

	private async read_file(path: string): Promise<string> {
		/* The name says it all */
		try {
			this.logger(`Attempting to read vimrc file in path "${path}"`);
			const file = await this.app.vault.adapter.read(path);
			return file.trim();
		}
		catch (err) {
			new Notice(`Could not find the vimrc file in ${path}`)
			throw new Error(`Failed to read file ${path}`);
		}
	}

	private set_vim_map(lhs: string, rhs: string, mode: string): void {
		/* Set keybidings of map, imap, nmap, vmap */
		const cmo = this.CodeMirrorVimObj as any;
		this.logger(`set_vim_map: (${lhs} ${rhs} ${mode})`)
		if (mode === MapMode['map']) {
			cmo.map(lhs, rhs);
			return
		}
		cmo.map(lhs, rhs, mode);
	}

	private set_vim_unmap(lhs: string): void {
		const cmo = this.CodeMirrorVimObj as any;
		this.logger(`set_vim_unmap: ${lhs}`)
		cmo.unmap(lhs)
	}

	private async initialize() {
		/* Runs in the onload() */
		if (!this.CodeMirrorVimObj) {
			this.CodeMirrorVimObj = (window as any).CodeMirrorAdapter?.Vim;
		}
		// Let's make sure that the user has not erased the path
		if (this.settings.vimrcPath) {
			this.logger("Custom vimrc file path set.")
			this.vimrcPath = this.settings.vimrcPath
		} else {
			this.logger("No custom vimrc file path set. Using default.")
			this.vimrcPath = DEFAULT_SETTINGS.vimrcPath
			this.settings.vimrcPath = DEFAULT_SETTINGS.vimrcPath
		}
	}

	private process_maps(line_tokens: string[]) {
		/* Process the map command */
		const mapMode = MapMode[line_tokens[0] as keyof typeof MapMode].toString();
		const lhs = line_tokens[1];
		const rhs = line_tokens[2];
		if (mapMode === MapMode['unmap']) {
			this.set_vim_unmap(lhs)
			return
		}
		if (!lhs || !rhs) {
			this.logger(`Could not map line: ${line_tokens.join(" ")}. lhs or rhs not present`)
			return
		}
		this.set_vim_map(lhs, rhs, mapMode);
	}

	private logger(message: string): void {
		/* To log messages to user */
		const prefix = 'Mini Vimrc Plugin:';
		console.log(prefix, message)
	}

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this))
		await this.initialize();
		if (this.CodeMirrorVimObj) {
			await this.process_vimrc();
		}
	}

	onunload() {
		/* Runs when the user deactivate the plugin on the Settings */
		if (this.CodeMirrorVimObj) {
			this.CodeMirrorVimObj.mapclear();
			this.logger('Unloaded vimrc');
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingsTab extends PluginSettingTab {
	plugin: MiniVimrc

	constructor(app: App, plugin: MiniVimrc) {
		super(app, plugin)
		this.plugin = plugin
	}

	display() {
		const { containerEl } = this
		containerEl.empty()

		containerEl.createEl('h1', { text: 'Mini Vimrc Settings' })

		const documentationUrl = "https://github.com/cabra-arretado/mini-vimrc-obsidian"

		const settingsDescription = containerEl.createDiv()

		settingsDescription.appendChild(
			createEl('span', {
				text: 'See '
			})
		);

		settingsDescription.appendChild(
			createEl('a', {
				text: "documentation",
				href: documentationUrl
			})
		);
		settingsDescription.appendText(' for details.');

		containerEl.createEl('br')

		new Setting(containerEl)
			.setName('Vimrc path')
			.setDesc('Relative path to the target vimrc file.')
			.addText((text) => {
				text.setPlaceholder(DEFAULT_SETTINGS.vimrcPath);
				text.setValue(this.plugin.settings.vimrcPath || DEFAULT_SETTINGS.vimrcPath);
				text.onChange(value => {
					this.plugin.settings.vimrcPath = value;
					this.plugin.saveSettings();
				})
			});
	}
}
