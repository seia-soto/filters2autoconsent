import test from 'ava';
import {NodeTypes, parse} from '.';

test('RuleDeclaration', t => {
	const content = 'domain.tld##test';
	const file = parse(content);

	t.is(file.start, 0);
	t.is(file.end, content.length);

	const rule = file.body[0];

	t.is(rule.type, NodeTypes.RuleDeclaration);
	t.is(content.slice(rule.start, rule.end), content);
	t.is(content.slice(rule.domain.start, rule.domain.end), 'domain.tld');
	t.is(content.slice(rule.detectionSelector.start, rule.detectionSelector.end), 'test');
});

test('RuleDeclaration and ChainableDeclaration', t => {
	const content = `domain.tld##test
-div:waitFor(timeout: 500):click()
+button:waitFor():click(all: true)`;
	const file = parse(content);

	t.deepEqual(file, {
		type: 'File',
		start: 0,
		end: 86,
		body: [
			{
				type: 'RuleDeclaration',
				start: 0,
				end: 86,
				domain: {
					type: 'Identifier',
					start: 0,
					end: 10,
					value: 'domain.tld',
				},
				detectionSelector: {
					type: 'Identifier',
					start: 12,
					end: 16,
					value: 'test',
				},
				chains: [
					{
						type: 'ChainableDeclaration',
						start: 17,
						end: 51,
						positive: false,
						actions: [
							{
								type: 'ActionDeclaration',
								kind: 'waitFor',
								start: 21,
								end: 42,
								options: [
									{
										name: {
											type: 'Identifier',
											start: 30,
											end: 37,
											value: 'timeout',
										},
										value: {
											type: 'Identifier',
											start: 39,
											end: 42,
											value: '500',
										},
									},
								],
							},
							{
								type: 'ActionDeclaration',
								kind: 'click',
								start: 43,
								end: 50,
								options: [],
							},
						],
						selector: {
							type: 'Identifier',
							start: 18,
							end: 21,
							value: 'div',
						},
					},
					{
						type: 'ChainableDeclaration',
						start: 52,
						end: 86,
						positive: true,
						actions: [
							{
								type: 'ActionDeclaration',
								kind: 'waitFor',
								start: 59,
								end: 68,
								options: [],
							},
							{
								type: 'ActionDeclaration',
								kind: 'click',
								start: 69,
								end: 85,
								options: [
									{
										name: {
											type: 'Identifier',
											start: 76,
											end: 79,
											value: 'all',
										},
										value: {
											type: 'Identifier',
											start: 81,
											end: 85,
											value: 'true',
										},
									},
								],
							},
						],
						selector: {
							type: 'Identifier',
							start: 53,
							end: 59,
							value: 'button',
						},
					},
				],
				options: [],
			},
		],
	});
});

test('RuleDeclarationOptions', t => {
	const content = 'domain.tld##test[$id="value"]$cosmetic,name=test';
	const file = parse(content);

	t.deepEqual(file, {
		type: 'File',
		start: 0,
		end: 48,
		body: [
			{
				type: 'RuleDeclaration',
				start: 0,
				end: 48,
				domain: {
					type: 'Identifier',
					start: 0,
					end: 10,
					value: 'domain.tld',
				},
				detectionSelector: {
					type: 'Identifier',
					start: 12,
					end: 48,
					value: 'test[$id="value"]',
				},
				chains: [],
				options: [
					{
						name: {
							type: 'Identifier',
							start: 30,
							end: 38,
							value: 'cosmetic',
						},
					},
					{
						name: {
							type: 'Identifier',
							start: 39,
							end: 43,
							value: 'name',
						},
						value: {
							type: 'Identifier',
							start: 44,
							end: 48,
							value: 'test',
						},
					},
				],
			},
		],
	});
});
