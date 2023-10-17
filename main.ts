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
enum UnmapMode {
	'nunmap' = 'normal',
	'vunmap' = 'visual',
	'iunmap' = 'insert',
	'unmap' = 'sentinel_value',
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
	private is_unmap(first_token: string): boolean {
		/* Checks if the line is a unmap command */
		return first_token in MapMode;
	}

	private process_line(line: string): void {
		/* Process a single line and runs the command there */
		let trimmed_line = line.trim();
		if (trimmed_line.startsWith('"') || trimmed_line.length == 0) {
			// Ignore comments and empty lines
			return
		}
		let line_tokens = trimmed_line.split(' ');
		if (this.is_map(line_tokens[0])) {
			this.process_maps(line_tokens);
		}
		else if (this.is_unmap(line_tokens[0])) {
			this.process_unmaps(line_tokens);
		}
		else {
			this.logger('Could not process line', line_tokens[0], 'is not a map or unmap command');
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

	//TODO: do we need that default normal?
	private set_vim_map(lhs: string, rhs: string, mode: string = 'normal'): void {
		/* Set keybidings of imap, nmap, vmap */
		let cmo = this.CodeMirrorVimObj as any;
		if (mode === MapMode['map']) {
			cmo.map(lhs, rhs);
			return
		}
		cmo.map(lhs, rhs, mode);
		this.logger(`set_vim_map: (${lhs}, ${rhs}, ${mode})`)
	};

	private set_vim_unmap(lhs: string, mode: string): void {
		let cmo = this.CodeMirrorVimObj as any;
		if (mode === UnmapMode['unmap']) {
			cmo.unmap(lhs);
			return
		}
		cmo.unmap(lhs, mode);
		this.logger(`set_vim_unmap: (${lhs}, ${mode})`)
	}

	private async initialize() {
		/* Runs in the onload() */
		if (!this.CodeMirrorVimObj) {
			this.CodeMirrorVimObj = (window as any).CodeMirrorAdapter?.Vim;
		}
	}

	private process_maps(line_tokens: string[]) {
		/* Process the map command */
		let mapMode = MapMode[line_tokens[0] as keyof typeof MapMode].toString();
		//TODO: maybe the bellow is not needed since we are proceesing the keywords in the process_line()
		if (!mapMode) {
			this.logger('Could not map line.', ...line_tokens, '. There is no map command')
			return
		}
		let lhs = line_tokens[1];
		let rhs = line_tokens[2];
		if (!lhs || !rhs) {
			this.logger('Could not map line.', ...line_tokens, 'lhs or rhs not present')
			return
		}
		this.logger(`Successfully mapped! ${line_tokens}`)
		this.set_vim_map(lhs, rhs, mapMode);
	}

	private process_unmaps(line: string[]) {
		/* Process the unmap command */
		let unmapMode = UnmapMode[line[0] as keyof typeof UnmapMode].toString();
		//TODO: maybe the bellow is not needed since we are proceesing the keywords in the process_line()
		if (!unmapMode) {
			this.logger('Could not map line.', ...line, '. There is no unmap command')
			return
		}
		let lhs = line[1];
		if (!lhs) {
			this.logger('Could not map line.', ...line, 'lhs not present')
			return
		}
		this.logger(`Successfully unmapped! Line: ${line}`)
		this.set_vim_unmap(lhs, unmapMode);
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

