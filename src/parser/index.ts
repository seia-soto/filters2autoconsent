export enum Keywords {
	RuleDeclaration = '##',
	NegativeChainableStart = '-',
	PositiveChainableStart = '+',
	Colon = ':',
	ChainableActionOptionsStart = '(',
	ChainableActionOptionsEnd = ')',
	ParameterDelimiter = ',',
	LineBreak = '\n',
}

export enum NodeTypes {
	File = 'File',
	RuleDeclaration = 'RuleDeclaration',
	ChainableDeclaration = 'ChainableDeclaration',
	ActionDeclaration = 'ActionDeclaration',
	Identifier = 'Identifier',
}

export type BaseNode = {
	type: NodeTypes;
	start: number;
	end: number;
};

export type File = BaseNode & {
	type: NodeTypes.File;
	body: RuleDeclaration[];
};

export type RuleDeclaration = BaseNode & {
	type: NodeTypes.RuleDeclaration;
	domain: Identifier;
	detectionSelector: Identifier;
	chains: ChainableDeclaration[];
};

export enum ActionTypes {
	Click = 'click',
	WaitFor = 'waitFor',
}

export const actionTypes = Object.values(ActionTypes);

export type ActionDeclaration = BaseNode & {
	type: NodeTypes.ActionDeclaration;
	action: ActionTypes;
	options: Array<{
		name: Identifier;
		value: Identifier;
	}>;
};

export type ChainableDeclaration = BaseNode & {
	type: NodeTypes.ChainableDeclaration;
	selector: Identifier;
	positive: boolean;
	actions: ActionDeclaration[];
};

export type Identifier = BaseNode & {
	type: NodeTypes.Identifier;
	value: string;
};

export class SyntaxError extends Error {
	constructor(message: string) {
		super(message);

		this.name = 'SyntaxError';
	}
}

const getNextLineBreakOrEoF = (i: number, text: string, eof: number) => {
	const nextLineBreak = text.indexOf(Keywords.LineBreak, i);

	if (nextLineBreak < 0) {
		return eof;
	}

	return nextLineBreak;
};

// RuleDeclaration
export const isRuleDeclarationLine = (i: number, text: string, hints: {nextLineBreak: number}) => {
	const nextRuleDeclaration = text.indexOf(Keywords.RuleDeclaration, i);

	return [nextRuleDeclaration < hints.nextLineBreak, {nextRuleDeclaration}] as const;
};

export const parseRuleDeclaration = (i: number, text: string, hints: {nextLineBreak: number; eof: number} & ReturnType<typeof isRuleDeclarationLine>[1]) => {
	let end = hints.nextLineBreak;

	const chains: ChainableDeclaration[] = [];

	for (let k = i; k < hints.eof; k++) {
		const [chainableDeclarationFound, chainableDeclarationHints] = isChainableDeclaration(k, text, {eof: hints.eof});

		if (!chainableDeclarationFound) {
			k = chainableDeclarationHints.eol;

			continue;
		}

		const chainableDeclaration = parseChainableDeclaration(k, text, chainableDeclarationHints);

		chains.push(chainableDeclaration);
		k = chainableDeclaration.end;
		end = k;
	}

	const ruleDeclaration: RuleDeclaration = {
		type: NodeTypes.RuleDeclaration,
		start: i,
		end,
		domain: {
			type: NodeTypes.Identifier,
			start: i,
			end: hints.nextRuleDeclaration,
			value: text.slice(i, hints.nextRuleDeclaration),
		},
		detectionSelector: {
			type: NodeTypes.Identifier,
			start: hints.nextRuleDeclaration + 2,
			end: hints.nextLineBreak,
			value: text.slice(hints.nextRuleDeclaration + 2, hints.nextLineBreak),
		},
		chains,
	};

	return ruleDeclaration;
};

