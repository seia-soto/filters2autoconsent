import test from 'ava';
import {parse} from '.';

test('parse', t => {
	const content = 'domain.tld##test';
	const file = parse(content);

	t.is(file.start, 0);
	t.is(file.end, content.length);

	const rule = file.body[0];

	t.is(content.slice(rule.start, rule.end), content);
	t.is(content.slice(rule.domain.start, rule.domain.end), 'domain.tld');
	t.is(content.slice(rule.detectionSelector.start, rule.detectionSelector.end), 'test');
});
