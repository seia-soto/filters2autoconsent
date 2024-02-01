import {existsSync} from 'fs';
import {mkdir, readFile, stat, writeFile} from 'fs/promises';
import {dirname} from 'path';
import {parseArgs} from 'util';
import {parse} from './parser';
import {transform} from './transformer';
import {type AutoCmp} from './types/autoconsent';

const hasDir = async (dir: string) => {
	if (!existsSync(dir)) {
		return false;
	}

	const info = await stat(dir);

	return info.isDirectory();
};

const hasFile = async (file: string) => {
	if (!existsSync(file)) {
		return false;
	}

	const info = await stat(file);

	return info.isFile();
};

const getFile = async (file: string) => {
	const content = await readFile(file, 'utf8');

	return content;
};

const hasStdin = async () => !process.stdin.isTTY;

const getStdin = async () => new Promise<string>(resolve => {
	let data = '';

	process.stdin.addListener('data', buffer => {
		data += buffer.toString();
	});
	process.stdin.addListener('close', error => {
		if (error) {
			throw new Error('There was an error while reading stdin!');
		}

		process.stdin.removeAllListeners();
		resolve(data);
	});
});

const use = (content: string) => {
	const tree = parse(content);
	const cmps: AutoCmp[] = [];

	for (const rule of tree.body) {
		cmps.push(transform(rule));
	}

	return cmps;
};

const {values} = parseArgs({
	options: {
		file: {
			type: 'string',
			short: 'f',
		},
		out: {
			type: 'string',
			short: 'o',
		},
		pretty: {
			type: 'boolean',
			short: 'p',
		},
	},
});

const handleFile = async (input: string) => {
	if (!await hasFile(input)) {
		throw new Error('The input file was not found!');
	}

	const content = await getFile(input);
	const cmps = use(content);

	return cmps;
};

const handleStdin = async () => {
	if (!await hasStdin()) {
		throw new Error('The stdin was not found!');
	}

	const content = await getStdin();
	const cmps = use(content);

	return cmps;
};

const main = async () => {
	let handler: Promise<AutoCmp[]>;

	if (values.file) {
		handler = handleFile(values.file);
	} else {
		handler = handleStdin();
	}

	const cmps = await handler;
	let out: string;

	if (values.pretty) {
		out = JSON.stringify(cmps, null, 2);
	} else {
		out = JSON.stringify(cmps);
	}

	if (values.out) {
		const dir = dirname(values.out);

		if (!await hasDir(dir)) {
			await mkdir(dir, {recursive: true});
		}

		await writeFile(values.out, out, 'utf8');
	} else {
		console.log(out);
	}
};

void main();
