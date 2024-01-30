export type CmpAction = {
	exists: string;
} | {
	visible: string;
	check: 'any' | 'all' | 'none';
} | {
	waitFor: string;
	timeout: number;
} | {
	waitForVisible: string;
	timeout: number;
	check: 'any' | 'all' | 'none';
} | {
	click: string;
	all: boolean;
} | {
	waitForThenClick: string;
	timeout: number;
	all: boolean;
} | {
	wait: number;
} | {
	hide: string;
	method: 'display' | 'opacity';
} | {
	eval: string;
} | {
	if: {exists: string};
	then: CmpAction[];
	else: CmpAction[];
} | {
	any: CmpAction[];
};

export type AutoCmp = {
	name: string;
	detectCMP: CmpAction[];
	detectPopup: CmpAction[];
	optOut: CmpAction[];
	optIn: CmpAction[];
	prehideSelectors?: string[];
	cosmetic?: boolean;
	intermediate?: boolean;
	runContext?: {
		main?: boolean;
		frame?: boolean;
		urlPattern?: string;
	};
	test?: CmpAction[];
};
