import { Notice, Plugin } from 'obsidian';

interface MiniVimrcSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MiniVimrcSettings = {
	mySetting: 'default'
}

enum MapMode {
	'nmap' = 'normal',
	'vmap' = 'visual',
	'imap' = 'insert',
	'map' = 'sentinel_value',
}

export default class MiniVimrc extends Plugin {
	settings: MiniVimrcSettings;
	private CodeMirrorVimObj: any = null;
	private vimrc_path: string = '.vimrc';

	private async process_vimrc(): Promise<void> {
		/* Reads and executes one-by-one lines of the Vimrc file */
		let file = await this.read_file(this.vimrc_path);
		let lines = file.split('\n');
		this.logger("Processing vimrc file", lines.length.toString(), "lines");
		for (let line of lines) {
			this.process_line(line);
		}
		new Notice('Vimrc loaded!')
	}

	private is_map(first_token: string): boolean {
		/* Checks if the line is a map command */
		return first_token in MapMode;

	}

	private process_line(line: string): void {
		/* Process a single line and runs the command there */
		let trimmed_line = line.trim();
		if (trimmed_line.startsWith('"') || trimmed_line.length == 0) {
			// Ignore comments and empty lines
			return
		}
		let line_map = trimmed_line.split(' ');
		if (this.is_map(line_map[0])) {
			this.process_maps(trimmed_line.split(' '))
		}
	}



	private async read_file(path: string): Promise<string> {
		/* The name says it all */
		try {
			let file = await this.app.vault.adapter.read(path);
			this.logger(`Read file ${path}`);
			return file.trim();
		}
		catch (err) {
			new Notice(`Could not find the file in ${path}`)
			throw new Error(`Failed to read file ${path}`);
		}
	}

	private set_vim_keybidding(lhs: string, rhs: string, mode: string = 'normal'): void {
		/* Set keybidings of imap, nmap, vmap */
		let cmo = this.CodeMirrorVimObj as any;
		if (mode === MapMode['map']) {
			cmo.map(lhs, rhs);
			return
		}
		cmo.map(lhs, rhs, mode);
		this.logger(`set_vim_keybidding: (${lhs}, ${rhs}, ${mode})`)
	};

	private async initialize() {
		/* Runs in the onload() */
		if (!this.CodeMirrorVimObj) {
			this.CodeMirrorVimObj = (window as any).CodeMirrorAdapter?.Vim;
		}
	}

	private process_maps(line: string[]) {
		/* Process the map command */
		// TODO: Remove that from here (this logic is being handled in process_line/is_map)
		if (!(line[0] in MapMode)) {
			console.log(`'${line[0]}' not supported`)
			return
		}

		let mapMode = MapMode[line[0] as keyof typeof MapMode].toString();
		if (!mapMode) {
			this.logger('Could not map line.', ...line, '. There is no map command')
			return
		}
		let lhs = line[1];
		let rhs = line[2];
		if (!lhs || !rhs) {
			this.logger('Could not map line.', ...line, 'lhs or rhs not present')
			return
		}
		this.logger(`Successfully mapped! ${line}`)
		this.set_vim_keybidding(lhs, rhs, mapMode);
	}

	private logger(...messages: string[]): void {
		/* To log messages to user */
		let prefix = 'Mini Vimrc Plugin:';
		console.log(prefix, messages);
	}

	async onload() {
		await this.initialize();
		await this.loadSettings();
		if (this.CodeMirrorVimObj) {
			await this.process_vimrc();
		}
	}

	onunload() {
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

