import {ActionTypes, type ActionDeclaration, type RuleDeclaration} from '../parser';
import {type AutoCmp, type CmpAction} from '../types/autoconsent';

// Options
const hasKey = (obj: ActionDeclaration | RuleDeclaration, key: string) => typeof obj.options.find(option => option.name.value === key) !== 'undefined';

const getOption = (obj: ActionDeclaration | RuleDeclaration, key: string) => obj.options.find(option => option.name.value === key)?.value?.value;

const isVisibleCheckOption = (text?: string): text is 'any' | 'all' | 'none' => ['any', 'all', 'none'].includes(text!);

const isHideMethodOption = (text?: string): text is 'display' | 'opacity' => ['display', 'opacity'].includes(text!);

const useCheck = (text = 'any') => {
	if (isVisibleCheckOption(text)) {
		return text;
	}

	return 'any';
};

const useMethod = (text = 'display') => {
	if (isHideMethodOption(text)) {
		return text;
	}

	return 'display';
};

const useNumeric = (text = '0') => {
	const n = parseInt(text, 10);

	if (isNaN(n)) {
		return 0;
	}

	return n;
};

// Actions
const transformExistsAction = (_action: ActionDeclaration, self: string): CmpAction => ({
	exists: self,
});

const transformCheckAction = (action: ActionDeclaration, self: string): CmpAction => ({
	visible: self,
	check: useCheck(getOption(action, 'check')),
});

const transformWaitForAction = (action: ActionDeclaration, self: string): CmpAction => ({
	waitFor: self,
	timeout: useNumeric(getOption(action, 'timeout')),
});

const transformWaitForVisibleAction = (action: ActionDeclaration, self: string): CmpAction => ({
	waitForVisible: self,
	timeout: useNumeric(getOption(action, 'check')),
	check: useCheck(getOption(action, 'check')),
});

const transformClickAction = (action: ActionDeclaration, self: string): CmpAction => ({
	click: self,
	all: hasKey(action, 'all'),
});

const transformWaitForThenClickAction = (action: ActionDeclaration, self: string): CmpAction => ({
	waitForThenClick: self,
	timeout: useNumeric(getOption(action, 'timeout')),
	all: hasKey(action, 'all'),
});

const transformWaitAction = (action: ActionDeclaration, _self: string): CmpAction => ({
	wait: useNumeric(getOption(action, 'for')) || useNumeric(getOption(action, '_')),
});

const transformHideAction = (action: ActionDeclaration, self: string): CmpAction => ({
	hide: self,
	method: useMethod(getOption(action, 'method')),
});

const transformEvalAction = (action: ActionDeclaration, _self: string): CmpAction => ({
	eval: getOption(action, '_') ?? '',
});

export const transform = (rule: RuleDeclaration): AutoCmp => {
	const name = rule.options.find(option => option.name.value === 'name')?.value?.value
    ?? rule.domain.value;

	const optIn: CmpAction[] = [];
	const optOut: CmpAction[] = [];

	for (const chain of rule.chains) {
		const actions: CmpAction[] = [];

		for (const action of chain.actions) {
			const self = chain.selector.value;

			switch (action.kind) {
				case ActionTypes.Exists: {
					actions.push(transformExistsAction(action, self));

					break;
				}

				case ActionTypes.Visible: {
					actions.push(transformCheckAction(action, self));

					break;
				}

				case ActionTypes.WaitFor: {
					actions.push(transformWaitForAction(action, self));

					break;
				}

				case ActionTypes.WaitForVisible: {
					actions.push(transformWaitForVisibleAction(action, self));

					break;
				}

				case ActionTypes.Click: {
					actions.push(transformClickAction(action, self));

					break;
				}

				case ActionTypes.WaitForThenClick: {
					actions.push(transformWaitForThenClickAction(action, self));

					break;
				}

				case ActionTypes.Wait: {
					actions.push(transformWaitAction(action, self));

					break;
				}

				case ActionTypes.Hide: {
					actions.push(transformHideAction(action, self));

					break;
				}

				case ActionTypes.Eval: {
					actions.push(transformEvalAction(action, self));

					break;
				}

				default: {
					continue;
				}
			}
		}

		if (chain.positive) {
			optIn.push(...actions);
		} else {
			optOut.push(...actions);
		}
	}

	const cmp: AutoCmp = {
		name,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		detectCMP: [
			{
				exists: rule.detectionSelector.value,
			},
		],
		detectPopup: [
			{
				visible: rule.detectionSelector.value,
				check: 'any',
			},
		],
		optIn,
		optOut,
		cosmetic: hasKey(rule, 'cosmetic'),
		intermediate: hasKey(rule, 'intermediate'),
		runContext: {
			main: hasKey(rule, 'main'),
			frame: hasKey(rule, 'frame'),
		},
	};

	const at = getOption(rule, 'at');

	if (at) {
		cmp.runContext!.urlPattern = at;
	}

	return cmp;
};
