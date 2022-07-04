const path = require('path')
const jetpack = require('fs-jetpack')
const {renderFile} = require('./node-templates')(path.join(__dirname))
const {describe, it, assert} = require('@vaclav-purchart/js-test')

const loadSnapshot = (file) => jetpack.read(path.join(__dirname, file))

describe('node-templates', () => {
	it('simple example', () => {
		const result = renderFile(path.join(__dirname, 'tests/simple/test.ejs'))
		const expected = loadSnapshot('tests/simple/result-snapshot.html')
		assert.deepEqual(result, expected)
	})

	it('sub templates', () => {
		const result = renderFile(path.join(__dirname, 'tests/sub-template/test.ejs'))
		const expected = loadSnapshot('tests/sub-template/result-snapshot.html')
		assert.deepEqual(result, expected)
	})

	it('template args inheritance', () => {
		const result = renderFile(path.join(__dirname, 'tests/template-args-inheritance/test.ejs'), {inheritedParam: 'inheritance works!'})
		const expected = loadSnapshot('tests/template-args-inheritance/result-snapshot.html')
		assert.deepEqual(result, expected)
	})

	it('return shortcut', () => {
		const result = renderFile(path.join(__dirname, 'tests/return-shortcut/test.ejs'))
		const expected = loadSnapshot('tests/return-shortcut/result-snapshot.html')
		assert.deepEqual(result, expected)
	})

	// TODO: test error handling & offsets
	// TODO: test sandbox-pool context separation
	// TODO: test HTML validation
})
