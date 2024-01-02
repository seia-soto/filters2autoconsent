export enum Keywords {
	RuleDeclaration = '##',
	NegativeChainableActionStart = '-',
	PositiveChainableActionStart = '+',
	LineBreak = '\n',
}

export enum NodeTypes {
	File = 'File',
	RuleDeclaration = 'RuleDeclaration',
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
};

export type Identifier = BaseNode & {
	type: NodeTypes.Identifier;
};

export class SyntaxError extends Error {
	constructor(message: string) {
		super(message);

		this.name = 'SyntaxError';
	}
}

const getNextLineBreakOrEoF = (i: number, text: string, eof: number) => {
	const nextLineBreak = text.indexOf(Keywords.LineBreak, i + 1);

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

	// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
	while (text[end + 1] === Keywords.NegativeChainableActionStart || text[end + 1] === Keywords.PositiveChainableActionStart) {
		end = getNextLineBreakOrEoF(i, text, hints.eof);
	}

	const ruleDeclaration: RuleDeclaration = {
		type: NodeTypes.RuleDeclaration,
		start: i,
		end,
		domain: {
			type: NodeTypes.Identifier,
			start: i,
			end: hints.nextRuleDeclaration,
		},
		detectionSelector: {
			type: NodeTypes.Identifier,
			start: hints.nextRuleDeclaration + 2,
			end: hints.nextLineBreak,
		},
	};

	return ruleDeclaration;
};

export const parse = (text: string) => {
	const file: File = {
		type: NodeTypes.File,
		start: 0,
		end: text.length,
		body: [],
	};

	for (let i = 0; i < file.end; i++) {
		const nextLineBreak = getNextLineBreakOrEoF(i, Keywords.LineBreak, file.end);

		if (i === nextLineBreak) {
			continue;
		}

		const [ruleDeclarationFound, ruleDeclarationHints] = isRuleDeclarationLine(i, text, {nextLineBreak});

		if (ruleDeclarationFound) {
			const ruleDeclaration = parseRuleDeclaration(i, text, {...ruleDeclarationHints, nextLineBreak, eof: file.end});

			file.body.push(ruleDeclaration);
			i = ruleDeclaration.end;
		}
	}

	return file;
};
