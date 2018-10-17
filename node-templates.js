/**
 * Simple template engine to run javascript snippets in your HTML.
 *
 * =======================
 * Usage:
 * =======================
 * <body>
 *	<%
 *    const renderer = require('./my-renderer')
 *    const data = require('lib/data')
 *    return renderer(data)
 *  *>
 * </body>
 *
 * >> Returned string is used instead of snippet code.
 *
 * =======================
 * Return shortcut:
 * =======================
 * <%= '1234' %>
 *
 * >> Above snippet is interpreted as <% return '1234' %> -> no need to write 'returns' for simple code
 *
 * =======================
 * Sub-templates:
 * =======================
 * One template can include other templates via require
 * ** main.template.ejs:
 * <body>
 *   <% return require('./sub.template.ejs')({
 *     templateTitle: 'custom title',  // <<< template arguments are injected into its global scope
 *   }) %>
 * </body>
 *
 * ** sub.template.ejs:
 * <h1>
 *   <%
 *     return `<b>${templateTitle}</b>`  // <<< templateTitle is filled with value from main.template.ejs
 *   %>
 * </h1>
 *
 * =======================
 * Notes:
 * =======================
 * - For intellisense & color highlighting use EJS file extensions.
 * - Each template is sandboxed by node's VM interface.
 * - Sub-templates inherits parent template parameters (but they can be overwritten by inline parameters)
 * - Module requires:
 *   - './' refer to a current template directory
 *   - 'lib/data' resolves as ${projectRoot}/lib/data
 *
 * =======================
 * TODO:
 * =======================
 * - lint template code
 */
const fs = require('fs')
const vm = require('vm')
const path = require('path')

const START_TAG = '<%'
const END_TAG = '%>'

const lineIndexOf = (needle, start, lines) => {
	for (let i = start.line; i < lines.length; i++) {
		const line = lines[i]
		const charPos = line.indexOf(needle, i === start.line ? start.char : 0)
		if (charPos >= 0) {
			return {
				line: i,
				char: charPos,
			}
		}
	}
	return null
}

const linesSubstring = (from, to, lines) => {
	if (from.line === to.line) {
		return lines[from.line].substring(from.char, to.char) + '\n'
	}

	let result = lines[from.line].substring(from.char) + '\n'
	for (let i = from.line + 1; i < to.line; i++) {
		result += lines[i] + '\n'
	}
	result += lines[to.line].substring(0, to.char)
	return result
}

const processCode = (code, start, file, dir, {projectRoot, templateArgs = {}}) => {
	if (code.startsWith('=')) code = 'return ' + code.substring(1)
	const sandbox = vm.createContext({
		...templateArgs,
		__filename: file,
		__dirname: dir,
		require: (modulePath) => {
			let newPath = modulePath
			// paths starting with '.' are resolved relatively to a currently processed template file
			if (newPath.startsWith('.')) newPath = path.join(dir, newPath.substring(1))
			// paths without '/', e.g., 'lib/metrics/facebook-posts' are resolved relatively to project folder
			if (newPath[0] !== '/') newPath = path.resolve(projectRoot, newPath)
			// sub-templates support (with arguments expanded to a sub-template global scope)
			if (newPath.endsWith('.ejs')) return (inlineArgs) => renderFile(projectRoot)(newPath, {...templateArgs, ...inlineArgs})
			try {
				return require(newPath)
			}
			catch (e) {
				// fallback to nodejs resolve & require
				return require(modulePath)
			}
		},
	})
	const result = vm.runInContext(`(function(){\n${code}\n})()`, sandbox, {
		filename: file,
		lineOffset: start.line - 1,
		columnOffset: start.char,
		displayErrors: true,
	})

	return result
}

const render = (projectRoot) => (file = '?', text, templateArgs) => {
	const lines = text.split('\n')
	let result = ''
	let start = {line: 0, char: 0}
	let end = {line: 0, char: 0}

	do {
		start = lineIndexOf(START_TAG, end, lines) // line, char
		if (start === null) { // no more EJS tags - collect results from last END
			result += linesSubstring(end, {line: lines.length - 1, char: lines[lines.length - 1].length}, lines)
			return result
		}
		result += linesSubstring(end, start, lines)

		end = lineIndexOf(END_TAG, start, lines) // line, char
		if (end === null) throw new Error(`[node-templates] END_TAG not found! Starting ${file}:${start.line}:${start.char}`)

		// we've got JS between <START; END>
		const code = linesSubstring({...start, char: start.char + START_TAG.length}, end, lines)

		const dir = path.normalize(file.replace(path.basename(file), ''))
		const codeResult = processCode(code, start, file, dir, {projectRoot, templateArgs})

		if (codeResult) { result += codeResult }

		end = {...end, char: end.char + END_TAG.length} // skip END_TAG

		start = end
	} while (end !== null)
}

const renderFile = (projectRoot) => (file, templateArgs) => {
	const text = fs.readFileSync(file, 'utf8')
	return render(projectRoot)(file, text, templateArgs)
}

module.exports = (projectRoot) => ({
	render: render(projectRoot),
	renderFile: renderFile(projectRoot),
})