// ChainableDeclaration
export const isChainableDeclaration = (i: number, text: string, hints: {eof: number}) => {
	const eol = getNextLineBreakOrEoF(i, text, hints.eof);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
	if (text[i] === Keywords.PositiveChainableStart) {
		return [true, {isPositive: true, eol}] as const;
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
	if (text[i] === Keywords.NegativeChainableStart) {
		return [true, {isPositive: false, eol}] as const;
	}

	return [false, {eol}] as const;
};

export const parseActionDeclarationOptions = (i: number, text: string, hints: {end: number}) => {
	const options: ActionDeclaration['options'] = [];

	let name: Identifier | false = false;
	let start = i;

	for (; i < hints.end; i++) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		if (text[i] === Keywords.Colon) {
			name = {
				type: NodeTypes.Identifier,
				start,
				end: i,
				value: text.slice(start, i),
			};

			// Reset `start` for next value
			start = i + 1;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		} else if (text[i] === Keywords.ParameterDelimiter) {
			if (!name) {
				throw new SyntaxError('The name of parameter delimiter was not found!');
			}

			options.push({
				name,
				value: {
					type: NodeTypes.Identifier,
					start,
					end: i,
					value: text.slice(start, i),
				},
			});

			// Reset `start` for next name
			start = i + 1;
		}
	}

	if (name) {
		options.push({
			name,
			value: {
				type: NodeTypes.Identifier,
				start,
				end: i - 1,
				value: text.slice(start, i - 1),
			},
		});
	}

	return options;
};

export const parseActionDeclarations = (i: number, text: string, hints: {eol: number}) => {
	const actions: ActionDeclaration[] = [];

	for (let k = i; k < hints.eol; k++) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		if (text[k] === Keywords.Colon) {
			const nextBracket = text.indexOf(Keywords.ChainableActionOptionsStart, k + 6 /* 1 + minimal len of action type */);

			if (nextBracket > hints.eol) {
				throw new SyntaxError('The start of chainable action options was not found!');
			}

			const nextClosingBracket = text.indexOf(Keywords.ChainableActionOptionsEnd, nextBracket + 1);

			if (nextBracket > hints.eol) {
				throw new SyntaxError('The end of chainable action options was not found!');
			}

			const kind = text.slice(k + 1, nextBracket) as ActionTypes;

			if (!actionTypes.includes(kind)) {
				continue;
			}

			const action: ActionDeclaration = {
				type: NodeTypes.ActionDeclaration,
				action: kind,
				start: k,
				end: nextClosingBracket,
				options: parseActionDeclarationOptions(nextBracket + 1, text, {end: nextClosingBracket + 1}),
			};

			actions.push(action);
		}
	}

	return actions;
};

export const parseChainableDeclaration = (i: number, text: string, hints: {isPositive: boolean; eol: number}) => {
	const actions = parseActionDeclarations(i, text, {eol: hints.eol});
	const chainableDeclaration: ChainableDeclaration = {
		type: NodeTypes.ChainableDeclaration,
		start: i,
		end: hints.eol,
		positive: hints.isPositive,
		actions,
		selector: {
			type: NodeTypes.Identifier,
			start: i + 1,
			end: actions[0].start,
			value: text.slice(i + 1, actions[0].start),
		},
	};

	return chainableDeclaration;
};

export const parse = (text: string) => {
	const file: File = {
		type: NodeTypes.File,
		start: 0,
		end: text.length,
		body: [],
	};

	for (let i = 0; i < file.end; i++) {
		const nextLineBreak = getNextLineBreakOrEoF(i + 1, text, file.end);
		const [ruleDeclarationFound, ruleDeclarationHints] = isRuleDeclarationLine(i, text, {nextLineBreak});

		if (ruleDeclarationFound) {
			const ruleDeclaration = parseRuleDeclaration(i, text, {...ruleDeclarationHints, nextLineBreak, eof: file.end});

			file.body.push(ruleDeclaration);
			i = ruleDeclaration.end;

			continue;
		}

		i = nextLineBreak;
	}

	return file;
};
