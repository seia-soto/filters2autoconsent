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
-div:waitFor(timeout: 500)`;
	const file = parse(content);

	t.deepEqual(file, {
		type: 'File',
		start: 0,
		end: 43,
		body: [
			{
				type: 'RuleDeclaration',
				start: 0,
				end: 43,
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
						end: 43,
						positive: false,
						actions: [
							{
								type: 'ActionDeclaration',
								action: 'waitFor',
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
											start: 38,
											end: 42,
											value: ' 500',
										},
									},
								],
							},
						],
						selector: {
							type: 'Identifier',
							start: 18,
							end: 21,
							value: 'div',
						},
					},
				],
			},
		],
	});
});
