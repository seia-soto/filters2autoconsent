import test from 'ava';
import {transform} from '.';
import {parse} from '../parser';

test('transform', t => {
	const content = `domain.tld##test
+button[action="optIn"]:click()
-button[action="optOut"]:waitForVisible():click()`;
	const file = parse(content);

	const cmp = transform(file.body[0]);

	t.deepEqual(cmp, {
		cosmetic: false,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		detectCMP: [
			{
				exists: 'test',
			},
		],
		detectPopup: [
			{
				check: 'any',
				visible: 'test',
			},
		],
		intermediate: false,
		name: 'domain.tld',
		optIn: [
			{
				all: false,
				click: 'button[action="optIn"]',
			},
		],
		optOut: [
			{
				check: 'any',
				timeout: 0,
				waitForVisible: 'button[action="optOut"]',
			},
			{
				all: false,
				click: 'button[action="optOut"]',
			},
		],
		runContext: {
			frame: false,
			main: false,
		},
	});
});
